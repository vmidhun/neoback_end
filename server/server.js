
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
let router;

// 1. Try to load Database Models
try {
  db = require('./models');
} catch (err) {
  console.error("CRITICAL: Failed to load database models:", err.message);
  dbLoadError = err;
  
  // Create a mock DB object so the server can still start
  db = {
    sequelize: {
      authenticate: async () => { throw new Error(`Model Loading Failed: ${err.message}. (Did you install dependencies?)`); },
      sync: async () => { console.warn("Skipping DB sync due to load error."); }
    },
    seed: async () => {}
  };
}

// 2. Try to load Routes (Only if DB loaded, otherwise mock API)
try {
  if (dbLoadError) throw new Error("Skipping route loading due to DB failure.");
  router = require('./routes/index');
  app.use('/api', router);
} catch (err) {
  console.error("CRITICAL: Failed to load routes:", err.message);
  // Fallback API handler
  app.use('/api', (req, res) => {
    res.status(503).json({
      error: "Service Unavailable",
      message: "The backend failed to initialize correctly.",
      details: dbLoadError ? dbLoadError.message : err.message
    });
  });
}

// Log/Status Rendering Function
const renderStatusPage = async (req, res) => {
  const envChecks = {
    "NODE_ENV": config.NODE_ENV,
    "PORT": config.PORT,
    "DB_DIALECT": config.DB.DIALECT,
    "DB_STORAGE": config.DB.STORAGE,
    "DB_HOST": config.DB.HOST,
    "DB_NAME": config.DB.NAME,
  };

  // Check Database Connection with Timeout
  let dbStatus = "Unknown";
  let dbError = dbLoadError ? dbLoadError.message : null;
  
  if (!dbLoadError) {
    try {
      const dbCheckPromise = db.sequelize.authenticate();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Connection check timed out")), 2000)
      );
      await Promise.race([dbCheckPromise, timeoutPromise]);
      dbStatus = "Connected";
    } catch (err) {
      dbStatus = "Connection Failed";
      dbError = err.message;
    }
  } else {
    dbStatus = "Load Failed";
  }

  // Render HTML
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>NEO Server Status</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 20px; background: #f4f6f8; color: #333; margin: 0; }
          .container { max-width: 800px; margin: 0 auto; }
          .card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-bottom: 20px; border: 1px solid #e1e4e8; }
          h1 { font-size: 22px; margin-bottom: 20px; color: #1a202c; display: flex; align-items: center; }
          .status-badge { padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 0.85em; display: inline-block; }
          .ok { background: #def7ec; color: #03543f; }
          .fail { background: #fde8e8; color: #9b1c1c; }
          .error-msg { background: #fff5f5; border-left: 4px solid #fc8181; padding: 10px; color: #c53030; margin-top: 10px; font-family: monospace; word-break: break-all; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; font-size: 14px; }
          th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #f0f0f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>NEO Server Diagnostics</h1>
          
          <div class="card">
            <h2>System Health</h2>
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span>Database Status</span>
              <span class="status-badge ${dbStatus === 'Connected' ? 'ok' : 'fail'}">${dbStatus}</span>
            </div>
            ${dbError ? `<div class="error-msg"><strong>Error:</strong> ${dbError}</div>` : ''}
            ${dbError && dbError.includes('sqlite3') ? `<div style="margin-top:10px; font-size:0.9em; color:#666;">Tip: Ensure <code>sqlite3</code> is installed. If using a container, it might need a rebuild.</div>` : ''}
          </div>

          <div class="card">
            <h2>Configuration</h2>
            <table>
              <thead><tr><th>Variable</th><th>Value</th></tr></thead>
              <tbody>
                ${Object.entries(envChecks).map(([key, val]) => `
                  <tr><td><code>${key}</code></td><td>${val}</td></tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </body>
    </html>
  `;

  res.send(html);
};

// Routes - Serve Status Page on Root
app.get('/', renderStatusPage);
app.get('/log', renderStatusPage);

// Global Error Handling
app.use((err, req, res, next) => {
  console.error("Global Error:", err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// Start Server
const startServer = async () => {
  try {
    const port = config.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}. Access logs at http://localhost:${port}/log`);
    });

    // Attempt DB Sync in background
    if (!dbLoadError) {
      console.log("Attempting database connection in background...");
      db.sequelize.sync({ force: false })
        .then(() => {
          console.log("Synced database successfully.");
          return db.seed();
        })
        .catch((err) => {
          console.error("Failed to sync database: " + err.message);
        });
    }
  } catch (err) {
    console.error("Failed to start server listener:", err);
  }
};

startServer();
