
const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const os = require('os');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the project root
// In Vercel, we need to ensure path resolution is reliable
const projectRoot = path.join(__dirname, '../');
app.use(express.static(projectRoot));

// --- Initialization with Error Handling ---
let db;
let dbLoadError = null;
let dbConnectionError = null;
const startTime = Date.now();

try {
  db = require('./models');
} catch (err) {
  console.error("CRITICAL: Failed to load database models:", err.message);
  dbLoadError = err;
}

// Dedicated Status Endpoint for the Frontend Dashboard
app.get('/api/status', async (req, res) => {
  let dbStatus = "Disconnected";
  let counts = {};
  
  if (db && db.mongoose && db.mongoose.connection.readyState === 1) {
    dbStatus = "Connected";
    dbConnectionError = null;
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

// API Routes
app.use('/api', (req, res, next) => {
  if (dbLoadError) {
    return res.status(503).json({
      error: "Service Unavailable",
      message: "Database failed to initialize.",
      details: dbLoadError.message
    });
  }
  next();
}, require('./routes/index'));

// Catch-all route to serve the frontend (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(projectRoot, 'index.html'));
});

// Start Server (Only start if not being required by a serverless runner like Vercel)
if (require.main === module) {
  const port = config.PORT || 3000;
  app.listen(port, async () => {
    console.log(`Unified Server running on port ${port}`);
    if (db && !dbLoadError) {
      try {
        await db.connectDB();
        await db.seed();
      } catch (err) {
        dbConnectionError = err;
        console.error("Failed to connect to MongoDB:", err.message);
      }
    }
  });
} else {
    // We are in a serverless environment
    if (db && !dbLoadError) {
        db.connectDB().catch(err => {
            dbConnectionError = err;
            console.error("Vercel DB Connect Error:", err.message);
        });
    }
}

// Export app for Vercel
module.exports = app;
