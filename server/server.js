
const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');

const app = express();

// --- TEST MODE CONFIGURATION ---
// Set SIMULATION_MODE to true to bypass all DB logic and test Express routing/Vercel connectivity.
const SIMULATION_MODE = true; 

// Global state tracking
const startTime = Date.now();
let db = null;
let dbLoadError = null;
let dbConnectionError = null;

// 1. Core Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug logging for Vercel Console
app.use((req, res, next) => {
  console.log(`[NEO-DEBUG] Request: ${req.method} ${req.url}`);
  next();
});

// 2. Database Initialization (Strictly conditional)
if (!SIMULATION_MODE) {
  try {
    db = require('./models');
    console.log("SUCCESS: Database models module loaded.");
  } catch (err) {
    console.error("CRITICAL ERROR: Database models failed to load.");
    dbLoadError = err;
  }
}

const ensureDb = async () => {
  if (SIMULATION_MODE) return true;
  if (!db) throw new Error(dbLoadError ? dbLoadError.message : "Database module not initialized");
  
  try {
    await db.connectDB();
    return true;
  } catch (err) {
    dbConnectionError = err;
    throw err;
  }
};

// 3. THE DUMMY API (Requested for testing)
// This handler is placed before any other /api logic for maximum reliability.
app.get('/api/status', (req, res) => {
  console.log("[NEO-DEBUG] Hit /api/status route");
  
  if (SIMULATION_MODE) {
    return res.status(200).json({
      uptime: Math.floor((Date.now() - startTime) / 1000),
      memoryUsage: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2),
      dbStatus: "Connected (Simulated)",
      dbName: "neo_dummy_db",
      dbUri: "mongodb://SIMULATED_INSTANCE",
      dbError: null,
      counts: { 
        users: 15, 
        projects: 10, 
        tasks: 42, 
        announcements: 3, 
        holidays: 1, 
        attendance: 25 
      },
      isSeeded: true,
      timestamp: new Date().toISOString(),
      mode: "DUMMY_API_TEST",
      vercelRouting: "OPERATIONAL"
    });
  }

  // Real DB Logic fallback
  ensureDb().then(() => {
    res.status(200).json({
      uptime: Math.floor((Date.now() - startTime) / 1000),
      dbStatus: "Connected",
      timestamp: new Date().toISOString()
    });
  }).catch(err => {
    res.status(200).json({
      uptime: Math.floor((Date.now() - startTime) / 1000),
      dbStatus: "Disconnected",
      dbError: err.message,
      timestamp: new Date().toISOString()
    });
  });
});

// 4. BUSINESS LOGIC ROUTING
app.use('/api', async (req, res, next) => {
  // If simulation is on, return mock data for standard endpoints
  if (SIMULATION_MODE) {
    if (req.path === '/tasks') return res.json([{ id: 'mock_1', name: 'Verify Express Routing', status: 'In Progress' }]);
    if (req.path === '/projects') return res.json([{ id: 'mock_proj_1', name: 'NEO Infrastructure System' }]);
    if (req.path === '/auth/me') return res.json({ id: 'mock_admin', name: 'Neo Architect', role: 'Admin' });
    
    // Prevent fall-through to real routes if simulation is on
    if (req.path !== '/status') {
      return res.status(404).json({ error: "Simulated endpoint not mapped", path: req.path });
    }
  }

  try {
    await ensureDb();
    const routes = require('./routes');
    routes(req, res, next);
  } catch (err) {
    return res.status(503).json({ error: "DATABASE_UNAVAILABLE", details: err.message });
  }
});

// Explicit 404 for unmatched /api routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: "API_ENDPOINT_NOT_FOUND", path: req.originalUrl });
});

// 5. STATIC FILES & SPA SERVING
const projectRoot = process.cwd();
app.use(express.static(projectRoot));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: "API Route Not Found" });
  }
  res.sendFile(path.join(projectRoot, 'index.html'));
});

// Support for local execution
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`NEO SERVER [DUMMY_MODE: ${SIMULATION_MODE}] running on port ${port}`));
}

module.exports = app;
