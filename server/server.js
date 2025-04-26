import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { processAndSummarize } from './Transcribe_and_summarize/transcribeAndSummarize.js';
import { processAudio } from './Transcribe_and_summarize/directAudioProcessor.js';
import db from './db.js';

const app = express();
const port = process.env.PORT || 5001;

// In-memory store for summaries (for development mode)
const inMemorySummaries = [
  {
    id: 1,
    title: 'Sample Summary 1',
    content: 'This is a sample summary content for testing.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    pdf_path: '/mock-pdfs/sample1.pdf'
  },
  {
    id: 2,
    title: 'Sample Summary 2',
    content: 'This is another sample summary content for testing.',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    pdf_path: '/mock-pdfs/sample2.pdf'
  }
];

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow any localhost origin or no origin (like Postman)
    if (!origin || origin.startsWith('http://localhost:') || origin.includes('tachlesai.com')) {
      callback(null, true);
    } else {
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
    console.log('Multer received file with fieldname:', file.fieldname);
    cb(null, `recording_${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Configure multer to accept any field, with debug logging
const upload = multer({ 
  storage: storage,
  // Log all fields received in the request
  onError: function(err, next) {
    console.log('Multer error:', err);
    next(err);
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

// API endpoint for audio transcription
app.post('/api/transcribe', upload.single('audioFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No audio file uploaded' });
    }

    const filePath = req.file.path;
    console.log(`Received audio file: ${filePath}`);

    // Process the audio file (transcribe and summarize)
    const summary = await processAndSummarize(filePath);
    
    // Get the transcription from the first step
    const transcription = await fs.promises.readFile(
      path.join(__dirname, 'temp', 'transcription.txt'), 
      'utf8'
    ).catch(() => 'Transcription not available');

    // Clean up the uploaded file
    fs.unlink(filePath, (err) => {
      if (err) console.error(`Error deleting file: ${err}`);
    });

    res.json({
      success: true,
      transcription,
      summary
    });
  } catch (error) {
    console.error('Error processing audio:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process audio. Please try again later.'
    });
  }
});

// Transcribe endpoint with base64
app.post('/api/transcribe-base64', async (req, res) => {
  try {
    console.log('Received base64 transcription request');
    
    if (!req.body.audioData) {
      return res.status(400).json({ 
        success: false, 
        error: 'No audio data provided' 
      });
    }
    
    const base64Data = req.body.audioData.split(';base64,').pop();
    const fileExt = req.body.filename ? req.body.filename.split('.').pop() : 'webm';
    const uploadDir = path.join(__dirname, 'uploads');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Generate file path
    const fileName = `recording_${Date.now()}.${fileExt}`;
    const filePath = path.join(uploadDir, fileName);
    
    // Write file to disk
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    console.log(`Saved base64 audio to: ${filePath}`);
    
    // Process the audio file (transcribe and summarize)
    const summary = await processAndSummarize(filePath);
    
    // Get the transcription from the first step
    const transcription = await fs.promises.readFile(
      path.join(__dirname, 'temp', 'transcription.txt'), 
      'utf8'
    ).catch(() => 'Transcription not available');
    
    // Clean up the uploaded file
    fs.unlink(filePath, (err) => {
      if (err) console.error(`Error deleting file: ${err}`);
    });
    
    res.json({
      success: true,
      transcription,
      summary
    });
  } catch (error) {
    console.error('Error processing audio:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process audio. Please try again later.'
    });
  }
});

// Process audio endpoint
app.post('/api/process-audio', verifyToken, flexibleUpload, async (req, res) => {
  try {
    console.log(`Processing audio file: ${req.file.path}`);
    
    // Extract filename without extension for title
    const filename = path.basename(req.file.originalname);
    const title = path.parse(filename).name;
    
    // Get processing options from request
    const options = {
      onlyTranscribe: req.body.outputType === 'transcript',
      skipTranscription: false,
      skipSummarization: req.body.outputType === 'transcript'
    };
    
    console.log('Processing options:', options);

    // Process the audio file
    const result = await processAudio(req.file.path, options);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to process audio');
    }

    // Prepare response data based on output type
    const responseData = {
      title: title,
      content: req.body.outputType === 'transcript' ? result.transcript : result.summary,
      transcription: result.transcript,
      pdfPath: null // PDF generation will be handled separately if needed
    };

    // Save to database if we have content
    if (responseData.content) {
      try {
        const query = `
          INSERT INTO summaries (user_email, title, summary, pdf_path, file_name, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
          RETURNING id
        `;
        
        const values = [
          req.user.email,
          responseData.title,
          responseData.content,
          responseData.pdfPath,
          filename // Use the original filename
        ];
        
        const dbResult = await db.query(query, values);
        console.log(`Summary saved to database with ID: ${dbResult.rows[0].id}`);
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Continue with the response even if database save fails
      }
    }

    // Clean up the uploaded file
    try {
      fs.unlinkSync(req.file.path);
      console.log('Cleaned up uploaded file');
    } catch (cleanupError) {
      console.error('Error cleaning up file:', cleanupError);
    }

    res.json(responseData);
  } catch (error) {
    console.error('Error processing audio:', error);
    res.status(500).json({ error: error.message });
  }
});

// Process audio sent as base64
app.post('/api/process-audio-base64', async (req, res) => {
  try {
    console.log('Received base64 audio request');
    
    if (!req.body.audioData) {
      return res.status(400).json({ 
        success: false, 
        message: 'No audio data provided' 
      });
    }
    
    const base64Data = req.body.audioData.split(';base64,').pop();
    const fileExt = req.body.filename.split('.').pop();
    const uploadDir = path.join(__dirname, 'uploads');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Generate file path
    const filePath = path.join(uploadDir, req.body.filename || `recording_${Date.now()}.${fileExt}`);
    
    // Write file to disk
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    console.log(`Saved base64 audio to: ${filePath}`);
    
    // Set up file object similar to what multer would provide
    const file = {
      path: filePath,
      originalname: req.body.filename || `recording_${Date.now()}.${fileExt}`
    };
    
    // Extract filename without extension for use as title
    const originalFilename = file.originalname;
    const filenameWithoutExt = originalFilename.replace(/\.[^/.]+$/, "");
    const title = filenameWithoutExt || `Summary ${new Date().toLocaleDateString()}`;
    
    console.log(`Using title from filename: ${title}`);
    
    // Parse summary options from request
    let options = {};
    let outputType = 'summary';
    
    try {
      if (req.body.options) {
        options = typeof req.body.options === 'string' ? JSON.parse(req.body.options) : req.body.options;
        console.log('Received summary options:', options);
      }
      
      if (req.body.outputType) {
        outputType = req.body.outputType;
        console.log('Output type selected:', outputType);
      }
    } catch (err) {
      console.error('Error parsing options:', err);
    }
    
    // Import our new direct processor
    const { processAudio } = await import('./Transcribe_and_summarize/directAudioProcessor.js');
    
    // Process the audio with our new module
    console.log('Using new direct audio processor for base64 audio...');
    
    // Set onlyTranscribe option if needed
    if (outputType === 'transcript') {
      options.onlyTranscribe = true;
    }
    
    // Process the audio
    const result = await processAudio(filePath, options);
    
    if (!result.success) {
      console.error('Audio processing failed:', result.error);
      return res.status(500).json({
        success: false,
        message: `Failed to process audio: ${result.error}`
      });
    }
    
    // Extract transcript and summary
    const { transcript, summary } = result;
    
    // Create response data
    let responseData = { success: true };
    
    // Set up the summary object based on outputType
    if (outputType === 'transcript') {
      const pdfPath = `/generated-pdfs/transcription_${Date.now()}.pdf`;
      responseData.transcription = transcript;
      responseData.summary = {
        id: Date.now(),
        title: `${title} - תמלול`,
        content: transcript,
        pdf_path: pdfPath,
        created_at: new Date().toISOString()
      };
    } else {
      const pdfPath = `/generated-pdfs/summary_${Date.now()}.pdf`;
      responseData.transcription = transcript;
      responseData.summary = {
        content: summary,
        title: title,
        pdf_path: pdfPath,
        created_at: new Date().toISOString()
      };
    }
    
    // Get user email from token
    let userEmail = 'anonymous@example.com';
    
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
    
    // Save to database if possible
    try {
      const summaryContent = outputType === 'transcript' ? transcript : summary;
      const summaryTitle = outputType === 'transcript' ? `${title} - תמלול` : title;
      const summaryPdfPath = outputType === 'transcript' 
        ? `/generated-pdfs/transcription_${Date.now()}.pdf` 
        : `/generated-pdfs/summary_${Date.now()}.pdf`;
      
      const result = await db.query(
        'INSERT INTO summaries (user_email, summary, pdf_path, created_at, title, file_name) VALUES ($1, $2, $3, NOW(), $4, $5) RETURNING id',
        [userEmail, summaryContent, summaryPdfPath, summaryTitle, originalFilename]
      );
      
      const newSummaryId = result.rows[0].id;
      console.log(`Successfully saved ${outputType} to database with ID ${newSummaryId}`);
      
      // Update usage count
      try {
        const updateResult = await db.query(
          'UPDATE users SET usage_count = usage_count + 1 WHERE email = $1 RETURNING usage_count',
          [userEmail]
        );
        const newUsageCount = updateResult.rows[0]?.usage_count || 'unknown';
        console.log(`Incremented usage_count for user ${userEmail} to ${newUsageCount}`);
      } catch (updateErr) {
        console.error('Error updating usage count:', updateErr);
      }
      
      // Add the ID to the response
      responseData.summary.id = newSummaryId;
    } catch (dbError) {
      console.error('Error saving to database:', dbError);
      // Use in-memory storage as fallback
      const newSummaryId = inMemorySummaries.length > 0 
        ? Math.max(...inMemorySummaries.map(s => s.id)) + 1 
        : 1;
        
      const summaryContent = outputType === 'transcript' ? transcript : summary;
      const summaryTitle = outputType === 'transcript' ? `${title} - תמלול` : title;
      const summaryPdfPath = outputType === 'transcript' 
        ? `/generated-pdfs/transcription_${Date.now()}.pdf` 
        : `/generated-pdfs/summary_${Date.now()}.pdf`;
      
      inMemorySummaries.push({
        id: newSummaryId,
        title: summaryTitle,
        content: summaryContent,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        pdf_path: summaryPdfPath,
        file_name: originalFilename
      });
      
      console.log(`Added ${outputType} #${newSummaryId} to in-memory store as database fallback`);
      
      // Add the ID to the response
      responseData.summary.id = newSummaryId;
    }

    // Clean up the uploaded file
    fs.unlink(filePath, (err) => {
      if (err) console.error(`Error deleting file: ${err}`);
    });

    res.json(responseData);
  } catch (error) {
    console.error('Error processing base64 audio:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process audio. Please try again later.'
    });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password, credential } = req.body;
    
    // Handle regular login
    if (email && password) {
      // TODO: Add your actual authentication logic here
      // For development, check if the user exists in the database
      let userExists = false;
      let userId = 0;
      let firstName = '';
      let usageCount = 0;
      
      try {
        const userResult = await db.query('SELECT id, first_name, usage_count FROM users WHERE email = $1', [email]);
        userExists = userResult.rows.length > 0;
        
        if (userExists) {
          const user = userResult.rows[0];
          firstName = user.first_name || '';
          userId = user.id;
          usageCount = user.usage_count || 0;
          console.log(`User found: ${firstName} (${email}), usage count: ${usageCount}`);
        } else {
          console.log(`User not found in DB: ${email}`);
        }
      } catch (userErr) {
        console.log('Error checking user:', userErr);
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
      
      console.log(`Generated token for ${email}: ${mockToken.substring(0, 20)}...`);
      
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
    
    // Handle Google login
    if (credential) {
      // TODO: Add Google token verification logic here
      // For now, mock it with a fixed email
      const googleEmail = 'google_user@example.com';
      
      // Check if user exists in database
      let firstName = 'Google';
      let userId = 1;
      let usageCount = 0;
      
      try {
        const userResult = await db.query('SELECT id, first_name, usage_count FROM users WHERE email = $1', [googleEmail]);
        if (userResult.rows.length > 0) {
          const user = userResult.rows[0];
          firstName = user.first_name || 'Google';
          userId = user.id;
          usageCount = user.usage_count || 0;
        }
      } catch (err) {
        console.error('Error checking Google user:', err);
      }
      
      // Create a JWT-like token with the email in the payload
      const tokenPayload = {
        email: googleEmail,
        id: userId,
        first_name: firstName,
        usage_count: usageCount,
        iat: Math.floor(Date.now() / 1000)
      };
      
      // Base64 encode the payload (simple mock of JWT)
      const base64Payload = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');
      const mockToken = `google.${base64Payload}.signature`;
      
      return res.json({
        success: true,
        token: mockToken,
        user: {
          id: userId,
          email: googleEmail,
          first_name: firstName,
          usage_count: usageCount
        }
      });
    }

    return res.status(400).json({ 
      success: false, 
      message: 'Invalid request. Please provide email and password or Google credential.' 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process login'
    });
  }
});

