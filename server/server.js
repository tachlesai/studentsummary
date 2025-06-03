import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { processAudio, cleanupAllFiles, transcribeWithGemini } from './Transcribe_and_summarize/directAudioProcessor.js';
import db from './db.js';
import bcrypt from 'bcryptjs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import jwt from 'jsonwebtoken';

const app = express();
const port = process.env.PORT || 5001;
console.log(`Using port: ${port}`);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow any localhost origin, render.com domains, railway.app domains, or no origin (like Postman)
    if (!origin || 
        origin.startsWith('http://localhost:') || 
        origin.includes('tachlesai.com') || 
        origin.includes('.render.com') || 
        origin.includes('tachlesai.onrender.com') ||
        origin.includes('.railway.app')) {
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

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Serve static files from the frontend build directory
const frontendPath = path.join(__dirname, '../Student_summary/dist');
console.log(`Serving static files from: ${frontendPath}`);
app.use(express.static(frontendPath));

// Middleware to fix double /api prefix issue
app.use((req, res, next) => {
  if (req.path.startsWith('/api/api/')) {
    console.log(`Fixing double /api prefix: ${req.path}`);
    req.url = req.url.replace('/api/api/', '/api/');
    console.log(`Fixed path: ${req.url}`);
  }
  next();
});

// Middleware to check authentication
const authMiddleware = (req, res, next) => {
  console.log('⚙️ Auth middleware check');
  
  // Get token from header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ No token or invalid format');
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Try to verify as JWT token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.user = decoded;
      console.log('✅ JWT auth successful for:', decoded.email);
      return next();
    } catch (jwtError) {
      console.log('ℹ️ JWT verification failed, trying base64 format');
      
      // If JWT verification fails, try to decode as base64 for development testing
      try {
        const base64Decoded = Buffer.from(token, 'base64').toString('utf-8');
        
        // Validate that the decoded string is valid JSON before parsing
        if (!base64Decoded || base64Decoded.trim() === '' || 
            !base64Decoded.startsWith('{') && !base64Decoded.startsWith('[')) {
          throw new Error('Invalid base64 format: decoded content is not valid JSON');
        }
        
        const userData = JSON.parse(base64Decoded);
        
        if (userData && userData.user && userData.user.email) {
          // For development only - accept simple base64 tokens
          req.user = userData.user;
          console.log('✅ Base64 auth accepted for dev testing:', userData.user.email);
          return next();
        } else {
          throw new Error('Invalid token structure: missing user.email');
        }
      } catch (base64Error) {
        console.log('❌ Base64 decoding/parsing failed:', base64Error.message);
        throw new Error(`Base64 token invalid: ${base64Error.message}`);
      }
    }
  } catch (err) {
    console.error('❌ Auth error:', err);
    return res.status(401).json({ success: false, message: 'Authentication error' });
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

// Helper function to generate flashcards with Gemini
async function generateFlashcardsWithGemini(content, title) {
  try {
    console.log(`============================`);
    console.log(`🎮 Starting flashcard generation for: "${title}"`);
    console.log(`📝 Content length: ${content.length} characters`);
    
    // Get Gemini API key
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      console.error('❌ No Gemini API key available - check your .env file');
      return null;
    }
    
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    
    // Use Gemini 2.0 Flash for faster flashcard generation
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    console.log(`🤖 Using model: gemini-2.0-flash`);
    
    // Prepare prompt for flashcard generation
    const prompt = `
    You are an educational flashcard creator. Create high-quality flashcards from the following text.
    Language: Hebrew (Right-to-left)
    
    Generate 10-15 flashcards with challenging questions and comprehensive answers.
    For each flashcard:
    1. Create a clear, concise question that tests understanding (not just recall)
    2. Provide a complete answer that explains the concept fully
    3. For quiz games, provide 3 plausible incorrect answers related to the content
    
    Return ONLY valid JSON in the following format:
    [
      {
        "question": "Question text here?",
        "answer": "Answer text here.",
        "incorrectAnswers": [
          "Plausible wrong answer 1",
          "Plausible wrong answer 2",
          "Plausible wrong answer 3"
        ]
      },
      ...
    ]
    
    IMPORTANT: For the incorrectAnswers, make sure they are:
    - Related to the topic and plausible (not obviously wrong)
    - Different enough from the correct answer to be clearly incorrect
    - Roughly the same length as the correct answer
    - Actually incorrect (not partially correct)
    
    Text to convert into flashcards:
    ${content}
    `;
    
    console.log(`⏱️ Sending request to Gemini at ${new Date().toISOString()}`);
    const startTime = Date.now();
    
    // Send to Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const endTime = Date.now();
    const processingTime = (endTime - startTime) / 1000;
    console.log(`✅ Received response from Gemini in ${processingTime.toFixed(2)} seconds`);
    
    // Extract JSON from text (in case there's other text included)
    let flashcards;
    try {
      // Find JSON array in the response
      const jsonMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (jsonMatch) {
        flashcards = JSON.parse(jsonMatch[0]);
      } else {
        flashcards = JSON.parse(text);
      }
      
      if (!Array.isArray(flashcards)) {
        throw new Error('Response is not a valid array');
      }
      
      console.log(`🃏 Successfully generated ${flashcards.length} flashcards`);
      console.log(`============================`);
      
      return flashcards;
    } catch (parseError) {
      console.error(`❌ Error parsing flashcards JSON: ${parseError.message}`);
      console.error(`❌ Raw response: ${text.substring(0, 200)}...`);
      console.log(`============================`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error generating flashcards with Gemini: ${error.message}`);
    console.log(`============================`);
    return null;
  }
}

// Helper function to save flashcards to DB
async function saveFlashcardsToDatabase(flashcards, summaryId, title, userEmail) {
  try {
    console.log(`============================`);
    console.log(`💾 Starting database save for flashcards from summary ID: ${summaryId}`);
    console.log(`👤 User: ${userEmail}`);
    console.log(`📚 Set title: "${title}"`);
    
    if (!flashcards || !Array.isArray(flashcards) || flashcards.length === 0) {
      console.error('❌ No valid flashcards to save');
      console.log(`============================`);
      return false;
    }
    
    // First check if flashcard_sets table exists, create it if not
    await db.query(`
      CREATE TABLE IF NOT EXISTS flashcard_sets (
        id SERIAL PRIMARY KEY,
        user_email TEXT NOT NULL,
        summary_id INTEGER REFERENCES summaries(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log(`✅ Verified flashcard_sets table exists`);
    
    // Then check if flashcards table exists, create it if not
    await db.query(`
      CREATE TABLE IF NOT EXISTS flashcards (
        id SERIAL PRIMARY KEY,
        set_id INTEGER REFERENCES flashcard_sets(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        incorrect_answers TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log(`✅ Verified flashcards table exists`);
    
    // Check if a set already exists for this summary
    const existingSetResult = await db.query(
      `SELECT id FROM flashcard_sets WHERE summary_id = $1 AND user_email = $2`,
      [summaryId, userEmail]
    );
    
    let setId;
    
    if (existingSetResult.rows.length > 0) {
      setId = existingSetResult.rows[0].id;
      console.log(`🔄 Found existing flashcard set (ID: ${setId}), updating...`);
      
      // Delete existing flashcards for this set
      await db.query(`DELETE FROM flashcards WHERE set_id = $1`, [setId]);
      console.log(`🗑️ Deleted existing flashcards for set ${setId}`);
      
      // Update the set's title and timestamp
      await db.query(
        `UPDATE flashcard_sets SET title = $1, created_at = NOW() WHERE id = $2`,
        [title || 'Flashcards from Summary', setId]
      );
    } else {
      // Insert new flashcard set
      const setResult = await db.query(
        `INSERT INTO flashcard_sets (user_email, summary_id, title, created_at) 
        VALUES ($1, $2, $3, NOW()) 
        RETURNING id`,
        [userEmail, summaryId, title || 'Flashcards from Summary']
      );
      
      setId = setResult.rows[0].id;
      console.log(`✅ Created new flashcard set with ID: ${setId}`);
    }
    
    // Insert flashcards
    for (const card of flashcards) {
      await db.query(
        `INSERT INTO flashcards (set_id, question, answer, incorrect_answers) 
         VALUES ($1, $2, $3, $4)`,
        [setId, card.question, card.answer, 
         card.incorrectAnswers && Array.isArray(card.incorrectAnswers) 
           ? JSON.stringify(card.incorrectAnswers) 
           : null
        ]
      );
    }
    
    console.log(`✅ Successfully saved ${flashcards.length} flashcards for set ${setId}`);
    console.log(`============================`);
    return true;
  } catch (error) {
    console.error(`❌ Error saving flashcards to database: ${error.message}`);
    console.log(`============================`);
    return false;
  }
}

// Helper function to extract user email from token
const getUserEmailFromToken = (token) => {
  console.log('Extracting user email from token');
  if (!token) {
    console.log('No token provided');
    return null;
  }
  
  try {
    console.log('Token format:', token.split('.').length === 3 ? 'JWT format' : 'Non-JWT format');
    
    // Try JWT format
    if (token.split('.').length === 3) {
      const payload = token.split('.')[1];
      const decoded = Buffer.from(payload, 'base64').toString();
      const tokenData = JSON.parse(decoded);
      console.log('JWT payload:', tokenData);
      
      if (tokenData && tokenData.email) {
        console.log('Found email in JWT:', tokenData.email);
        return tokenData.email;
      }
    }
    
    // Try direct base64 format
    try {
      const directDecoded = Buffer.from(token, 'base64').toString();
      const directData = JSON.parse(directDecoded);
      console.log('Direct decode payload:', directData);
      
      if (directData && directData.email) {
        console.log('Found email in direct decode:', directData.email);
        return directData.email;
      }
      
      if (directData && directData.user && directData.user.email) {
        console.log('Found email in user object:', directData.user.email);
        return directData.user.email;
      }
    } catch (e) {
      console.log('Direct decode failed:', e.message);
    }
    
    console.log('Failed to extract email from token');
    return null;
  } catch (err) {
    console.log('Error parsing token:', err.message);
    return null;
  }
};

// Process audio endpoint - for file uploads
app.post('/api/process-audio', authMiddleware, flexibleUpload, async (req, res) => {
  try {
    console.log(`Processing audio file: ${req.file.path}`);
    
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
    
    // Check if we need to only transcribe
    const onlyTranscribe = parsedOptions.outputType === 'transcript';
    const skipSummarization = parsedOptions.outputType === 'transcript';
    
    console.log(`Processing with options: onlyTranscribe=${onlyTranscribe}, skipSummarization=${skipSummarization}`);
    
    // Get processing options from request
    const options = {
      onlyTranscribe: onlyTranscribe,
      skipTranscription: false,
      skipSummarization: skipSummarization,
      style: parsedOptions.style || 'detailed', // Include the summary style
      language: parsedOptions.language || 'he'
    };
    
    console.log('Processing options:', options);

    // Process the audio file
    let result;
    let transcript = '';
    
    if (onlyTranscribe) {
      // If we need only transcription, use transcribeWithGemini
      transcript = await transcribeWithGemini(req.file.path);
      result = {
        summary: transcript,  // Use transcript as summary for consistency
        transcript: transcript,
        style: options.style,
        language: options.language
      };
    } else {
      // Otherwise use the standard processAudio function
      result = await processAudio(req.file.path, options);
    }
    
    // Prepare response data based on output type
    const responseData = {
      title: title,
      content: result.summary, // The summary is directly in result.summary
      pdfPath: null, // PDF generation will be handled separately if needed
      style: result.style, // Style is directly in result.style
      transcription: result.transcript || result.summary // If transcript is available, use it; otherwise use summary
    };

    // Save summary to database if we have content
    let summaryId = null;
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
        summaryId = dbResult.rows[0].id;
        console.log(`Summary saved to database with ID: ${summaryId}`);
        
        // Generate and save flashcards if summary was created
        if (summaryId && !onlyTranscribe) {
          console.log('Generating flashcards for summary...');
          const flashcards = await generateFlashcardsWithGemini(responseData.content, responseData.title);
          if (flashcards && flashcards.length > 0) {
            await saveFlashcardsToDatabase(flashcards, summaryId, responseData.title, req.user.email);
            console.log(`Successfully generated and saved ${flashcards.length} flashcards`);
          }
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Continue with the response even if database save fails
      }
    }

    // Use the comprehensive cleanup function to clean up the uploaded file
    // This will also clean up any temporary files older than 1 hour
    await cleanupAllFiles([req.file.path], { cleanDebugFiles: true });

    res.json(responseData);
  } catch (error) {
    console.error('Error processing audio:', error);
    
    // Still try to clean up even if there was an error
    if (req.file && req.file.path) {
      await cleanupAllFiles([req.file.path], { cleanDebugFiles: true });
    }
    
    res.status(500).json({ error: error.message });
  }
});

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
        parsedOptions = typeof req.body.options === 'string' ? JSON.parse(req.body.options) : req.body.options;
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
        // Check if we need to only transcribe
        const onlyTranscribe = parsedOptions.outputType === 'transcript';
        const skipSummarization = parsedOptions.outputType === 'transcript';
        
        console.log(`Processing with options: onlyTranscribe=${onlyTranscribe}, skipSummarization=${skipSummarization}`);
        
        // Process with options for direct summarization or transcription
        console.log('Starting direct audio processing...');
        
        // If we need only transcription, use transcribeWithGemini
        let transcript = '';
        if (onlyTranscribe) {
          transcript = await transcribeWithGemini(tempFilePath);
          result = {
            summary: transcript,  // Use transcript as summary for consistency
            transcript: transcript,
            style: parsedOptions.style || 'detailed',
            language: parsedOptions.language || 'he'
          };
        } else {
          // Otherwise use the standard processAudio function
          result = await processAudio(tempFilePath, {
            onlyTranscribe: onlyTranscribe,
            skipTranscription: false,
            skipSummarization: skipSummarization,
            style: parsedOptions.style || 'detailed', // Include the summary style
            language: parsedOptions.language || 'he'
          });
        }
        
        console.log('Audio processing completed successfully');
        
        // Clean up the temp file and any other temporary files
        await cleanupAllFiles([tempFilePath], { cleanDebugFiles: true });
        
        // Save to database if we have content
        let summaryId = null;
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
            summaryId = dbResult.rows[0].id;
            console.log(`Summary saved to database with ID: ${summaryId}`);
            
            // Generate and save flashcards if summary was created
            if (summaryId && !onlyTranscribe) {
              console.log('Generating flashcards for summary...');
              const flashcards = await generateFlashcardsWithGemini(result.summary, 'Audio Recording');
              if (flashcards && flashcards.length > 0) {
                await saveFlashcardsToDatabase(flashcards, summaryId, 'Audio Recording', userEmail);
                console.log(`Successfully generated and saved ${flashcards.length} flashcards`);
              }
            }
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
          transcription: result.transcript || result.summary // If transcript is available, use it; otherwise use summary
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

// Flashcard sets endpoint
app.get('/api/flashcard-sets', async (req, res) => {
  try {
    console.log('🔍 Getting flashcard sets');
    
    // Extract user email from token
    const token = req.headers.authorization?.split(' ')[1];
    const userEmail = getUserEmailFromToken(token);
    
    if (!userEmail) {
      console.log('❌ No user email found in token');
      return res.status(401).json({ 
        success: false, 
        message: 'User authentication required' 
      });
    }
    
    console.log(`🔍 Getting flashcard sets for user: ${userEmail}`);
    
    // Get flashcard sets for this user
    const result = await db.query(
      'SELECT * FROM flashcard_sets WHERE user_email = $1 ORDER BY created_at DESC',
      [userEmail]
    );
    
    console.log(`✅ Found ${result.rows.length} flashcard sets for ${userEmail}`);
    if (result.rows.length > 0) {
      console.log('First set:', result.rows[0]);
    }
    
    return res.json({
      success: true,
      flashcardSets: result.rows
    });
  } catch (error) {
    console.error('Error fetching flashcard sets:', error);
    return res.status(500).json({ success: false, message: 'Error fetching flashcard sets' });
  }
});

// Get flashcards by summary ID
app.get('/api/flashcards/by-summary/:summaryId', async (req, res) => {
  try {
    const { summaryId } = req.params;
    console.log(`🔍 Getting flashcards for summary ${summaryId}`);
    
    // Extract user email from token
    const token = req.headers.authorization?.split(' ')[1];
    const userEmail = getUserEmailFromToken(token);
    
    if (!userEmail) {
      console.log('❌ No user email found in token');
      return res.status(401).json({ 
        success: false, 
        message: 'User authentication required' 
      });
    }
    
    console.log(`🔍 Getting flashcards for summary ${summaryId} and user ${userEmail}`);
    
    // Find flashcard set for this summary
    const setResult = await db.query(
      'SELECT * FROM flashcard_sets WHERE summary_id = $1 AND user_email = $2',
      [summaryId, userEmail]
    );
    
    // If no set exists, return 404
    if (setResult.rows.length === 0) {
      console.log(`❌ No flashcard set found for summary ${summaryId} and user ${userEmail}`);
      return res.status(404).json({ 
        success: false, 
        message: 'No flashcard set found for this summary' 
      });
    }
    
    console.log(`✅ Found flashcard set ${setResult.rows[0].id} for summary ${summaryId}`);
    
    // If we have a set, get the flashcards
    const setId = setResult.rows[0].id;
    const cardsResult = await db.query(
      'SELECT id, question, answer, incorrect_answers FROM flashcards WHERE set_id = $1 ORDER BY id',
      [setId]
    );
    
    console.log(`✅ Found ${cardsResult.rows.length} flashcards for set ${setId}`);
    if (cardsResult.rows.length > 0) {
      console.log('Sample card:', {
        question: cardsResult.rows[0].question,
        answer: cardsResult.rows[0].answer,
        hasIncorrectAnswers: cardsResult.rows[0].incorrect_answers ? 'Yes' : 'No'
      });
    }
    
    return res.json({
      success: true,
      flashcardSet: {
        id: setResult.rows[0].id,
        title: setResult.rows[0].title,
        created_at: setResult.rows[0].created_at,
        flashcards: cardsResult.rows.map(card => ({
          id: card.id,
          question: card.question,
          answer: card.answer,
          incorrectAnswers: card.incorrect_answers ? JSON.parse(card.incorrect_answers) : null
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching flashcards by summary:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error fetching flashcards by summary' 
    });
  }
});

// Endpoint for generating flashcards with Gemini (kept for backward compatibility)
app.post('/api/generate-flashcards', async (req, res) => {
  try {
    const { content, title } = req.body;
    
    if (!content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Content is required for flashcard generation' 
      });
    }
    
    const flashcards = await generateFlashcardsWithGemini(content, title);
    
    if (!flashcards) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to generate flashcards'
      });
    }
    
    // Success - return the flashcards
    return res.json({
      success: true,
      flashcards: flashcards
    });
    
  } catch (error) {
    console.error('Error generating flashcards with Gemini:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to generate flashcards', 
      error: error.message 
    });
  }
});

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
app.post('/api/update-usage', authMiddleware, async (req, res) => {
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

// Get all flashcards for games (filtered by user token)
app.get('/api/all-flashcards', async (req, res) => {
  try {
    console.log('GET /api/all-flashcards - Fetching flashcards for games');
    
    // Extract user email from token
    let userEmail = null;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (token) {
      userEmail = getUserEmailFromToken(token);
      console.log('User email from token:', userEmail);
    } else {
      console.log('No authorization token provided');
    }
    
    // If no user email found, return empty array
    if (!userEmail) {
      console.log('No valid user email found, returning empty array');
      return res.json([]);
    }
    
    // Get all sets and their flashcards for this user
    const query = `
      SELECT 
        f.id, 
        f.question, 
        f.answer, 
        f.incorrect_answers as wrong_answers,
        fs.id as set_id, 
        fs.title as set_title
      FROM 
        flashcards f
      JOIN 
        flashcard_sets fs ON f.set_id = fs.id
      WHERE
        fs.user_email = $1
      ORDER BY 
        fs.id, f.id
    `;
    
    const result = await db.query(query, [userEmail]);
    console.log(`Found ${result.rows.length} flashcards for user ${userEmail}`);
    
    // Return all flashcards for this user
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching flashcards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Catch-all route to serve the frontend for client-side routing
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Serve the index.html for all other routes
  const indexPath = path.join(__dirname, '../Student_summary/dist/index.html');
  console.log(`Serving index.html for path: ${req.path}`);
  
  // Check if the file exists before sending it
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error(`Error: index.html not found at ${indexPath}`);
    res.status(404).send('Frontend build not found. Please build the frontend first.');
  }
});

// Start the server
const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// Function to clean up old temporary files
async function cleanupOldTempFiles() {
  console.log('Running scheduled cleanup of temporary files...');
  
  const tempDir = path.join(__dirname, 'temp');
  const uploadsDir = path.join(__dirname, 'uploads');
  const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
  const now = Date.now();
  
  // Define audio extensions to clean up
  const audioExtensions = ['.mp3', '.mp4', '.wav', '.m4a', '.webm', '.aac', '.ogg'];
  
  // Clean up temp directory
  try {
    if (fs.existsSync(tempDir)) {
      const tempFiles = fs.readdirSync(tempDir)
        .map(file => path.join(tempDir, file))
        .filter(file => {
          try {
            const stats = fs.statSync(file);
            // Delete audio files regardless of age
            const ext = path.extname(file).toLowerCase();
            if (audioExtensions.includes(ext) || file.includes('compressed_')) {
              return true;
            }
            // Delete other temp files if they're older than MAX_AGE
            return now - stats.mtimeMs > MAX_AGE;
          } catch (err) {
            return false;
          }
        });
      
      console.log(`Found ${tempFiles.length} files to clean up in temp directory`);
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
            // Delete audio files regardless of age
            const ext = path.extname(file).toLowerCase();
            if (audioExtensions.includes(ext) || file.includes('compressed_')) {
              return true;
            }
            // Delete other upload files if they're older than MAX_AGE
            return now - stats.mtimeMs > MAX_AGE;
          } catch (err) {
            return false;
          }
        });
      
      console.log(`Found ${uploadFiles.length} files to clean up in uploads directory`);
      await cleanupAllFiles(uploadFiles);
    }
  } catch (error) {
    console.error('Error cleaning uploads directory:', error);
  }
}

// Schedule cleanup job to run every hour - this will clean up any temporary files
// that may have been left behind
const cleanupJob = setInterval(cleanupOldTempFiles, 60 * 60 * 1000); // 1 hour

// Payment success handler endpoint
app.get('/api/payment-success', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email parameter is required'
      });
    }
    
    console.log(`Processing payment success for email: ${email}`);
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    // Update user subscription status in database
    const updateQuery = `
      UPDATE users 
      SET subscription_status = 'premium', 
          subscription_start_date = NOW(),
          subscription_end_date = NOW() + INTERVAL '30 days'
      WHERE email = $1
      RETURNING user_id, email, first_name
    `;
    
    const result = await db.query(updateQuery, [email]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const user = result.rows[0];
    console.log(`Updated subscription for user: ${user.email} (${user.first_name || 'Unknown'})`);
    
    // Redirect to a success page
    res.redirect('/payment-confirmation?status=success');
    
  } catch (error) {
    console.error('Payment success handling error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment success'
    });
  }
});