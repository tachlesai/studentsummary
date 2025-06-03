import dotenv from 'dotenv';
import dns from 'dns';

// Load environment variables
dotenv.config();

// Configure DNS to prefer IPv4
dns.setDefaultResultOrder('ipv4first');

// Force IPv4 connections to avoid ENETUNREACH with IPv6 addresses
process.env.PGSSLMODE = 'prefer';

// Dynamically import pg to work around ESM/CJS issues
const pg = await (async () => {
  try {
    // Try ESM import first
    return await import('pg');
  } catch (e) {
    console.log('ESM import failed, trying CommonJS import');
    // Fallback to CommonJS
    const pg = await import('pg/lib/index.js');
    return pg;
  }
})();

const { Pool } = pg.default || pg;

let dbConfig;

// Check if we're in production mode
const isProduction = process.env.NODE_ENV === 'production';
console.log(`Running in ${isProduction ? 'production' : 'development'} mode`);

// First try to use DATABASE_URL if it exists (common in production deployments)
if (process.env.DATABASE_URL) {
  console.log('Using DATABASE_URL for connection');
  
  // Function to replace IPv6 address with hostname
  const replaceIPv6WithHostname = (url) => {
    try {
      // Parse the connection string
      const regex = /postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
      const match = url.match(regex);
      
      if (match) {
        const [_, user, password, host, port, dbNameWithParams] = match;
        
        // Log the current host
        console.log('Connection host:', host);
        
        // Check if this is an IPv6 address
        if (host.includes(':')) {
          console.log('IPv6 address detected in DATABASE_URL');
          
          // If we have a DB_HOSTNAME environment variable, use that
          if (process.env.DB_HOSTNAME) {
            const newHost = process.env.DB_HOSTNAME;
            console.log(`Using DB_HOSTNAME: ${newHost}`);
            return `postgres://${user}:${password}@${newHost}:${port}/${dbNameWithParams}`;
          }
          
          // Try to extract the hostname from DB_HOST or use a fallback
          // The hostname for a postgres database on Railway is usually containers-us-west-N.railway.app
          // or a similar format for other providers
          const dbHost = process.env.DB_HOST || 'containers-us-west-181.railway.app';
          console.log(`Using alternative hostname: ${dbHost}`);
          
          // Construct a new connection string
          return `postgres://${user}:${password}@${dbHost}:${port}/${dbNameWithParams}`;
        }
      }
      return url;
    } catch (e) {
      console.log('Error processing DATABASE_URL:', e.message);
      return url;
    }
  };
  
  // Get the connection string with potentially modified host
  const connectionString = replaceIPv6WithHostname(process.env.DATABASE_URL);
  
  // Check if connection string was modified
  if (connectionString !== process.env.DATABASE_URL) {
    console.log('Using modified DATABASE_URL with hostname instead of IPv6');
  }
  
  try {
    const hostInfo = connectionString.split('@')[1].split('/')[0];
    console.log('Connection to host:', hostInfo);
  } catch (e) {
    console.log('Could not parse DATABASE_URL for logging');
  }
  
  dbConfig = {
    connectionString,
    // Railway requires SSL for PostgreSQL connections
    ssl: isProduction ? { rejectUnauthorized: false } : false,
    // Force IPv4 connections
    family: 4
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
      : false,
    // Force IPv4 connections
    family: 4
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
    
    // More detailed error logging
    if (err.code === 'ENETUNREACH') {
      console.error('Network unreachable error. This is typically an IPv6/IPv4 issue.');
      console.error('Host attempted:', err.address);
      console.error('Port:', err.port);
    }
    
    // If SSL error in production, provide more helpful error
    if (isProduction && err.message.includes('SSL')) {
      console.error('SSL Error: If running locally in production mode, set SSL_ENABLED=false in .env');
    }
    
    // Log the full connection details for debugging (except password)
    if (isProduction) {
      console.error('Connection details:', {
        ...(dbConfig.connectionString ? { connectionString: process.env.DATABASE_URL ? 'Set (Railway)' : 'Set' } : {
          user: dbConfig.user,
          host: dbConfig.host,
          database: dbConfig.database,
          port: dbConfig.port,
        }),
        ssl: dbConfig.ssl,
        family: dbConfig.family
      });
    }
  });

export default {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect()
}; 