// Google login endpoint
app.post('/api/google-login', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ 
        success: false, 
        message: 'No credential provided' 
      });
    }

    // TODO: Add Google token verification logic here
    // For now, mock it with a fixed email
    const googleEmail = 'google_user@example.com';
    
    // Check if user exists in database
    let firstName = 'Google';
    let userId = 1;
    let usageCount = 0;
    
    try {
      const userResult = await db.query('SELECT id, first_name, usage_count FROM users WHERE email = $1', [googleEmail]);
      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        firstName = user.first_name || 'Google';
        userId = user.id;
        usageCount = user.usage_count || 0;
      }
    } catch (err) {
      console.error('Error checking Google user:', err);
    }
    
    // Create a JWT-like token with the email in the payload
    const tokenPayload = {
      email: googleEmail,
      id: userId,
      first_name: firstName,
      usage_count: usageCount,
      iat: Math.floor(Date.now() / 1000)
    };
    
    // Base64 encode the payload (simple mock of JWT)
    const base64Payload = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');
    const mockToken = `google.${base64Payload}.signature`;
    
    return res.json({
      success: true,
      token: mockToken,
      user: {
        id: userId,
        email: googleEmail,
        first_name: firstName,
        usage_count: usageCount
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process Google login'
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
        // If it's a properly formatted token (our mock JWT format)
        if (token.split('.').length === 3) {
          const payload = token.split('.')[1];
          const decoded = Buffer.from(payload, 'base64').toString();
          console.log('Decoded token for /usage-status:', decoded);
          
          const tokenData = JSON.parse(decoded);
          if (tokenData && tokenData.email) {
            userEmail = tokenData.email;
            console.log('Fetching usage for user:', userEmail);
          }
        } else {
          console.log('Token is not in expected format:', token.substring(0, 20) + '...');
        }
      } catch (err) {
        console.log('Error parsing token:', err.message);
      }
    }
    
    if (!userEmail) {
      console.log('No user email found, returning mock usage data');
      // Return mock data for users not identified
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
      // Query for user's usage count
      const result = await db.query(
        'SELECT usage_count FROM users WHERE email = $1',
        [userEmail]
      );
      
      if (result && result.rows && result.rows.length > 0) {
        usageCount = parseInt(result.rows[0].usage_count) || 0;
      }
      
      console.log(`User ${userEmail} has usage count: ${usageCount}`);
    } catch (err) {
      console.error('Error getting usage count:', err);
      // Continue with default value
    }
    
    // Hard-coded limit of 10 as specified
    const limit = 10;
    const isLimitReached = usageCount >= limit;
    
    // Create response with real usage data
    const usageData = {
      success: true,
      usageData: {
        currentMonthUsage: usageCount,
        limit: limit,
        isLimitReached: isLimitReached,
        subscriptionStatus: 'active', // Could be retrieved from a users table
        nextResetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
      }
    };
    
    res.json(usageData);
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
        // If it's a properly formatted token (our mock JWT format)
        if (token.split('.').length === 3) {
          const payload = token.split('.')[1];
          const decoded = Buffer.from(payload, 'base64').toString();
          console.log('Decoded token for /summaries:', decoded);
          
          const tokenData = JSON.parse(decoded);
          if (tokenData && tokenData.email) {
            userEmail = tokenData.email;
            console.log('Fetching summaries for user:', userEmail);
          }
        } else {
          console.log('Token is not in expected format:', token.substring(0, 20) + '...');
        }
      } catch (err) {
        console.log('Error parsing token:', err.message);
      }
    }
    
    let result;
    // If we have a user email, filter by it
    if (userEmail) {
      result = await db.query(
        'SELECT id, user_email, summary, pdf_path, created_at, title, file_name FROM summaries WHERE user_email = $1 ORDER BY created_at DESC',
        [userEmail]
      );
    } else {
      // Otherwise get all summaries (for development)
      result = await db.query(
        'SELECT id, user_email, summary, pdf_path, created_at, title, file_name FROM summaries ORDER BY created_at DESC',
        []
      );
    }
    
    console.log(`Retrieved ${result.rows.length} summaries from database for user ${userEmail || 'all users'}`);
    
    // Map database columns to expected response format
    const summaries = result.rows.map(row => ({
      id: row.id,
      title: row.title || 'Untitled',
      content: row.summary, // Map 'summary' field to 'content' for client
      summary: row.summary, // Also include as 'summary' for flexibility
      pdf_path: row.pdf_path, // Map 'pdf_path' directly
      created_at: row.created_at,
      file_name: row.file_name,
      user_email: row.user_email // Include the user email for debugging
    }));
    
    res.json({
      success: true,
      summaries: summaries
    });
  } catch (error) {
    console.error('Error fetching summaries from database:', error);
    
    // Fallback to in-memory summaries
    console.log('Falling back to in-memory summaries');
    const sortedSummaries = [...inMemorySummaries].sort((a, b) => {
      return new Date(b.created_at) - new Date(a.created_at);
    });
    
    res.json({
      success: true,
      summaries: sortedSummaries
    });
  }
});

