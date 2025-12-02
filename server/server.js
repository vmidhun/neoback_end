
const express = require('express');
const cors = require('cors');
const config = require('./config');
const router = require('./routes/index');
const db = require('./models');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', router);

// Log/Status Rendering Function
const renderStatusPage = async (req, res) => {
  // Check Env Vars Status
  const envChecks = {
    "NODE_ENV": process.env.NODE_ENV || "development (default)",
    "PORT": process.env.PORT || "3001 (default)",
    "DB_HOST": process.env.DB_HOST ? "Set" : "Missing (Using default/fallback)",
    "DB_USER": process.env.DB_USER ? "Set" : "Missing (Using default/fallback)",
    "DB_NAME": process.env.DB_NAME ? "Set" : "Missing (Using default/fallback)",
    "JWT_SECRET": process.env.JWT_SECRET ? "Set (Secure)" : "Missing (Using insecure default)",
    "API_KEY (Gemini)": process.env.API_KEY ? "Set" : "Missing",
  };

  // Check Database Connection with Timeout (1.5 seconds)
  let dbStatus = "Unknown";
  let dbError = null;
  
  // We wrap the check in a try/catch to ensure rendering never fails
  try {
    const dbCheckPromise = db.sequelize.authenticate();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Connection check timed out (Is DB host reachable?)")), 1500)
    );

    await Promise.race([dbCheckPromise, timeoutPromise]);
    dbStatus = "Connected";
  } catch (err) {
    dbStatus = "Connection Failed";
    dbError = err.message;
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
          h1 .dot { width: 10px; height: 10px; background: #10b981; border-radius: 50%; display: inline-block; margin-right: 10px; }
          h2 { font-size: 16px; margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 8px; color: #4a5568; }
          .status-badge { padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 0.85em; display: inline-block; }
          .ok { background: #def7ec; color: #03543f; }
          .fail { background: #fde8e8; color: #9b1c1c; }
          table { width: 100%; border-collapse: collapse; font-size: 14px; }
          th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #f0f0f0; }
          th { color: #666; font-weight: 500; font-size: 0.85em; text-transform: uppercase; letter-spacing: 0.05em; }
          .error-msg { background: #fff5f5; border-left: 4px solid #fc8181; padding: 10px; color: #c53030; margin-top: 10px; font-family: monospace; word-break: break-all; font-size: 13px; }
          .endpoint-list { list-style: none; padding: 0; margin: 0; }
          .endpoint-list li { margin-bottom: 8px; font-family: monospace; background: #f7fafc; padding: 8px; border-radius: 6px; border: 1px solid #edf2f7; display: flex; justify-content: space-between; }
          .method { font-weight: bold; color: #4a5568; margin-right: 10px; min-width: 50px; }
          .url { color: #2b6cb0; word-break: break-all; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1><span class="dot"></span>NEO Server Diagnostics</h1>
          
          <div class="card">
            <h2>Database Connection</h2>
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span>MySQL Status</span>
              <span class="status-badge ${dbStatus === 'Connected' ? 'ok' : 'fail'}">${dbStatus}</span>
            </div>
            ${dbError ? `<div class="error-msg"><strong>Error:</strong> ${dbError}</div>` : ''}
          </div>

          <div class="card">
            <h2>Environment Configuration</h2>
            <table>
              <thead>
                <tr>
                  <th>Variable</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(envChecks).map(([key, val]) => `
                  <tr>
                    <td><code>${key}</code></td>
                    <td>
                      <span class="status-badge ${val.includes('Missing') || val.includes('insecure') ? 'fail' : 'ok'}">
                        ${val}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="card">
            <h2>Quick Links</h2>
            <ul class="endpoint-list">
               <li><span class="method">GET</span> <span class="url">/api/users</span></li>
               <li><span class="method">GET</span> <span class="url">/api/tasks</span></li>
               <li><span class="method">POST</span> <span class="url">/api/auth/login</span></li>
            </ul>
            <div style="margin-top: 10px; font-size: 0.9em; color: #666;">
               <em>Note: Most API endpoints require Authorization header.</em>
            </div>
          </div>

          <div style="text-align: center; color: #888; font-size: 0.8em; margin-top: 20px;">
            NEO Company Management Backend v1.0.0
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

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error("Global Error:", err.stack);
  res.status(500).json({ 
    message: 'Internal Server Error', 
    error: config.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// Start Server Function
const startServer = async () => {
  try {
    // 1. Start Listening IMMEDIATELY
    // This ensures the logs are visible even if DB fails
    const port = config.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server is running and listening on port ${port}`);
    });

    // 2. Attempt DB Sync (Background Process)
    console.log("Attempting database connection in background...");
    db.sequelize.sync({ force: false })
      .then(() => {
        console.log("Synced database successfully.");
        return db.seed();
      })
      .catch((err) => {
        console.error("Failed to sync database (Server still running in diagnostics mode): " + err.message);
      });
      
  } catch (err) {
    console.error("Failed to start server:", err);
  }
};

startServer();
