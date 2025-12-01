
const express = require('express');
const cors = require('cors');
const config = require('./config');
const router = require('./routes/index');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', router);

// Root Endpoint
app.get('/', (req, res) => {
  res.send('NEO Company Management API is running. Access endpoints at /api');
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Internal Server Error', 
    error: config.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// Start Server
app.listen(config.PORT, () => {
  console.log(`Server is running on port ${config.PORT}`);
});