// Get user first_name endpoint
app.get('/api/user-first-name', async (req, res) => {
  try {
    // Extract user email from token
    let userEmail = null;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      try {
        // If it's a properly formatted token (our mock JWT format)
        if (token.split('.').length === 3) {
          const payload = token.split('.')[1];
          const decoded = Buffer.from(payload, 'base64').toString();
          
          const tokenData = JSON.parse(decoded);
          if (tokenData && tokenData.email) {
            userEmail = tokenData.email;
            console.log('Getting first_name for user:', userEmail);
          }
        }
      } catch (err) {
        console.log('Error parsing token:', err.message);
      }
    }
    
    if (!userEmail) {
      return res.status(401).json({ success: false, message: 'No user email found in token' });
    }
    
    // Query database for user's first_name
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
    // Increment usage_count in users table
    try {
      const updateResult = await db.query(
        'UPDATE users SET usage_count = usage_count + 1 WHERE email = $1 RETURNING usage_count',
        [userEmail]
      );
      const newUsageCount = updateResult.rows[0]?.usage_count || 0;
      console.log(`Incremented usage_count for user ${userEmail} to ${newUsageCount}`);
      
      // Return the updated usage count
      return res.status(200).json({ success: true, usage_count: newUsageCount });
    } catch (updateErr) {
      console.error('Error updating usage count:', updateErr);
      return res.status(500).json({ success: false, error: 'Failed to update usage count' });
    }
  } catch (error) {
    console.error('Error in update-usage endpoint:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Direct audio processing endpoint - no Multer
app.post('/api/process-recording', async (req, res) => {
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
    const tempFilePath = path.join(tempDir, `recording_${timestamp}.${fileExt}`);
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
        // Import the direct audio processor
        const { processAudio } = await import('./Transcribe_and_summarize/directAudioProcessor.js');
        
        // Process with options for direct summarization
        console.log('Starting direct audio processing...');
        result = await processAudio(tempFilePath, {
          onlyTranscribe: false, // We want a summary
          skipTranscription: false,
          skipSummarization: false
        });
        console.log('Audio processing completed successfully');
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to process audio');
        }
        
        // Clean up the temp file
        try {
          fs.unlinkSync(tempFilePath);
          console.log('Cleaned up temp file');
        } catch (cleanupError) {
          console.error('Error cleaning up temp file:', cleanupError);
        }
        
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
            file_name: fileName
          },
          transcription: result.transcript
        });
        
      } catch (procError) {
        console.error('Error processing audio:', procError);
        
        try {
          // Clean up the temp file in case of error
          fs.unlinkSync(tempFilePath);
        } catch (cleanupError) {
          console.error('Failed to delete temp file:', cleanupError);
        }
        
        return res.status(500).json({
          success: false,
          error: `Error processing audio: ${procError.message}`
        });
      }
    } catch (error) {
      console.error('Error handling audio file:', error);
      res.status(500).json({
        success: false,
        error: 'Error processing audio file'
      });
    }
  } catch (error) {
    console.error('Error in direct audio processing:', error);
    res.status(500).json({
      success: false,
      error: 'Server error processing audio'
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});