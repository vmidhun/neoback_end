
require('dotenv').config();

// Default fallback URI only for local development
const DEFAULT_LOCAL_URI = 'mongodb://localhost:27017/neo_db';

module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'neo-secret-key-12345',
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_KEY: process.env.API_KEY || '',
  // Priority: 1. Environment Variable (Vercel) 2. Hardcoded fallback (Local)
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://neo_db_user:5LmvZ367HjkpUWlc@cluster0.7jvi7wm.mongodb.net/?appName=Cluster0',
  DB: {
    NAME: process.env.DB_NAME || 'neo_db'
  }
}
