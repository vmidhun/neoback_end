
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

// Debug Middleware: Log incoming requests to help diagnose Vercel routing in logs
app.use((req, res, next) => {
  console.log(`[NEO-DEBUG] Request Received: ${req.method} ${req.url} (Path: ${req.path})`);
  next();
});

// 2. Database Initialization Logic
try {
  // Use absolute resolution for serverless environments
  const modelsPath = path.join(__dirname, 'models', 'index.js');
  db = require(modelsPath);
  console.log("SUCCESS: Database models module loaded.");
} catch (err) {
  console.error("CRITICAL ERROR: Database models failed to load. The file 'server/models/index.js' might be missing or broken.");
  console.error(err); // Full error object logged as requested
  dbLoadError = err;
}

const ensureDb = async () => {
  if (dbLoadError) throw dbLoadError;
  if (!db) throw new Error("Database module not found");
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = (async () => {
    try {
      console.log("ACTION: Attempting to establish connection to MongoDB Cluster...");
      await db.connectDB();
      console.log("SUCCESS: MongoDB connection established.");
      if (!isSeeded) {
        await db.seed();
        isSeeded = true;
      }
      return true;
    } catch (err) {
      console.error("!!! DATABASE CONNECTION FAILED !!!");
      console.error("Details:", err); // Explicitly logging the full error object for diagnostics
      dbConnectionError = err;
      dbInitPromise = null; // Allow retry on subsequent requests
      throw err;
    }
  })();

  return dbInitPromise;
};

const getMaskedUri = (uri) => {
  if (!uri || typeof uri !== 'string') return "NOT_SET";
  return uri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");
};

// 3. PRIORITY API ENDPOINTS
// Defined early to ensure they are captured by Vercel's rewrite destination

app.get('/api/status', async (req, res) => {
  // Attempt background connection check
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
      console.error("Collection count aggregation failed:", e.message);
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
    timestamp: new Date().toISOString(),
    route: req.url // Include route in response for easier debugging
  });
});

app.post('/api/admin/seed', async (req, res) => {
  try {
    await ensureDb();
    await db.seed(true);
    isSeeded = true;
    return res.json({ success: true, message: "Database reset and seeded successfully." });
  } catch (err) {
    console.error("Manual seed request failed:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 4. BUSINESS LOGIC ROUTING
const routesPath = path.join(__dirname, 'routes', 'index.js');
const businessRoutes = require(routesPath);

app.use('/api', async (req, res, next) => {
  // Pass through status/seed as they are handled above
  if (req.path === '/status' || req.path === '/admin/seed') return next();
  
  try {
    await ensureDb();
    next();
  } catch (err) {
    return res.status(503).json({
      error: "DB_NEGOTIATION_FAILED",
      message: "The backend cannot communicate with the database cluster.",
      details: err.message
    });
  }
}, businessRoutes);

// Explicit 404 for unmatched /api routes
app.all('/api/*', (req, res) => {
  console.log(`[API-404] No match for ${req.method} ${req.url}`);
  return res.status(404).json({
    error: "ENDPOINT_NOT_DEFINED",
    path: req.originalUrl,
    method: req.method,
    suggestion: "Check your route definitions in server/routes/index.js"
  });
});

// 5. STATIC FILES & SPA SERVING
const projectRoot = process.cwd();

app.use(express.static(projectRoot, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

app.get('*', (req, res) => {
  // If an API-prefixed request reaches here, it's definitely a 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: "Invalid API route path" });
  }

  const indexPath = path.join(projectRoot, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error(`SPA ERROR: index.html not found at ${indexPath}`);
      res.status(500).send("The application UI (index.html) is currently unavailable.");
    }
  });
});

// Start Server (Local Development)
if (require.main === module) {
  const port = config.PORT || 3000;
  app.listen(port, () => {
    console.log(`NEO MONITOR: Listening on http://localhost:${port}`);
    ensureDb().catch(e => console.warn("Background DB init deferred until first request."));
  });
}

// Export for Vercel Serverless
module.exports = app;
