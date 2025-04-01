// Add this route to your server.js file

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { processAndSummarize } from './Transcribe_and_summarize/transcribeAndSummarize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    cb(null, `recording_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage: storage });

// API endpoint for audio transcription
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
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