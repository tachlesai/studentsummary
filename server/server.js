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