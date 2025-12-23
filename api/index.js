
const express = require('express');
const cors = require('cors');

/**
 * NEO SYSTEM GATEWAY V2 (Fresh Approach)
 * -------------------------------------
 * This file acts as the primary entry point for Vercel Serverless Functions.
 * It is self-contained to avoid directory traversal 404s.
 */

const app = express();
const startTime = Date.now();

// --- CONFIGURATION ---
const SIMULATION_MODE = true; 

// 1. GLOBAL MIDDLEWARE
app.use(cors());
app.use(express.json());

// Log every incoming request for Vercel Monitoring
app.use((req, res, next) => {
  console.log(`[NEO-GATEWAY] ${req.method} ${req.url}`);
  next();
});

// 2. HEALTH & STATUS HANDLER
// We handle both /api/status and /status to be immune to rewrite prefix behavior
const handleStatus = (req, res) => {
  const diagnosticData = {
    status: "online",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    memory: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + " MB",
    routing: "VERIFIED_V2",
    env: process.env.NODE_ENV || 'production'
  };

  if (SIMULATION_MODE) {
    return res.status(200).json({
      ...diagnosticData,
      dbStatus: "Connected",
      dbUri: "mongodb+srv://NEO_CLOUD_STORAGE_ACTIVE",
      isSeeded: true,
      counts: { 
        users: 15, 
        projects: 8, 
        tasks: 42, 
        announcements: 3, 
        holidays: 1, 
        attendance: 20 
      }
    });
  }

  // Production response if SIMULATION_MODE is false
  res.status(200).json({
    ...diagnosticData,
    dbStatus: "Production Link Pending",
    message: "Gateway active. Database connection requires MONGODB_URI configuration."
  });
};

app.get('/api/status', handleStatus);
app.get('/status', handleStatus);

// 3. MOCK BUSINESS ROUTES (Required for Dashboard Interactions)
app.get(['/api/tasks', '/tasks'], (req, res) => {
  res.json([
    { id: 'T-101', name: 'Infrastructure Verification', status: 'Completed', assignedBy: 'Architect' },
    { id: 'T-102', name: 'Cloud Persistence Sync', status: 'In Progress', assignedBy: 'System' }
  ]);
});

app.get(['/api/projects', '/projects'], (req, res) => {
  res.json([
    { id: 'P-99', name: 'NEO Core Systems', client: { name: 'Internal' } }
  ]);
});

app.get(['/api/auth/me', '/auth/me'], (req, res) => {
  res.json({
    id: 'admin_root',
    name: 'System Architect',
    role: 'Admin',
    email: 'architect@neo.internal'
  });
});

app.post(['/api/admin/seed', '/admin/seed'], (req, res) => {
  res.json({ success: true, message: "Simulated database state has been reset." });
});

// 4. API FALLBACK
// Ensures any unmatched /api call returns JSON, not index.html
app.all('/api/*', (req, res) => {
  res.status(404).json({
    error: "NEO_API_ROUTE_NOT_FOUND",
    path: req.url,
    message: "This service endpoint is not registered on the NEO gateway."
  });
});

// Export the app for Vercel's serverless runtime
module.exports = app;

// Local Development Support
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`NEO Fresh Gateway active on http://localhost:${port}`));
}
