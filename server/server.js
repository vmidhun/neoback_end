
const express = require('express');
const cors = require('cors');

const app = express();
const startTime = Date.now();

// --- CONFIGURATION ---
const SIMULATION_MODE = true; 

// 1. GLOBAL MIDDLEWARE
app.use(cors());
app.use(express.json());

// Logging for Vercel Dashboard
app.use((req, res, next) => {
  console.log(`[NEO-API] ${req.method} ${req.url}`);
  next();
});

// 2. ROBUST STATUS HANDLER
// We handle both /api/status and /status to ensure compatibility with Vercel rewrites
const handleStatus = (req, res) => {
  const diagnosticData = {
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    memory: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + " MB",
    routing: "VERIFIED",
    env: process.env.NODE_ENV || 'development'
  };

  if (SIMULATION_MODE) {
    return res.status(200).json({
      ...diagnosticData,
      dbStatus: "Connected (Simulation)",
      isSeeded: true,
      counts: { users: 5, projects: 2, tasks: 3, announcements: 1, holidays: 1, attendance: 1 }
    });
  }

  // Real DB Logic Placeholder
  res.status(200).json({
    ...diagnosticData,
    dbStatus: "Production Mode Enabled",
    note: "Database connection logic would execute here."
  });
};

app.get('/api/status', handleStatus);
app.get('/status', handleStatus);

// 3. MOCK BUSINESS ROUTES
// These respond to the probes in the Dashboard
app.get(['/api/tasks', '/tasks'], (req, res) => {
  res.json([{ id: 'task_1', name: 'System Handshake', status: 'Completed' }]);
});

app.get(['/api/projects', '/projects'], (req, res) => {
  res.json([{ id: 'proj_1', name: 'NEO Infrastructure' }]);
});

app.get(['/api/auth/me', '/auth/me'], (req, res) => {
  res.json({ id: 'admin', name: 'NEO Architect', role: 'Admin' });
});

app.post(['/api/admin/seed', '/admin/seed'], (req, res) => {
  res.json({ message: "Simulated database reset complete." });
});

// 4. API ERROR CATCH-ALL
// If a request hits the API function but no route matches
app.all('/api/*', (req, res) => {
  res.status(404).json({
    error: "API_ENDPOINT_NOT_FOUND",
    path: req.url,
    message: "The requested NEO service endpoint does not exist."
  });
});

// Local Development Support
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`NEO Fresh Server on http://localhost:${port}`));
}

module.exports = app;
