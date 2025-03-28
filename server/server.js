console.log('Starting server initialization...');

import express from "express";
import bcrypt from "bcryptjs";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import path from 'path';
import { fileURLToPath } from 'url';
import { unlink } from 'fs/promises';
import multer from 'multer';
import { existsSync, mkdirSync } from 'fs';
import fs from 'fs';
import { createClient } from '@deepgram/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';

console.log('Imports completed');

// Import database connection
import db from './db.js';

// Import the working audio processing functions
import { transcribeAudio, summarizeText, generatePDF } from './Transcribe_and_summarize/audioProcessing.js';

console.log('Custom imports completed');

// Load environment variables
dotenv.config();
console.log('Environment variables loaded');

// Set up Express app
const app = express();
const PORT = process.env.PORT || 5001;
const isDevelopment = process.env.NODE_ENV !== 'production';
const BASE_URL = isDevelopment 
  ? `http://localhost:${PORT}` 
  : process.env.RENDER_EXTERNAL_URL || 'https://studentsummary.onrender.com';

console.log('Express app created');

// Define allowed origins for CORS - ONLY DEFINE THIS ONCE
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5001',
  'http://localhost:3000',
  'https://studentsummary.onrender.com',
  'https://www.studentsummary.onrender.com'
];

console.log('ALLOWED_ORIGINS defined');

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    if (ALLOWED_ORIGINS.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.error("Not allowed by CORS:", origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

console.log('CORS options defined');

// Apply middleware
console.log('Setting up middleware...');
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
console.log('Middleware setup complete');

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the path to the React build directory
const distPath = path.join(__dirname, '..', 'Student_summary', 'dist');
console.log('distPath defined:', distPath);

// Serve assets with explicit MIME types
app.get('/assets/:file', (req, res) => {
  const filePath = path.join(distPath, 'assets', req.params.file);
  console.log('Requested asset:', req.params.file);
  console.log('Full path:', filePath);
  
  if (fs.existsSync(filePath)) {
    console.log('Asset file exists');
    
    // Set the correct MIME type based on file extension
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
      console.log('Setting Content-Type to text/css');
    } else if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
      console.log('Setting Content-Type to application/javascript');
    }
    
    // Send the file
    res.sendFile(filePath);
  } else {
    console.log('Asset file does not exist');
    res.status(404).send('Asset not found');
  }
});

// Serve the index.html file for the root path
app.get('/', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  console.log('Serving index.html from:', indexPath);
  
  if (fs.existsSync(indexPath)) {
    console.log('index.html file exists');
    res.sendFile(indexPath);
  } else {
    console.log('index.html file does not exist');
    res.status(404).send('index.html not found');
  }
});

