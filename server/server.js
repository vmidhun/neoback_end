
const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');

const app = express();

// Global state for system health monitoring
let db;
let dbLoadError = null;
let dbConnectionError = null;
let dbInitPromise = null;
let isSeeded = false;
const startTime = Date.now();

// 1. Core Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger for debugging Vercel path resolution
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// 2. Database Initialization Logic
try {
  // Use absolute-style resolution relative to this file
  db = require(path.join(__dirname, 'models', 'index.js'));
  console.log("Database models loaded successfully.");
} catch (err) {
  console.error("CRITICAL: Database models failed to load. Check server/models directory structure.");
  console.error("Model Load Error Details:", err); // Explicit console log for DB load errors
  dbLoadError = err;
}

const ensureDb = async () => {
  if (dbLoadError) {
    console.error("Database cannot initialize because models failed to load.");
    throw dbLoadError;
  }
  if (!db) {
    const err = new Error("Database module not initialized");
    console.error(err.message);
    throw err;
  }
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = (async () => {
    try {
      console.log("Attempting to connect to MongoDB...");
      await db.connectDB();
      console.log("MongoDB connected successfully.");
      if (!isSeeded) {
        await db.seed();
        isSeeded = true;
      }
      return true;
    } catch (err) {
      console.error("CRITICAL: MongoDB Connection Attempt Failed!");
      console.error("Connection Error Details:", err); // Explicit console log for DB connection errors as requested
      dbConnectionError = err;
      dbInitPromise = null; // Allow retry on next request
      throw err;
    }
  })();

  return dbInitPromise;
};

const getMaskedUri = (uri) => {
  if (!uri || typeof uri !== 'string') return "NOT_SET";
  return uri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");
};

// 3. PRIMARY API ENDPOINTS (Defined directly on 'app' for maximum visibility)

// Public System Health Endpoint
app.get('/api/status', async (req, res) => {
  // Trigger DB connection in background if not ready
  ensureDb().catch(() => {});

  let dbStatus = "Disconnected";
  let counts = { users: 0, projects: 0, tasks: 0, announcements: 0, holidays: 0, attendance: 0 };
  
  if (db && db.mongoose && db.mongoose.connection.readyState === 1) {
    dbStatus = "Connected";
    try {
      counts = {
        users: await db.User.countDocuments(),
        projects: await db.Project.countDocuments(),
        tasks: await db.Task.countDocuments(),
        announcements: await db.Announcement.countDocuments(),
        holidays: await db.Holiday.countDocuments(),
        attendance: await db.Attendance.countDocuments()
      };
    } catch (e) {
      console.error("Status count aggregation error:", e.message);
    }
  } else if (db && db.mongoose) {
    const states = { 0: 'Disconnected', 1: 'Connected', 2: 'Connecting', 3: 'Disconnecting' };
    dbStatus = states[db.mongoose.connection.readyState] || 'Unknown';
  }

  return res.status(200).json({
    uptime: Math.floor((Date.now() - startTime) / 1000),
    memoryUsage: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
    dbStatus,
    dbName: config.DB.NAME,
    dbUri: getMaskedUri(config.MONGODB_URI),
    dbError: dbConnectionError?.message || dbLoadError?.message || null,
    counts,
    isSeeded,
    timestamp: new Date().toISOString()
  });
});

// Admin Seed Endpoint
app.post('/api/admin/seed', async (req, res) => {
  try {
    await ensureDb();
    await db.seed(true);
    isSeeded = true;
    return res.json({ success: true, message: "Database reset and seeded." });
  } catch (err) {
    console.error("Manual seed failed:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 4. BUSINESS LOGIC ROUTING
const businessRoutes = require('./routes/index');

// Protect and mount the rest of the /api routes
app.use('/api', async (req, res, next) => {
  // Already handled endpoints
  if (req.path === '/status' || req.path === '/admin/seed') return next();
  
  try {
    await ensureDb();
    next();
  } catch (err) {
    return res.status(503).json({
      error: "Database Unavailable",
      message: "The backend is currently unable to communicate with the database.",
      details: err.message
    });
  }
}, businessRoutes);

// Explicit 404 for any unmatched /api requests to prevent HTML leakage
app.all('/api/*', (req, res) => {
  console.log(`404 at API route: ${req.method} ${req.url}`);
  return res.status(404).json({
    error: "API Resource Not Found",
    path: req.originalUrl,
    method: req.method,
    hint: "Verify your API path and method. /api/status should be available."
  });
});

// 5. FRONTEND SERVING
const projectRoot = process.cwd();

// Serve static assets
app.use(express.static(projectRoot, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// SPA Catch-all (serves the frontend app for any non-API route)
app.get('*', (req, res) => {
  // If it's an API-like request that reached here, it's definitely a 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: "Invalid API route structure" });
  }

  const indexPath = path.join(projectRoot, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error(`Index file not found at ${indexPath}`);
      res.status(500).send("Critical Error: index.html is missing. Ensure the frontend is built correctly.");
    }
  });
});

// Start Server for local development
if (require.main === module) {
  const port = config.PORT || 3000;
  app.listen(port, () => {
    console.log(`NEO Backend Monitor active on port ${port}`);
    ensureDb().catch(e => console.warn("Initial DB connection failed. Will retry on next request."));
  });
}

// Export for Vercel
module.exports = app;
