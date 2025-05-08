import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Pool } = pg;

let dbConfig;

// Check if we're in production mode
const isProduction = process.env.NODE_ENV === 'production';
console.log(`Running in ${isProduction ? 'production' : 'development'} mode`);

// First try to use DATABASE_URL if it exists (common in production deployments)
if (process.env.DATABASE_URL) {
  console.log('Using DATABASE_URL for connection');
  dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction && process.env.DATABASE_URL.includes('render.com') 
      ? { rejectUnauthorized: false } 
      : false
  };
} else {
  // Otherwise use individual environment variables
  console.log('Using individual DB variables for connection');
  dbConfig = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'studentsummary',
    ssl: isProduction && process.env.SSL_ENABLED === 'true' 
      ? { rejectUnauthorized: false } 
      : false
  };
}

// Log configuration (without password for security)
console.log('Database config:', {
  ...(dbConfig.connectionString ? { connectionString: 'Set' } : {
    user: dbConfig.user,
    host: dbConfig.host,
    database: dbConfig.database,
    port: dbConfig.port,
  }),
  ssl: dbConfig.ssl
});

// Create a new database pool
const pool = new Pool(dbConfig);

// Test the database connection
pool.connect()
  .then(client => {
    console.log('Database connected successfully');
    client.release();
  })
  .catch(err => {
    console.error('Database connection error:', err);
    // If SSL error in production, provide more helpful error
    if (isProduction && err.message.includes('SSL')) {
      console.error('SSL Error: If running locally in production mode, set SSL_ENABLED=false in .env');
    }
  });

export default {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect()
}; 