// Serve other static files from the dist directory
app.use(express.static(distPath, {
  setHeaders: (res, filePath) => {
    console.log('Serving static file:', filePath);
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Setup database tables and columns
async function setupDatabase() {
  console.log('Starting database setup');
  try {
    // Check if the users table exists
    const checkTableResult = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    
    // If the users table doesn't exist, create it
    if (checkTableResult.rows.length === 0) {
      console.log('Creating users table');
      await db.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255),
          first_name VARCHAR(100),
          last_name VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          google_id VARCHAR(255),
          membership_type VARCHAR(20) DEFAULT 'free' NOT NULL
        )
      `);
      console.log('Users table created successfully');
    } else {
      console.log('Users table already exists');
      
      // Check if the membership_type column exists
      const checkColumnResult = await db.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'membership_type'
      `);
      
      // If the column doesn't exist, add it
      if (checkColumnResult.rows.length === 0) {
        console.log('Adding membership_type column to users table');
        await db.query(`
          ALTER TABLE users 
          ADD COLUMN membership_type VARCHAR(20) DEFAULT 'free' NOT NULL
        `);
        console.log('membership_type column added successfully');
      } else {
        console.log('membership_type column already exists');
      }
    }
    
    // Check if the summaries table exists
    const checkSummariesTableResult = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'summaries'
    `);
    
    // If the summaries table doesn't exist, create it
    if (checkSummariesTableResult.rows.length === 0) {
      console.log('Creating summaries table');
      await db.query(`
        CREATE TABLE summaries (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id),
          title VARCHAR(255),
          content TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          audio_path VARCHAR(255),
          pdf_path VARCHAR(255)
        )
      `);
      console.log('Summaries table created successfully');
    } else {
      console.log('Summaries table already exists');
    }
    
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
    // Continue execution even if there's an error
  }
}

// Add a test endpoint
app.get('/api/test', (req, res) => {
  console.log('Test endpoint called');
  res.json({ 
    success: true, 
    message: 'API is working!',
    baseUrl: BASE_URL,
    env: process.env.NODE_ENV
  });
});

// Log the structure of the dist directory
console.log('Checking dist directory:', distPath);

if (fs.existsSync(distPath)) {
  console.log('Dist directory exists');
  const files = fs.readdirSync(distPath);
  console.log('Files in dist directory:', files);
  
  const assetsPath = path.join(distPath, 'assets');
  if (fs.existsSync(assetsPath)) {
    console.log('Assets directory exists');
    const assetFiles = fs.readdirSync(assetsPath);
    console.log('Files in assets directory:', assetFiles);
  } else {
    console.log('Assets directory does not exist');
  }
} else {
  console.log('Dist directory does not exist');
}

// Add this near the top of your file, after the imports
const logRequest = (req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
};

// Add this middleware to log all requests
app.use(logRequest);

// Set up multer for file uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Modify the process-audio endpoint to add more detailed error handling
app.post('/api/process-audio', upload.single('audioFile'), async (req, res) => {
  console.log('Process audio endpoint called');
  try {
    // Check if file was uploaded
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    console.log('File uploaded:', req.file.path);
    
    // Get user ID from JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Unauthorized - no valid auth header');
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      console.log('JWT verification failed:', error.message);
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    
    const userId = decoded.userId;
    console.log('User ID from token:', userId);
    
    // Check if user exists
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    
    if (userResult.rows.length === 0) {
      console.log('User not found:', userId);
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    console.log('User found:', user.email);
    
    // Check usage limits
    const summariesResult = await db.query('SELECT COUNT(*) FROM summaries WHERE user_id = $1', [userId]);
    const summaryCount = parseInt(summariesResult.rows[0].count);
    console.log('Summary count:', summaryCount);
    
    let usageLimit = 5; // Default for free tier
    if (user.membership_type === 'premium') {
      usageLimit = 100;
    } else if (user.membership_type === 'unlimited') {
      usageLimit = Infinity;
    }
    console.log('Usage limit:', usageLimit);
    
    if (summaryCount >= usageLimit) {
      console.log('Usage limit reached');
      return res.status(403).json({ 
        success: false, 
        message: 'Usage limit reached. Please upgrade your membership to continue.' 
      });
    }
    
    // Process the audio file
    const audioPath = req.file.path;
    const title = req.body.title || 'Untitled Summary';
    console.log('Processing audio:', audioPath, 'with title:', title);
    
    // Transcribe the audio
    console.log('Starting transcription...');
    const transcription = await transcribeAudio(audioPath);
    console.log('Transcription completed');
    
    // Summarize the transcription
    console.log('Starting summarization...');
    const summary = await summarizeText(transcription);
    console.log('Summarization completed');
    
    // Generate PDF (if your function supports it)
    let pdfPath = '';
    try {
      console.log('Generating PDF...');
      pdfPath = await generatePDF(title, summary);
      console.log('PDF generated:', pdfPath);
    } catch (error) {
      console.error('PDF generation error:', error);
      // Continue without PDF if there's an error
    }
    
    // Save the summary to the database
    console.log('Saving summary to database...');
    const newSummaryResult = await db.query(
      'INSERT INTO summaries (user_id, title, content, audio_path, pdf_path) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, title, summary, audioPath, pdfPath]
    );
    
    const newSummary = newSummaryResult.rows[0];
    console.log('Summary saved to database with ID:', newSummary.id);
    
    const relativePdfPath = pdfPath ? `/files/${path.basename(pdfPath)}` : null;
    console.log('Relative PDF path for client:', relativePdfPath);
    
    const fullPdfUrl = `http://localhost:5001${relativePdfPath}`;
    
    res.json({
      success: true,
      summary: summary,
      pdfPath: fullPdfUrl
    });
  } catch (error) {
    console.error('Process audio error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Add login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    
    const user = userResult.rows[0];
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    // Return user info and token
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        membershipType: user.membership_type
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Add registration endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    // Check if user already exists
    const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const newUserResult = await db.query(
      'INSERT INTO users (email, password, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING *',
      [email, hashedPassword, firstName, lastName]
    );
    
    const newUser = newUserResult.rows[0];
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    // Return user info and token
    res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        membershipType: newUser.membership_type
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Add signup endpoint (alias for register)
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    // Check if user already exists
    const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const newUserResult = await db.query(
      'INSERT INTO users (email, password, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING *',
      [email, hashedPassword, firstName, lastName]
    );
    
    const newUser = newUserResult.rows[0];
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    // Return user info and token
    res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        membershipType: newUser.membership_type
      },
      token
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Add Google OAuth endpoint
app.post('/api/google-login', async (req, res) => {
  try {
    const { token } = req.body;
    
    // Verify Google token
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { email, given_name, family_name, sub: googleId } = payload;
    
    // Check if user exists
    let userResult = await db.query('SELECT * FROM users WHERE email = $1 OR google_id = $2', [email, googleId]);
    let user;
    
    if (userResult.rows.length === 0) {
      // Create new user
      const newUserResult = await db.query(
        'INSERT INTO users (email, first_name, last_name, google_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [email, given_name, family_name, googleId]
      );
      
      user = newUserResult.rows[0];
    } else {
      user = userResult.rows[0];
      
      // Update Google ID if not set
      if (!user.google_id) {
        await db.query('UPDATE users SET google_id = $1 WHERE id = $2', [googleId, user.id]);
      }
    }
    
    // Generate JWT token
    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    // Return user info and token
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        membershipType: user.membership_type
      },
      token: jwtToken
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Add a special route to handle localhost:5001 requests
app.get('/localhost:5001/api/usage-status', (req, res) => {
  console.log('Intercepted localhost:5001 request for usage-status');
  
  // Return default values
  res.json({
    success: true,
    membershipType: 'free',
    summaryCount: 0,
    usageLimit: 5,
    remainingUsage: 5
  });
});

// Add a special route to handle localhost:5001 requests for summaries
app.get('/localhost:5001/api/summaries', (req, res) => {
  console.log('Intercepted localhost:5001 request for summaries');
  
  // Return an empty array
  res.json({
    success: true,
    summaries: []
  });
});

// Add a proxy for localhost:5001 requests
app.use((req, res, next) => {
  const originalUrl = req.originalUrl;
  
  // Check if this is a request that's trying to access localhost:5001
  if (req.headers.referer && req.headers.referer.includes('localhost:5001')) {
    console.log('Detected localhost:5001 referer:', req.headers.referer);
  }
  
  // If the request is for localhost:5001/api/*, redirect to /api/*
  if (originalUrl.includes('localhost:5001/api/')) {
    const newUrl = originalUrl.replace('localhost:5001/api/', '/api/');
    console.log(`Redirecting ${originalUrl} to ${newUrl}`);
    return res.redirect(newUrl);
  }
  
  next();
});

// Update the summaries endpoint to return a properly formatted response with logging
app.get('/api/summaries', async (req, res) => {
  console.log('Summaries endpoint called');
  
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid auth header');
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    // Extract and verify the token
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      console.log('JWT verification failed:', error.message);
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    
    // Get the user ID from the token
    const userId = decoded.userId;
    console.log('User ID from token:', userId);
    
    // Query the database for summaries
    const summariesResult = await db.query(
      'SELECT * FROM summaries WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    // Always return an array, even if empty
    const summaries = summariesResult.rows || [];
    console.log(`Found ${summaries.length} summaries for user ${userId}`);
    
    // Log the response data
    const responseData = {
      success: true,
      summaries: summaries
    };
    console.log('Returning summaries response:', JSON.stringify(responseData));
    
    // Send the response
    res.json(responseData);
  } catch (error) {
    console.error('Error fetching summaries:', error);
    // Always return an array for summaries, even on error
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message,
      summaries: [] // Include an empty array to prevent client-side errors
    });
  }
});

// Update the usage-status endpoint to return properly formatted data
app.get('/api/usage-status', async (req, res) => {
  console.log('Usage status endpoint called');
  
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid auth header');
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    // Extract and verify the token
    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      console.log('JWT verification failed:', error.message);
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    
    // Get the user ID from the token
    const userId = decoded.userId;
    console.log('User ID from token:', userId);
    
    // Get user information
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    
    if (userResult.rows.length === 0) {
      console.log('User not found:', userId);
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    console.log('User found:', user.email);
    
    // Get summary count
    const summariesResult = await db.query('SELECT COUNT(*) FROM summaries WHERE user_id = $1', [userId]);
    const summaryCount = parseInt(summariesResult.rows[0].count);
    console.log('Summary count:', summaryCount);
    
    // Determine usage limit based on membership type
    let usageLimit = 5; // Default for free tier
    if (user.membership_type === 'premium') {
      usageLimit = 100;
    } else if (user.membership_type === 'unlimited') {
      usageLimit = Infinity;
    }
    
    // Calculate remaining usage
    const remainingUsage = Math.max(0, usageLimit - summaryCount);
    
    // Create the response object
    const responseData = {
      success: true,
      membershipType: user.membership_type,
      summaryCount: summaryCount,
      usageLimit: usageLimit,
      remainingUsage: remainingUsage
    };
    
    // Log the response data
    console.log('Returning usage status response:', JSON.stringify(responseData));
    
    // Send the response
    res.json(responseData);
  } catch (error) {
    console.error('Error fetching usage status:', error);
    // Return default values on error
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message,
      membershipType: 'free',
      summaryCount: 0,
      usageLimit: 5,
      remainingUsage: 5
    });
  }
});

