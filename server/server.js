
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

// Debug Middleware: Log incoming requests to Vercel console logs
app.use((req, res, next) => {
  console.log(`[NEO-CONSOLE] [${new Date().toISOString()}] Incoming: ${req.method} ${req.url}`);
  next();
});

// 2. Database Initialization Logic
try {
  // Use path.join with __dirname for reliable absolute paths in Vercel
  const modelsPath = path.join(__dirname, 'models', 'index.js');
  console.log(`[NEO-INIT] Loading database models from: ${modelsPath}`);
  db = require(modelsPath);
  console.log("SUCCESS: Database models module loaded.");
} catch (err) {
  console.error("CRITICAL ERROR: Database models failed to load at runtime.");
  console.error(err); // Comprehensive stack trace for Vercel logs
  dbLoadError = err;
}

const ensureDb = async () => {
  if (dbLoadError) throw dbLoadError;
  if (!db) throw new Error("Database module not found");
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = (async () => {
    try {
      console.log("ACTION: Handshaking with MongoDB Cluster...");
      await db.connectDB();
      console.log("SUCCESS: MongoDB connection active.");
      if (!isSeeded) {
        await db.seed();
        isSeeded = true;
      }
      return true;
    } catch (err) {
      console.error("!!! DATABASE CONNECTION FAILED !!!");
      console.error("Details:", err); // Explicitly logging the full error object for diagnostics
      dbConnectionError = err;
      dbInitPromise = null; // Reset to allow retry on next request
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
// Defined explicitly before sub-routers to handle status pings immediately

app.get('/api/status', async (req, res) => {
  // Attempt background connection if disconnected
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
      console.error("Collection count failed:", e.message);
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

app.post('/api/admin/seed', async (req, res) => {
  try {
    await ensureDb();
    await db.seed(true);
    isSeeded = true;
    return res.json({ success: true, message: "Manual seed operation successful." });
  } catch (err) {
    console.error("Seeding operation failed:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 4. BUSINESS LOGIC ROUTING
const routesPath = path.join(__dirname, 'routes', 'index.js');
let businessRoutes;
try {
  businessRoutes = require(routesPath);
} catch (e) {
  console.error("FATAL: Could not require business routes.", e);
}

app.use('/api', async (req, res, next) => {
  // Pass through for status checks
  if (req.path === '/status' || req.path === '/admin/seed') return next();
  
  try {
    await ensureDb();
    if (!businessRoutes) throw new Error("API routes failed to initialize.");
    next();
  } catch (err) {
    return res.status(503).json({
      error: "BACKEND_UNAVAILABLE",
      message: "The application cannot reach the data cluster.",
      details: err.message
    });
  }
}, businessRoutes);

// Catch-all for undefined /api routes
app.all('/api/*', (req, res) => {
  console.log(`[NEO-404] No handler for ${req.method} ${req.url}`);
  return res.status(404).json({
    error: "API_ROUTE_NOT_FOUND",
    path: req.originalUrl,
    method: req.method
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
  // If an API route reaches here, it's missing
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: "Invalid API route structure" });
  }

  const indexPath = path.join(projectRoot, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error(`SPA ERROR: index.html missing at ${indexPath}`);
      res.status(500).send("Critical Fault: Frontend entry point (index.html) is missing.");
    }
  });
});

// Local Development Entry Point
if (require.main === module) {
  const port = config.PORT || 3000;
  app.listen(port, () => {
    console.log(`NEO BACKEND: Active on http://localhost:${port}`);
    ensureDb().catch(e => console.warn("Background DB check deferred."));
  });
}

// Export for Vercel Runtime
module.exports = app;
