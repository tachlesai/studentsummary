const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { processAndSummarize } = require('../transcribeAndSumm');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
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
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No audio file uploaded' });
    }

    const filePath = req.file.path;
    console.log(`Received audio file: ${filePath}`);

    // Process the audio file (transcribe and summarize)
    const summary = await processAndSummarize(filePath);
    
    // Get the transcription from the first step
    const transcription = fs.existsSync(path.join(__dirname, '../temp/transcription.txt')) 
      ? fs.readFileSync(path.join(__dirname, '../temp/transcription.txt'), 'utf8')
      : 'Transcription not available';

    // Clean up the uploaded file after processing
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

module.exports = router;