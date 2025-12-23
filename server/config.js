
require('dotenv').config();

// The DB name is now included in the URI string for better reliability
const DEFAULT_DB_NAME = 'neo_db';
const DEFAULT_URI = `mongodb+srv://neo_db_user:5LmvZ367HjkpUWlc@cluster0.7jvi7wm.mongodb.net/${DEFAULT_DB_NAME}?retryWrites=true&w=majority`;

module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'neo-secret-key-12345',
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_KEY: process.env.API_KEY || '',
  // Priority: 1. Environment Variable (Vercel) 2. Hardcoded fallback
  MONGODB_URI: process.env.MONGODB_URI || DEFAULT_URI,
  DB: {
    NAME: process.env.DB_NAME || DEFAULT_DB_NAME
  }
}
