
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'AIzaSyDUPGTemY4YD3xUJfQDL8JE7FNCuHFB320',
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_KEY: process.env.API_KEY || 'AIzaSyDUPGTemY4YD3xUJfQDL8JE7FNCuHFB320',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://neo_db_user:5LmvZ367HjkpUWlc@cluster0.7jvi7wm.mongodb.net/?appName=Cluster0',
  DB: {
    NAME: process.env.DB_NAME || 'neo_db'
  }
}
