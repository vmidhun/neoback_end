
const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');

const app = express();
const projectRoot = path.join(__dirname, '../');

// Priority 1: Serve static files with correct MIME types immediately
app.use(express.static(projectRoot, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Priority 2: Body Parsing & Security
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

const ensureDb = async () => {
  if (dbLoadError) throw dbLoadError;
  if (!db) throw new Error("Database modules failed to initialize");
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = (async () => {
    try {
      await db.connectDB();
      await db.seed();
      return true;
    } catch (err) {
      dbConnectionError = err;
      dbInitPromise = null; 
      throw err;
    }
  })();

  return dbInitPromise;
};

const getMaskedUri = (uri) => {
  if (!uri) return "NOT_SET";
  try {
    return uri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");
  } catch (e) {
    return "INVALID_FORMAT";
  }
};

// Resilient Status Endpoint: Always returns 200 to keep UI alive
app.get('/api/status', async (req, res) => {
  // Start connection in background if not already started
  ensureDb().catch(e => console.error("Background DB Init Failure:", e.message));

  let dbStatus = "Disconnected";
  let counts = {};
  
  if (db && db.mongoose && db.mongoose.connection.readyState === 1) {
    dbStatus = "Connected";
    try {
      counts = {
        users: await db.User.countDocuments(),
        projects: await db.Project.countDocuments(),
        tasks: await db.Task.countDocuments()
      };
    } catch (e) {}
  } else if (db && db.mongoose) {
    const state = db.mongoose.connection.readyState;
    const states = { 0: 'Disconnected', 1: 'Connected', 2: 'Connecting', 3: 'Disconnecting' };
    dbStatus = states[state] || 'Unknown';
  }

  res.status(200).json({
    uptime: Math.floor((Date.now() - startTime) / 1000),
    memoryUsage: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
    dbStatus,
    dbName: config.DB.NAME,
    dbUri: getMaskedUri(config.MONGODB_URI),
    dbError: dbConnectionError ? dbConnectionError.message : (dbLoadError ? dbLoadError.message : null),
    counts,
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

app.post('/api/admin/seed', async (req, res) => {
  try {
    await ensureDb();
    await db.seed();
    res.json({ message: "Seed operation completed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Protected API Routes
app.use('/api', async (req, res, next) => {
  if (req.path === '/status' || req.path === '/admin/seed') return next();
  try {
    await ensureDb();
    next();
  } catch (err) {
    res.status(503).json({
      error: "Database Connection Error",
      message: "Please ensure your IP is whitelisted in MongoDB Atlas.",
      details: err.message
    });
  }
}, require('./routes/index'));

// SPA Catch-all
app.get('*', (req, res) => {
  if (req.path.includes('.')) return res.status(404).send('Not found');
  res.sendFile(path.join(projectRoot, 'index.html'));
});

if (require.main === module) {
  const port = config.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
    ensureDb().catch(err => console.error("Initial connection failed:", err.message));
  });
}

module.exports = app;
