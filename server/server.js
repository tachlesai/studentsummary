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

// Add a test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
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

// For any other request, send the React app's index.html
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  console.log('Fallback to index.html for path:', req.path);
  
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('index.html not found');
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

// Add usage status endpoint
app.get('/api/usage-status', async (req, res) => {
  try {
    // Get user ID from JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userId = decoded.userId;
    
    // Get user's membership type
    const userResult = await db.query('SELECT membership_type FROM users WHERE id = $1', [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const membershipType = userResult.rows[0].membership_type;
    
    // Count user's summaries
    const summariesResult = await db.query('SELECT COUNT(*) FROM summaries WHERE user_id = $1', [userId]);
    const summaryCount = parseInt(summariesResult.rows[0].count);
    
    // Define usage limits based on membership type
    let usageLimit = 5; // Default for free tier
    if (membershipType === 'premium') {
      usageLimit = 100;
    } else if (membershipType === 'unlimited') {
      usageLimit = Infinity;
    }
    
    res.json({
      success: true,
      membershipType,
      summaryCount,
      usageLimit,
      remainingUsage: Math.max(0, usageLimit - summaryCount)
    });
  } catch (error) {
    console.error('Usage status error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Add summaries endpoint
app.get('/api/summaries', async (req, res) => {
  try {
    // Get user ID from JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userId = decoded.userId;
    
    // Get user's summaries
    const summariesResult = await db.query(
      'SELECT * FROM summaries WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    res.json({
      success: true,
      summaries: summariesResult.rows
    });
  } catch (error) {
    console.error('Summaries error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

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

// Add process-audio endpoint
app.post('/api/process-audio', upload.single('audio'), async (req, res) => {
  try {
    // Get user ID from JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userId = decoded.userId;
    
    // Check if user exists
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Check usage limits
    const summariesResult = await db.query('SELECT COUNT(*) FROM summaries WHERE user_id = $1', [userId]);
    const summaryCount = parseInt(summariesResult.rows[0].count);
    
    let usageLimit = 5; // Default for free tier
    if (user.membership_type === 'premium') {
      usageLimit = 100;
    } else if (user.membership_type === 'unlimited') {
      usageLimit = Infinity;
    }
    
    if (summaryCount >= usageLimit) {
      return res.status(403).json({ 
        success: false, 
        message: 'Usage limit reached. Please upgrade your membership to continue.' 
      });
    }
    
    // Process the audio file
    const audioPath = req.file.path;
    const title = req.body.title || 'Untitled Summary';
    
    // Transcribe the audio
    const transcription = await transcribeAudio(audioPath);
    
    // Summarize the transcription
    const summary = await summarizeText(transcription);
    
    // Generate PDF (if your function supports it)
    let pdfPath = '';
    try {
      pdfPath = await generatePDF(title, summary);
    } catch (error) {
      console.error('PDF generation error:', error);
      // Continue without PDF if there's an error
    }
    
    // Save the summary to the database
    const newSummaryResult = await db.query(
      'INSERT INTO summaries (user_id, title, content, audio_path, pdf_path) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, title, summary, audioPath, pdfPath]
    );
    
    const newSummary = newSummaryResult.rows[0];
    
    res.json({
      success: true,
      summary: newSummary
    });
  } catch (error) {
    console.error('Process audio error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
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