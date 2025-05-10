import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { processAudio, cleanupAllFiles } from './Transcribe_and_summarize/directAudioProcessor.js';
import db from './db.js';
import bcrypt from 'bcryptjs';
import { GoogleGenerativeAI } from './GoogleGenerativeAI.js';

const app = express();
const port = process.env.PORT || 5001;

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow any localhost origin, render.com domains, or no origin (like Postman)
    if (!origin || 
        origin.startsWith('http://localhost:') || 
        origin.includes('tachlesai.com') || 
        origin.includes('.render.com') || 
        origin.includes('tachlesai.onrender.com')) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
// Increase JSON body size limit to handle large audio recordings
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'No token provided' });
  }
  
  try {
    // For our mock JWT format
    if (token.split('.').length === 3) {
      const payload = token.split('.')[1];
      const decoded = Buffer.from(payload, 'base64').toString();
      const userData = JSON.parse(decoded);
      
      if (!userData || !userData.email) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
      }
      
      // Attach user data to request object
      req.user = userData;
      next();
    } else {
      return res.status(401).json({ success: false, error: 'Invalid token format' });
    }
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(401).json({ success: false, error: 'Token verification failed' });
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, `recording_${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 1024 // 1GB limit
  }
});

// Create a more flexible upload middleware that can handle different field names
const flexibleUpload = (req, res, next) => {
  // Use multer.any() to accept any field name
  const uploadAny = multer({ storage: storage }).any();
  
  uploadAny(req, res, function(err) {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ 
        success: false, 
        error: `Upload error: ${err.message}` 
      });
    }
    
    // Log the files received
    console.log('Files received:', req.files ? req.files.map(f => ({ 
      fieldname: f.fieldname, 
      originalname: f.originalname,
      mimetype: f.mimetype,
      size: f.size
    })) : 'No files');
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No audio file uploaded' 
      });
    }
    
    // Use the first file
    req.file = req.files[0];
    next();
  });
};

// Process audio endpoint - for file uploads
app.post('/api/process-audio', verifyToken, flexibleUpload, async (req, res) => {
  try {
    console.log(`Received processed audio file: ${req.file.path}`);
    
    // Extract filename without extension for title
    const filename = path.basename(req.file.originalname);
    const title = path.parse(filename).name;
    
    // Parse options from request body if available
    let parsedOptions = {};
    if (req.body.options) {
      try {
        parsedOptions = JSON.parse(req.body.options);
        console.log('Parsed options:', parsedOptions);
      } catch (e) {
        console.error('Error parsing options:', e);
      }
    }

    // Get the processed audio file path
    const audioPath = req.file.path;
    
    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

    // Read the processed audio file
    const audioData = fs.readFileSync(audioPath);
    const audioBase64 = audioData.toString('base64');

    // Create the prompt based on style and language
    const stylePrompt = getStylePrompt(parsedOptions.style || 'detailed');
    const languagePrompt = getLanguagePrompt(parsedOptions.language || 'he');
    const prompt = `${stylePrompt}\n\n${languagePrompt}\n\nPlease analyze this audio recording and provide a comprehensive summary.`;

    // Generate content
    console.log('Sending request to Gemini API for summarization...');
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'audio/mpeg',
          data: audioBase64
        }
      }
    ]);

    const summary = result.response.text();
    console.log('Received summary from Gemini API');

    // Save to database
    try {
      const query = `
        INSERT INTO summaries (user_email, title, summary, pdf_path, file_name, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING id
      `;
      
      const values = [
        req.user.email,
        title,
        summary,
        null,
        filename
      ];
      
      const dbResult = await db.query(query, values);
      console.log(`Summary saved to database with ID: ${dbResult.rows[0].id}`);
    } catch (dbError) {
      console.error('Database error:', dbError);
    }

    // Clean up the uploaded file
    await cleanupAllFiles([audioPath], { cleanDebugFiles: true });

    res.json({
      success: true,
      summary: {
        content: summary,
        title: title,
        created_at: new Date().toISOString(),
        pdf_path: null,
        file_name: filename,
        style: parsedOptions.style || 'detailed'
      }
    });
  } catch (error) {
    console.error('Error processing audio:', error);
    
    // Still try to clean up even if there was an error
    if (req.file && req.file.path) {
      await cleanupAllFiles([req.file.path], { cleanDebugFiles: true });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Helper functions for prompts
function getStylePrompt(style) {
  switch (style) {
    case 'detailed':
      return 'Please provide a detailed summary that captures all key points, main arguments, and important details from the recording. Include specific examples and quotes when relevant.';
    case 'concise':
      return 'Please provide a concise summary focusing on the main points and key takeaways. Keep it brief but informative.';
    case 'bullet':
      return 'Please provide a bullet-point summary highlighting the main topics, key points, and important details.';
    default:
      return 'Please provide a detailed summary of the recording.';
  }
}

function getLanguagePrompt(language) {
  switch (language) {
    case 'he':
      return 'Please provide the summary in Hebrew.';
    case 'en':
      return 'Please provide the summary in English.';
    default:
      return 'Please provide the summary in Hebrew.';
  }
}

// Process recording endpoint - for direct audio recordings
app.post('/api/process-recording', async (req, res) => {
  let tempFilePath = null;
  
  try {
    console.log('Received direct audio processing request');
    
    if (!req.body.audioData) {
      return res.status(400).json({ 
        success: false, 
        error: 'No audio data provided' 
      });
    }
    
    // Get base64 data from request
    const audioDataString = req.body.audioData;
    console.log(`Audio data received: ${Math.round(audioDataString.length / 1024 / 1024)}MB`);
    
    // Parse options if available
    let parsedOptions = {};
    if (req.body.options) {
      try {
        parsedOptions = JSON.parse(req.body.options);
        console.log('Recording options:', parsedOptions);
      } catch (e) {
        console.error('Error parsing recording options:', e);
      }
    }
    
    // Check if the data is too large for processing
    if (audioDataString.length > 150 * 1024 * 1024) { // 150MB limit
      console.error('Audio data too large for processing');
      return res.status(413).json({
        success: false,
        error: 'Audio data too large. Please provide a shorter recording.'
      });
    }
    
    // Determine file type from the base64 data
    let fileExt = 'webm'; // Default extension
    if (audioDataString.includes('data:audio/mp4;base64,')) {
      fileExt = 'mp4';
    } else if (audioDataString.includes('data:audio/wav;base64,')) {
      fileExt = 'wav';
    } else if (audioDataString.includes('data:audio/mpeg;base64,')) {
      fileExt = 'mp3';
    } else if (audioDataString.includes('data:audio/ogg;base64,')) {
      fileExt = 'ogg';
    }
    
    const base64Data = audioDataString.split(';base64,').pop();
    const tempDir = path.join(__dirname, 'temp');
    
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Create a temporary file path with timestamp
    const timestamp = Date.now();
    tempFilePath = path.join(tempDir, `recording_${timestamp}.${fileExt}`);
    const fileName = `recording_${timestamp}.${fileExt}`;
    
    try {
      // Write the audio data to a temporary file
      fs.writeFileSync(tempFilePath, Buffer.from(base64Data, 'base64'));
      console.log(`Saved audio to temp file: ${tempFilePath} (${Math.round(base64Data.length / 1024 / 1024)}MB)`);
      
      // Get user email from token if available
      let userEmail = 'anonymous@example.com';
      
      // Extract from token if present
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        try {
          // If it's a properly formatted token (our mock JWT format)
          if (token.split('.').length === 3) {
            const payload = token.split('.')[1];
            const decoded = Buffer.from(payload, 'base64').toString();
            console.log('Decoded token for audio recording:', decoded);
            
            const tokenData = JSON.parse(decoded);
            if (tokenData && tokenData.email) {
              userEmail = tokenData.email;
              console.log('Using email from token for recording:', userEmail);
            }
          }
        } catch (err) {
          console.log('Error parsing token:', err.message);
        }
      }
      
      // Process the audio file directly using the direct audio processor
      let result;
      try {
        // Process with options for direct summarization
        console.log('Starting direct audio processing...');
        result = await processAudio(tempFilePath, {
          onlyTranscribe: false, // We want a summary
          skipTranscription: false,
          skipSummarization: false,
          style: parsedOptions.style || 'detailed', // Include the summary style
          language: parsedOptions.language || 'he'
        });
        console.log('Audio processing completed successfully');
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to process audio');
        }
        
        // Clean up the temp file and any other temporary files
        await cleanupAllFiles([tempFilePath], { cleanDebugFiles: true });
        
        // Save to database if we have content
        if (result.summary) {
          try {
            const query = `
              INSERT INTO summaries (user_email, title, summary, pdf_path, file_name, created_at)
              VALUES ($1, $2, $3, $4, $5, NOW())
              RETURNING id
            `;
            
            const values = [
              userEmail,
              'Audio Recording',
              result.summary,
              null, // No PDF path for now
              fileName
            ];
            
            const dbResult = await db.query(query, values);
            console.log(`Summary saved to database with ID: ${dbResult.rows[0].id}`);
          } catch (dbError) {
            console.error('Database error:', dbError);
            // Continue with the response even if database save fails
          }
        }
        
        // Return the processed result
        res.json({
          success: true,
          summary: {
            content: result.summary,
            title: 'Audio Recording',
            created_at: new Date().toISOString(),
            pdf_path: null,
            file_name: fileName,
            style: result.style || parsedOptions.style || 'detailed' // Include the style
          },
          transcription: result.transcript
        });
        
      } catch (procError) {
        console.error('Error processing audio:', procError);
        
        // Clean up any temporary files
        await cleanupAllFiles([tempFilePath], { cleanDebugFiles: true });
        
        return res.status(500).json({
          success: false,
          error: `Error processing audio: ${procError.message}`
        });
      }
    } catch (error) {
      console.error('Error handling audio file:', error);
      
      // Clean up any temporary files
      if (tempFilePath) {
        await cleanupAllFiles([tempFilePath], { cleanDebugFiles: true });
      }
      
      res.status(500).json({
        success: false,
        error: 'Error processing audio file'
      });
    }
  } catch (error) {
    console.error('Error in direct audio processing:', error);
    
    // Clean up any temporary files
    if (tempFilePath) {
      await cleanupAllFiles([tempFilePath], { cleanDebugFiles: true });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server error processing audio'
    });
  }
});

// Add a periodic cleanup job to remove old temporary files
const CLEANUP_INTERVAL = 60 * 60 * 1000; // Run cleanup every hour

async function cleanupOldTempFiles() {
  console.log('Running scheduled cleanup of temporary files...');
  
  const tempDir = path.join(__dirname, 'temp');
  const uploadsDir = path.join(__dirname, 'uploads');
  const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
  const now = Date.now();
  
  // Clean up temp directory
  try {
    if (fs.existsSync(tempDir)) {
      const tempFiles = fs.readdirSync(tempDir)
        .map(file => path.join(tempDir, file))
        .filter(file => {
          try {
            const stats = fs.statSync(file);
            return now - stats.mtimeMs > MAX_AGE;
          } catch (err) {
            return false;
          }
        });
      
      console.log(`Found ${tempFiles.length} old files in temp directory`);
      await cleanupAllFiles(tempFiles);
    }
  } catch (error) {
    console.error('Error cleaning temp directory:', error);
  }
  
  // Clean up uploads directory
  try {
    if (fs.existsSync(uploadsDir)) {
      const uploadFiles = fs.readdirSync(uploadsDir)
        .map(file => path.join(uploadsDir, file))
        .filter(file => {
          try {
            const stats = fs.statSync(file);
            return now - stats.mtimeMs > MAX_AGE;
          } catch (err) {
            return false;
          }
        });
      
      console.log(`Found ${uploadFiles.length} old files in uploads directory`);
      await cleanupAllFiles(uploadFiles);
    }
  } catch (error) {
    console.error('Error cleaning uploads directory:', error);
  }
}

// Start the periodic cleanup
setInterval(cleanupOldTempFiles, CLEANUP_INTERVAL);
// Also run it once when the server starts
cleanupOldTempFiles();

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password, credential } = req.body;
    // Handle regular login
    if (email && password) {
      // Check if the user exists in the database
      let userExists = false;
      let userId = 0;
      let firstName = '';
      let usageCount = 0;
      let dbPassword = '';
      try {
        const userResult = await db.query('SELECT user_id, first_name, usage_count, password FROM users WHERE email = $1', [email]);
        console.log('User query result:', userResult.rows);
        userExists = userResult.rows.length > 0;
        if (userExists) {
          const user = userResult.rows[0];
          firstName = user.first_name || '';
          userId = user.user_id;
          usageCount = user.usage_count || 0;
          dbPassword = user.password;
          console.log(`User found: ${firstName} (${email}), usage count: ${usageCount}`);
        } else {
          console.log(`User not found in DB: ${email}`);
        }
      } catch (userErr) {
        console.log('Error checking user:', userErr);
      }
      // Compare password using bcrypt
      console.log('Login attempt:', { email, password, dbPassword });
      const passwordMatch = await bcrypt.compare(password, dbPassword);
      console.log('Password match:', passwordMatch);
      if (!userExists || !passwordMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }
      // Create a JWT-like token with the email in the payload
      const tokenPayload = {
        email: email,
        id: userId,
        first_name: firstName,
        usage_count: usageCount,
        iat: Math.floor(Date.now() / 1000)
      };
      // Base64 encode the payload (simple mock of JWT)
      const base64Payload = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');
      const mockToken = `mock.${base64Payload}.signature`;
      return res.json({
        success: true,
        token: mockToken,
        user: {
          id: userId,
          email: email,
          first_name: firstName,
          usage_count: usageCount
        }
      });
    }
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid request. Please provide email and password.' 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process login'
    });
  }
});

// Usage status endpoint
app.get('/api/usage-status', async (req, res) => {
  try {
    // Extract user email from token
    let userEmail = null;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      try {
        if (token.split('.').length === 3) {
          const payload = token.split('.')[1];
          const decoded = Buffer.from(payload, 'base64').toString();
          const tokenData = JSON.parse(decoded);
          if (tokenData && tokenData.email) {
            userEmail = tokenData.email;
          }
        }
      } catch (err) {
        console.log('Error parsing token:', err.message);
      }
    }
    
    if (!userEmail) {
      return res.json({
        success: true,
        usageData: {
          currentMonthUsage: 0,
          limit: 10,
          isLimitReached: false,
          subscriptionStatus: 'active',
          nextResetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
        }
      });
    }
    
    // Get usage_count from users table
    let usageCount = 0;
    
    try {
      const result = await db.query(
        'SELECT usage_count FROM users WHERE email = $1',
        [userEmail]
      );
      
      if (result && result.rows && result.rows.length > 0) {
        usageCount = parseInt(result.rows[0].usage_count) || 0;
      }
    } catch (err) {
      console.error('Error getting usage count:', err);
    }
    
    const limit = 10;
    const isLimitReached = usageCount >= limit;

    res.json({
      success: true,
      usageData: {
        currentMonthUsage: usageCount,
        limit: limit,
        isLimitReached: isLimitReached,
        subscriptionStatus: 'active',
        nextResetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching usage status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch usage status'
    });
  }
});

// Summaries endpoint
app.get('/api/summaries', async (req, res) => {
  try {
    // Extract user email from token
    let userEmail = null;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      try {
        if (token.split('.').length === 3) {
          const payload = token.split('.')[1];
          const decoded = Buffer.from(payload, 'base64').toString();
          const tokenData = JSON.parse(decoded);
          if (tokenData && tokenData.email) {
            userEmail = tokenData.email;
          }
        }
      } catch (err) {
        console.log('Error parsing token:', err.message);
      }
    }
    
    let result;
    if (userEmail) {
      result = await db.query(
        'SELECT id, user_email, summary, pdf_path, created_at, title, file_name FROM summaries WHERE user_email = $1 ORDER BY created_at DESC',
        [userEmail]
      );
    } else {
      result = await db.query(
        'SELECT id, user_email, summary, pdf_path, created_at, title, file_name FROM summaries ORDER BY created_at DESC',
        []
      );
    }
    
    const summaries = result.rows.map(row => ({
      id: row.id,
      title: row.title || 'Untitled',
      content: row.summary,
      summary: row.summary,
      pdf_path: row.pdf_path,
      created_at: row.created_at,
      file_name: row.file_name,
      user_email: row.user_email
    }));

    res.json({
      success: true,
      summaries: summaries
    });
  } catch (error) {
    console.error('Error fetching summaries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch summaries'
    });
  }
});

// Get user first_name endpoint
app.get('/api/user-first-name', async (req, res) => {
  try {
    let userEmail = null;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      try {
        if (token.split('.').length === 3) {
          const payload = token.split('.')[1];
          const decoded = Buffer.from(payload, 'base64').toString();
          const tokenData = JSON.parse(decoded);
          if (tokenData && tokenData.email) {
            userEmail = tokenData.email;
          }
        }
      } catch (err) {
        console.log('Error parsing token:', err.message);
      }
    }
    
    if (!userEmail) {
      return res.status(401).json({ success: false, message: 'No user email found in token' });
    }
    
    const result = await db.query('SELECT first_name FROM users WHERE email = $1', [userEmail]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const firstName = result.rows[0].first_name || '';

    res.json({
      success: true,
      first_name: firstName
    });
  } catch (error) {
    console.error('Error fetching user first_name:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user first_name'
    });
  }
});

// Update usage endpoint
app.post('/api/update-usage', verifyToken, async (req, res) => {
  const userEmail = req.user.email;

  try {
    const updateResult = await db.query(
      'UPDATE users SET usage_count = usage_count + 1 WHERE email = $1 RETURNING usage_count',
      [userEmail]
    );
    const newUsageCount = updateResult.rows[0]?.usage_count || 0;
    console.log(`Incremented usage_count for user ${userEmail} to ${newUsageCount}`);
    
    return res.status(200).json({ success: true, usage_count: newUsageCount });
  } catch (error) {
    console.error('Error updating usage count:', error);
    return res.status(500).json({ success: false, error: 'Failed to update usage count' });
  }
});

// Registration endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phoneNumber } = req.body;
    if (!firstName || !lastName || !email || !password || !phoneNumber) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    // Check if user already exists by email or phone number
    let userExists = false;
    let userId = 0;
    try {
      const userResult = await db.query('SELECT user_id FROM users WHERE email = $1 OR phone_number = $2', [email, phoneNumber]);
      userExists = userResult.rows.length > 0;
      if (userExists) {
        return res.status(409).json({ success: false, message: 'User with this email or phone number already exists' });
      }
    } catch (userErr) {
      console.log('Error checking user:', userErr);
    }
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    // Insert new user
    let newUser;
    try {
      const insertResult = await db.query(
        'INSERT INTO users (first_name, last_name, email, password, phone_number, usage_count) VALUES ($1, $2, $3, $4, $5, 0) RETURNING user_id, first_name, email, usage_count',
        [firstName, lastName, email, hashedPassword, phoneNumber]
      );
      newUser = insertResult.rows[0];
      userId = newUser.user_id;
    } catch (insertErr) {
      console.log('Error inserting user:', insertErr);
      return res.status(500).json({ success: false, message: 'Failed to create user' });
    }
    // Create a JWT-like token with the email in the payload
    const tokenPayload = {
      email: email,
      id: userId,
      first_name: firstName,
      usage_count: 0,
      iat: Math.floor(Date.now() / 1000)
    };
    const base64Payload = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');
    const mockToken = `mock.${base64Payload}.signature`;
    return res.json({
      success: true,
      token: mockToken,
      user: {
        id: userId,
        email: email,
        first_name: firstName,
        usage_count: 0
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Failed to process registration' });
  }
});

// Check if user exists by email or phone number
app.post('/api/check-user-exists', async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;
    const userResult = await db.query('SELECT user_id FROM users WHERE email = $1 OR phone_number = $2', [email, phoneNumber]);
    if (userResult.rows.length > 0) {
      return res.json({ exists: true });
    }
    return res.json({ exists: false });
  } catch (error) {
    console.error('Check user exists error:', error);
    res.status(500).json({ exists: false, error: 'Failed to check user' });
  }
});

// Account details endpoint
app.get('/api/account-details', async (req, res) => {
  try {
    let userEmail = null;
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        if (token.split('.').length === 3) {
          const payload = token.split('.')[1];
          const decoded = Buffer.from(payload, 'base64').toString();
          const tokenData = JSON.parse(decoded);
          if (tokenData && tokenData.email) {
            userEmail = tokenData.email;
          }
        }
      } catch (err) {
        console.log('Error parsing token:', err.message);
      }
    }
    if (!userEmail) {
      return res.status(401).json({ success: false, message: 'No user email found in token' });
    }
    // Fetch user details from DB
    const result = await db.query('SELECT first_name, email, membership_type FROM users WHERE email = $1', [userEmail]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const user = result.rows[0];
    // membershipStatus is 'Premium' if membership_type is 'payed', else 'Free'
    const membershipStatus = user.membership_type === 'payed' ? 'Premium' : 'Free';
    // Placeholder receipt (replace with real receipt logic if available)
    const receipt = membershipStatus === 'Premium' ? {
      id: '1234567890',
      date: '2024-05-05',
      amount: '₪99',
      url: '#'
    } : null;
    res.json({
      success: true,
      name: user.first_name || '',
      email: user.email,
      membershipStatus,
      receipt
    });
  } catch (error) {
    console.error('Error fetching account details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch account details' });
  }
});

// Health check endpoint for Render
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const staticFilesPath = path.join(__dirname, '../Student_summary/dist');
  console.log(`Serving static files from: ${staticFilesPath}`);
  
  // Serve static files
  app.use(express.static(staticFilesPath));
  
  // For any other route, serve the index.html
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api')) return;
    res.sendFile(path.join(staticFilesPath, 'index.html'));
  });
}

// Start the server
const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// Schedule cleanup job to run every hour - this will clean up any temporary files
// that may have been left behind
const cleanupJob = setInterval(cleanupOldTempFiles, 60 * 60 * 1000); // 1 hour