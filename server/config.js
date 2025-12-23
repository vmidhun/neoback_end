require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'AIzaSyDUPGTemY4YD3xUJfQDL8JE7FNCuHFB320',
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_KEY: process.env.API_KEY || 'AIzaSyDUPGTemY4YD3xUJfQDL8JE7FNCuHFB320',
  DB: {
    HOST: process.env.DB_HOST || 'localhost',
    USER: process.env.DB_USER || 'root',
    PASSWORD: process.env.DB_PASSWORD || null,
    NAME: process.env.DB_NAME || 'neo_db',
    PORT: process.env.DB_PORT || 3306,
    DIALECT: process.env.DB_DIALECT || 'sqlite',
    STORAGE: process.env.DB_STORAGE || './database.sqlite'
  }
}