// Add a special route to handle localhost:5001 requests for summaries with logging
app.get('/localhost:5001/api/summaries', (req, res) => {
  console.log('Intercepted localhost:5001 request for summaries');
  
  // Create the response object
  const responseData = {
    success: true,
    summaries: [] // This must be an array, even if empty
  };
  
  // Log the response data
  console.log('Returning localhost:5001 summaries response:', JSON.stringify(responseData));
  
  // Send the response
  res.json(responseData);
});

// Add a specific handler for the dashboard page
app.get('/dashboard', (req, res) => {
  console.log('Dashboard page requested - serving custom HTML');
  
  // Send a simple HTML page that will work
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Dashboard - Student Summary</title>
      <link rel="stylesheet" href="/assets/index-CEaGewsz.css">
      <style>
        .dashboard-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          padding: 20px;
          margin-bottom: 20px;
        }
        .button {
          background: #4a90e2;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
        }
        .button:hover {
          background: #3a80d2;
        }
        .summaries-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }
        .summary-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          padding: 20px;
        }
        .usage-info {
          display: flex;
          justify-content: space-between;
          background: #f5f5f5;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="dashboard-container">
        <div class="header">
          <h1>Dashboard</h1>
          <a href="/" class="button">Home</a>
        </div>
        
        <div class="card">
          <h2>Usage Information</h2>
          <div class="usage-info">
            <div>
              <strong>Membership Type:</strong> Free
            </div>
            <div>
              <strong>Summaries Used:</strong> 0 / 5
            </div>
            <div>
              <strong>Remaining:</strong> 5
            </div>
          </div>
          <a href="/upload" class="button">Create New Summary</a>
        </div>
        
        <div class="card">
          <h2>Your Summaries</h2>
          <div class="summaries-list">
            <div class="summary-card">
              <h3>No summaries yet</h3>
              <p>Upload an audio file to create your first summary.</p>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Add a specific endpoint to check if the API is working from the dashboard
app.get('/api/dashboard-check', (req, res) => {
  console.log('Dashboard check endpoint called');
  res.json({
    success: true,
    message: 'Dashboard API is working!',
    baseUrl: BASE_URL,
    env: process.env.NODE_ENV
  });
});

// Add middleware to redirect localhost API requests to the correct domain in production
app.use((req, res, next) => {
  const referer = req.headers.referer;
  
  // Check if this is a request from a page that's trying to access localhost
  if (referer && referer.includes('localhost') && !isDevelopment) {
    console.log('Detected localhost referer in production:', referer);
    
    // If this is an API request, log it
    if (req.path.startsWith('/api')) {
      console.log('API request with localhost referer:', req.path);
    }
  }
  
  next();
});

// Move this BEFORE the catch-all route for the React app
// Make sure all API routes are defined before this middleware
app.use('/api', (req, res) => {
  console.log('API route not found:', req.path);
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Add a special endpoint to inject a fix for the localhost:5001 issue
app.get('/api-fix.js', (req, res) => {
  console.log('Serving API fix script');
  
  // Set the correct content type
  res.setHeader('Content-Type', 'application/javascript');
  
  // Return a script that will intercept fetch requests to localhost:5001
  res.send(`
    console.log('API fix script loaded');
    
    // Store the original fetch function
    const originalFetch = window.fetch;
    
    // Override the fetch function
    window.fetch = function(url, options) {
      // Check if the URL contains localhost:5001
      if (typeof url === 'string' && url.includes('localhost:5001')) {
        // Replace localhost:5001 with the current origin
        const newUrl = url.replace('localhost:5001', window.location.origin);
        console.log('Redirecting fetch from', url, 'to', newUrl);
        return originalFetch(newUrl, options);
      }
      
      // Otherwise, use the original fetch
      return originalFetch(url, options);
    };
    
    // Also fix any hardcoded API_BASE_URL
    if (window.API_BASE_URL && window.API_BASE_URL.includes('localhost:5001')) {
      console.log('Fixing API_BASE_URL from', window.API_BASE_URL);
      window.API_BASE_URL = window.API_BASE_URL.replace('localhost:5001', window.location.origin);
      console.log('API_BASE_URL fixed to', window.API_BASE_URL);
    }
  `);
});

// Add a route to serve a service worker that will intercept all network requests
app.get('/sw.js', (req, res) => {
  console.log('Serving service worker');
  
  // Set the correct content type
  res.setHeader('Content-Type', 'application/javascript');
  
  // Return a service worker that will intercept all network requests
  res.send(`
    console.log('Service worker loaded');
    
    // Cache name
    const CACHE_NAME = 'api-fix-cache-v1';
    
    // Install event
    self.addEventListener('install', event => {
      console.log('Service worker installed');
      self.skipWaiting();
    });
    
    // Activate event
    self.addEventListener('activate', event => {
      console.log('Service worker activated');
      return self.clients.claim();
    });
    
    // Fetch event
    self.addEventListener('fetch', event => {
      const url = new URL(event.request.url);
      
      // Check if this is a request to localhost:5001
      if (url.hostname === 'localhost' && url.port === '5001') {
        console.log('Intercepting request to localhost:5001:', url.pathname);
        
        // Create a new URL with the current origin
        const newUrl = new URL(url.pathname, self.location.origin);
        console.log('Redirecting to:', newUrl.href);
        
        // Fetch from the new URL
        event.respondWith(
          fetch(newUrl, {
            method: event.request.method,
            headers: event.request.headers,
            body: event.request.body,
            mode: 'cors',
            credentials: 'include'
          })
        );
      }
    });
  `);
});

// Add a script to register the service worker
app.get('/register-sw.js', (req, res) => {
  console.log('Serving service worker registration script');
  
  // Set the correct content type
  res.setHeader('Content-Type', 'application/javascript');
  
  // Return a script that will register the service worker
  res.send(`
    console.log('Service worker registration script loaded');
    
    // Register the service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('Service worker registered:', registration);
          })
          .catch(error => {
            console.error('Service worker registration failed:', error);
          });
      });
    }
  `);
});

// Modify the index.html to include our service worker registration script
app.use('*', (req, res, next) => {
  // Skip for API requests and the service worker scripts
  if (req.path.startsWith('/api') || req.path === '/sw.js' || req.path === '/register-sw.js') {
    return next();
  }
  
  // For HTML requests, inject our script
  if (req.path.endsWith('.html') || req.path === '/' || !req.path.includes('.')) {
    const indexPath = path.join(distPath, 'index.html');
    
    if (fs.existsSync(indexPath)) {
      // Read the index.html file
      fs.readFile(indexPath, 'utf8', (err, data) => {
        if (err) {
          console.error('Error reading index.html:', err);
          return next();
        }
        
        // Inject our script before the closing </head> tag
        const modifiedData = data.replace('</head>', '<script src="/register-sw.js"></script></head>');
        
        // Send the modified HTML
        res.send(modifiedData);
      });
    } else {
      next();
    }
  } else {
    next();
  }
});

// Add a route to serve a modified version of the JavaScript bundle
app.get('/assets/index-BbntgpZN.js', (req, res) => {
  console.log('Serving modified JavaScript bundle');
  
  const jsPath = path.join(distPath, 'assets', 'index-BbntgpZN.js');
  
  if (fs.existsSync(jsPath)) {
    // Read the JavaScript file
    fs.readFile(jsPath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading JavaScript bundle:', err);
        return res.status(500).send('Error reading JavaScript bundle');
      }
      
      // Replace all instances of localhost:5001 with an empty string (which makes it relative to the current origin)
      const modifiedData = data.replace(/localhost:5001/g, '');
      
      // Set the correct content type
      res.setHeader('Content-Type', 'application/javascript');
      
      // Send the modified JavaScript
      res.send(modifiedData);
    });
  } else {
    res.status(404).send('JavaScript bundle not found');
  }
});

// Add a fallback route for any JavaScript bundle
app.get('/assets/index-*.js', (req, res, next) => {
  console.log('Serving modified JavaScript bundle for:', req.path);
  
  const jsPath = path.join(distPath, req.path);
  
  if (fs.existsSync(jsPath)) {
    // Read the JavaScript file
    fs.readFile(jsPath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading JavaScript bundle:', err);
        return next();
      }
      
      // Replace all instances of localhost:5001 with an empty string (which makes it relative to the current origin)
      const modifiedData = data.replace(/localhost:5001/g, '');
      
      // Set the correct content type
      res.setHeader('Content-Type', 'application/javascript');
      
      // Send the modified JavaScript
      res.send(modifiedData);
    });
  } else {
    next();
  }
});

console.log('About to start server...');

// Start the server first
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Then setup database after server is running
  console.log('Server started, now setting up database...');
  setupDatabase().catch(err => {
    console.error('Failed to setup database, but server is still running:', err);
  });
});