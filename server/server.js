
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { connectDB, seed } = require('./models');
const apiRoutes = require('./routes/index');

const app = express();
const startTime = Date.now();

// 1. GLOBAL MIDDLEWARE
app.use(cors());
app.use(express.json());

// Monitoring
app.use((req, res, next) => {
  console.log(`[NEO-GATEWAY] ${req.method} ${req.url}`);
  next();
});

// 2. DATABASE CONNECTION
connectDB().catch(err => console.error("Startup DB Connection Error:", err));

// 3. HEALTH & DIAGNOSTICS
// Handle health check on both /status and /api/status for robustness
const statusHandler = (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = { 0: 'Disconnected', 1: 'Connected', 2: 'Connecting', 3: 'Disconnecting' };
  
  const isHealthy = dbState === 1;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "online" : "maintenance",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    dbStatus: states[dbState] || "Unknown",
    dbUri: isHealthy ? "Connected to Cloud Atlas" : "Connecting...",
    isSeeded: true, 
    routing: "LIVE_DB_MODE",
    env: process.env.NODE_ENV || 'production'
  });
};

app.get('/api/status', statusHandler);
app.get('/status', statusHandler);

// 4. ADMIN TOOLS
const seedHandler = async (req, res) => {
  try {
    await seed(true); 
    res.json({ success: true, message: "Database reset to baseline state." });
  } catch (err) {
    res.status(500).json({ error: "Seeding failed", details: err.message });
  }
};
app.post('/api/admin/seed', seedHandler);
app.post('/admin/seed', seedHandler);

// 5. API ROUTES
// Mount on both /api and root to handle Vercel rewrite variations
app.use('/api', apiRoutes);
app.use('/', apiRoutes);

// 6. FALLBACK
app.all('*', (req, res) => {
  res.status(404).json({
    error: "NEO_API_ENDPOINT_NOT_FOUND",
    path: req.url,
    message: "The requested API resource does not exist."
  });
});

// Local Development
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`NEO Backend Service active on http://localhost:${port}`));
}

module.exports = app;
