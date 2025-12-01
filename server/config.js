
require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3001,
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_neo_key',
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_KEY: process.env.API_KEY
};
