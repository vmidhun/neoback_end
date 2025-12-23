
const express = require('express');
const cors = require('cors');
const config = require('./config');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Initialization with Error Handling ---
let db;
let dbLoadError = null;

try {
  db = require('./models');
} catch (err) {
  console.error("CRITICAL: Failed to load database models:", err.message);
  dbLoadError = err;
}

// Routes - Basic check if DB is ready
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

// Log/Status Rendering
const renderStatusPage = async (req, res) => {
  let dbStatus = "Disconnected";
  let dbError = dbLoadError ? dbLoadError.message : null;

  if (db && db.mongoose) {
    const state = db.mongoose.connection.readyState;
    const states = { 0: 'Disconnected', 1: 'Connected', 2: 'Connecting', 3: 'Disconnecting' };
    dbStatus = states[state] || 'Unknown';
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>NEO Server Status (MongoDB)</title>
        <style>
          body { font-family: sans-serif; padding: 20px; background: #f4f6f8; }
          .card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .ok { color: green; font-weight: bold; }
          .fail { color: red; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>NEO Backend Status</h1>
          <p>Database: <span class="${dbStatus === 'Connected' ? 'ok' : 'fail'}">${dbStatus}</span></p>
          ${dbError ? `<p style="color:red">Error: ${dbError}</p>` : ''}
          <hr/>
          <p>Environment: <code>${config.NODE_ENV}</code></p>
          <p>Port: <code>${config.PORT}</code></p>
        </div>
      </body>
    </html>
  `;
  res.send(html);
};

app.get('/', renderStatusPage);
app.get('/log', renderStatusPage);

// Start Server
const startServer = async () => {
  const port = config.PORT || 3000;
  app.listen(port, async () => {
    console.log(`Server running on port ${port}`);
    if (db && !dbLoadError) {
      try {
        await db.connectDB();
        await db.seed();
      } catch (err) {
        console.error("Failed to connect to MongoDB:", err.message);
      }
    }
  });
};

startServer();
