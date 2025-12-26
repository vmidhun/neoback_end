
require('dotenv').config();

const DEFAULT_DB_NAME = 'neo_prod_db';
// Updated with provided URI
const FALLBACK_URI = `mongodb+srv://neo_db_user:5LmvZ367HjkpUWlc@cluster0.7jvi7wm.mongodb.net/${DEFAULT_DB_NAME}?retryWrites=true&w=majority`;

const getMongoUri = () => {
  let uri = process.env.MONGODB_URI || FALLBACK_URI;
  if (!uri.startsWith('mongodb')) {
    console.warn("Invalid MONGODB_URI detected, using fallback.");
    return FALLBACK_URI;
  }
  return uri;
};

module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'neo-secret-key-12345',
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_KEY: process.env.API_KEY || '',
  MONGODB_URI: getMongoUri(),
  DB: {
    NAME: process.env.DB_NAME || DEFAULT_DB_NAME
  },
  AWS: {
    ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    REGION: process.env.AWS_REGION,
    BUCKET_NAME: process.env.S3_BUCKET_NAME,
    FOLDER: process.env.S3_FOLDER_PREFIX || 'neon'
  }
};
