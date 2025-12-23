
const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the project root
const projectRoot = path.join(__dirname, '../');
app.use(express.static(projectRoot));

// --- Database State Management ---
let db;
let dbLoadError = null;
let dbConnectionError = null;
let dbInitPromise = null;
const startTime = Date.now();

try {
  db = require('./models');
} catch (err) {
  console.error("CRITICAL: Failed to load database models:", err.message);
  dbLoadError = err;
}

/**
 * Ensures database is connected and seeded.
 * This is crucial for Vercel where app.listen() isn't the entry point.
 */
const ensureDb = async () => {
  if (dbLoadError) throw dbLoadError;
  if (!db) throw new Error("Database models not loaded");

  // If already connecting/connected, return the existing promise
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = (async () => {
    try {
      console.log("Initializing Database connection...");
      await db.connectDB();
      console.log("Database connected. Running Seeder...");
      await db.seed();
      console.log("Database ready.");
      return true;
    } catch (err) {
      dbConnectionError = err;
      dbInitPromise = null; // Allow retry on next request
      throw err;
    }
  })();

  return dbInitPromise;
};

// Dedicated Status Endpoint
app.get('/api/status', async (req, res) => {
  // Try to connect but don't block the status report if it fails
  try { await ensureDb(); } catch (e) { /* ignored for status report */ }

  let dbStatus = "Disconnected";
  let counts = {};
  
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
      console.error("Error fetching counts:", e.message);
    }
  } else if (db && db.mongoose) {
    const state = db.mongoose.connection.readyState;
    const states = { 0: 'Disconnected', 1: 'Connected', 2: 'Connecting', 3: 'Disconnecting' };
    dbStatus = states[state] || 'Unknown';
  }

  res.json({
    uptime: Math.floor((Date.now() - startTime) / 1000),
    memoryUsage: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
    dbStatus,
    dbName: config.DB.NAME,
    dbError: dbConnectionError ? dbConnectionError.message : (dbLoadError ? dbLoadError.message : null),
    counts,
    nodeVersion: process.version,
    platform: process.platform,
    timestamp: new Date().toISOString()
  });
});

// Endpoint to manually trigger seed (useful for debugging Vercel deployments)
app.post('/api/admin/seed', async (req, res) => {
  try {
    await ensureDb();
    await db.seed();
    res.json({ message: "Seed operation completed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Routes - Wrap with DB check
app.use('/api', async (req, res, next) => {
  if (req.path === '/status' || req.path === '/admin/seed') return next();
  
  try {
    await ensureDb();
    next();
  } catch (err) {
    res.status(503).json({
      error: "Service Unavailable",
      message: "Database failed to initialize.",
      details: err.message
    });
  }
}, require('./routes/index'));

// Catch-all route to serve the frontend (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(projectRoot, 'index.html'));
});

// Local Development Entry Point
if (require.main === module) {
  const port = config.PORT || 3000;
  app.listen(port, () => {
    console.log(`Development server running on port ${port}`);
    ensureDb().catch(err => console.error("Initial DB connection failed:", err.message));
  });
}

// Export for Vercel
module.exports = app;
