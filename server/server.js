
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

// Root Endpoint
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>NEO Backend Status</title>
        <style>
            body { 
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                display: flex; 
                flex-direction: column; 
                align-items: center; 
                justify-content: center; 
                height: 100vh; 
                margin: 0; 
                background-color: #f3f4f6; 
                color: #1f2937;
            }
            .container { 
                text-align: center; 
                padding: 3rem; 
                background: white; 
                border-radius: 12px; 
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); 
                max-width: 400px;
                width: 90%;
            }
            h1 { 
                margin-top: 0;
                margin-bottom: 0.5rem; 
                font-size: 1.5rem;
                font-weight: 700;
            }
            .status-dot {
                display: inline-block;
                width: 10px;
                height: 10px;
                background-color: #10b981;
                border-radius: 50%;
                margin-right: 8px;
            }
            p { 
                color: #6b7280; 
                margin-bottom: 2rem; 
            }
            .btn { 
                display: inline-block; 
                background-color: #2563eb; 
                color: white; 
                padding: 0.75rem 1.5rem; 
                border-radius: 8px; 
                text-decoration: none; 
                font-weight: 600; 
                transition: background-color 0.2s; 
                width: 100%;
                box-sizing: border-box;
            }
            .btn:hover { 
                background-color: #1d4ed8; 
            }
            .footer {
                margin-top: 2rem;
                font-size: 0.875rem;
                color: #9ca3af;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1><span class="status-dot"></span>NEO Server Online</h1>
            <p>The backend API is running and ready to accept requests.</p>
            <a href="/log" class="btn">View System Diagnostics</a>
            <div class="footer">v1.0.0</div>
        </div>
    </body>
    </html>
  `);
});

// Status & Log Dashboard
app.get('/log', async (req, res) => {
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

  // Check Database Connection
  let dbStatus = "Unknown";
  let dbError = null;
  try {
    await db.sequelize.authenticate();
    dbStatus = "Connected";
  } catch (err) {
    dbStatus = "Connection Failed";
    dbError = err.message;
  }

  // Render Simple HTML
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>NEO Server Status</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; background: #f4f6f8; color: #333; }
          .container { max-width: 800px; margin: 0 auto; }
          .card { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-bottom: 24px; border: 1px solid #e1e4e8; }
          h1 { font-size: 24px; margin-bottom: 20px; color: #1a202c; }
          h2 { font-size: 18px; margin-top: 0; margin-bottom: 16px; border-bottom: 1px solid #eee; padding-bottom: 10px; }
          .status-badge { padding: 4px 8px; border-radius: 4px; font-weight: 600; font-size: 0.9em; }
          .ok { background: #def7ec; color: #03543f; }
          .fail { background: #fde8e8; color: #9b1c1c; }
          table { width: 100%; border-collapse: collapse; }
          th, td { text-align: left; padding: 12px 8px; border-bottom: 1px solid #f0f0f0; }
          th { color: #666; font-weight: 500; font-size: 0.9em; text-transform: uppercase; letter-spacing: 0.05em; }
          .error-msg { background: #fff5f5; border-left: 4px solid #fc8181; padding: 12px; color: #c53030; margin-top: 10px; font-family: monospace; word-break: break-all; }
          .back-link { display: inline-block; margin-bottom: 20px; color: #666; text-decoration: none; }
          .back-link:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <a href="/" class="back-link">&larr; Back to Home</a>
          <h1>NEO Server Diagnostics</h1>
          
          <div class="card">
            <h2>Database Connection</h2>
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span>Status</span>
              <span class="status-badge ${dbStatus === 'Connected' ? 'ok' : 'fail'}">${dbStatus}</span>
            </div>
            ${dbError ? `<div class="error-msg">${dbError}</div>` : ''}
          </div>

          <div class="card">
            <h2>Environment Configuration</h2>
            <table>
              <thead>
                <tr>
                  <th>Variable</th>
                  <th>Status / Value</th>
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

          <div style="text-align: center; color: #888; font-size: 0.9em;">
            NEO Company Management Backend v1.0.0
          </div>
        </div>
      </body>
    </html>
  `;

  res.send(html);
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Internal Server Error', 
    error: config.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// Sync DB and Start Server
db.sequelize.sync({ force: false }) // Set force: true to drop/recreate tables (dev only)
  .then(() => {
    console.log("Synced database.");
    // Run seeder if needed
    return db.seed();
  })
  .then(() => {
    app.listen(config.PORT, () => {
      console.log(`Server is running on port ${config.PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to sync database: " + err.message);
  });
