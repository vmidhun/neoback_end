require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3001,
  JWT_SECRET: process.env.JWT_SECRET || 'AIzaSyDUPGTemY4YD3xUJfQDL8JE7FNCuHFB320',
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_KEY: process.env.API_KEY || 'AIzaSyDUPGTemY4YD3xUJfQDL8JE7FNCuHFB320',
  DB: {
    HOST: process.env.DB_HOST || 'srv1667.hstgr.io',
    USER: process.env.DB_USER || 'u446742022_neo_hrm',
    PASSWORD: process.env.DB_PASSWORD || '8s*?M;$K$3Y',
    NAME: process.env.DB_NAME || 'u446742022_neo_hrm',
    PORT: process.env.DB_PORT || 3306,
    DIALECT: 'mysql'
  }
}