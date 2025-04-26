import { createClient } from '@deepgram/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

// Promisify exec
const execAsync = promisify(exec);

// Load environment variables from correct path, ensuring it works in all contexts
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');
console.log(`Looking for .env file at: ${envPath}`);
dotenv.config({ path: envPath });
console.log('Environment variables loaded from:', envPath);

// Log the API key (first few characters) to verify it's loaded
const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
console.log(`Deepgram API key (first 5 chars): ${deepgramApiKey?.substring(0, 5) || 'NOT FOUND'}...`);
console.log(`Using Deepgram API key: ${deepgramApiKey?.substring(0, 5) || 'NOT FOUND'}...`);

// Create the Deepgram client with the correct initialization
const deepgram = deepgramApiKey ? createClient(deepgramApiKey) : null;

// Check if client was created
if (!deepgram) {
  console.error('Failed to create Deepgram client - API key missing or invalid');
} else {
  console.log('Deepgram client created successfully');
}

// Configure Gemini with the API key from .env
const geminiApiKey = process.env.GEMINI_API_KEY;
console.log(`Gemini API key (first 5 chars): ${geminiApiKey?.substring(0, 5) || 'NOT FOUND'}...`);
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

/**
 * Convert audio file to a format Deepgram can handle
 * @param {string} filePath - Path to the audio file
 * @returns {Promise<string>} - Path to the converted file
 */
async function convertAudioFile(filePath) {
  try {
    // Create output path with wav extension
    const outputPath = filePath.replace(/\.[^/.]+$/, '') + '_converted.wav';
    
    console.log(`Converting audio file from ${filePath} to ${outputPath}`);
    
    // Use ffmpeg with very basic parameters to create a clean WAV file
    await execAsync(`ffmpeg -y -i "${filePath}" -acodec pcm_s16le -ac 1 -ar 16000 "${outputPath}"`);
    
    console.log(`Converted audio file to: ${outputPath}`);
    
    // Verify the file exists and has content
    if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
      throw new Error(`Conversion failed: Output file ${outputPath} does not exist or is empty`);
    }
    
    return outputPath;
  } catch (error) {
    console.error("Error converting audio file:", error);
    throw error;
  }
}

/**
 * Clean up a file
 * @param {string} filePath - Path to the file to clean up
 */
async function cleanupFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Cleaned up file: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error cleaning up file ${filePath}:`, error);
  }
}

/**
 * Upload file to a temporary storage service
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} - URL to the uploaded file
 */
async function uploadFileToTemporaryStorage(filePath) {
  try {
    // For this example, we'll use a mock implementation
    // In a real application, you would upload to a service like AWS S3, Google Cloud Storage, etc.
    console.log(`Would upload ${filePath} to temporary storage`);
    
    // Return a mock URL
    return `https://example.com/temp/${path.basename(filePath)}`;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

/**
 * Transcribe audio file using Deepgram
 * @param {string} filePath - Path to audio file
 * @returns {Promise<string>} - Transcription text
 */
export async function transcribeAudio(filePath) {
  try {
    console.log(`Transcribing audio file: ${filePath}`);
    
    if (!deepgramApiKey) {
      console.error('No Deepgram API key available - check your .env file');
      return "Error: Deepgram API key not found. Please check server configuration.";
    }
    
    if (!deepgram) {
      console.error('Deepgram client not initialized');
      return "Error: Deepgram client not initialized. Please check server configuration.";
    }
    
    // Convert the audio file to a format Deepgram can better process
    let fileToTranscribe;
    try {
      fileToTranscribe = await convertAudioFile(filePath);
      console.log(`Using converted file for transcription: ${fileToTranscribe}`);
    } catch (conversionError) {
      console.error('Error converting audio file:', conversionError);
      console.log('Falling back to original file');
      fileToTranscribe = filePath;
    }
    
    // Read the audio file
    const audioFile = fs.readFileSync(fileToTranscribe);
    console.log(`File size for transcription: ${audioFile.length} bytes`);
    
    // Configure Deepgram options for Whisper with Hebrew
    const options = {
      smart_format: true,
      model: "whisper-large",
      language: 'he'
    };
    
    console.log(`Sending request to Deepgram with options:`, options);
    
    // Send to Deepgram for transcription
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      audioFile,
      options
    );
    
    // Check for errors
    if (error) {
      console.error('Deepgram error:', error);
      return "Error transcribing audio. Please try again.";
    }
    
    // Extract transcript
    const transcript = result.results.channels[0].alternatives[0].transcript;
    console.log(`Transcription complete, length: ${transcript.length}, words: ${transcript.split(' ').length}`);
    
    // Clean up converted file if it was created
    if (fileToTranscribe !== filePath) {
      await cleanupFile(fileToTranscribe);
    }
    
    return transcript;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return "Error during transcription process: " + error.message;
  }
}

// Function to summarize text
export async function summarizeText(text, customPrompt = null) {
  try {
    console.log(`Summarizing text of length: ${text.length}`);
    
    if (!geminiApiKey) {
      console.error('No Gemini API key available - check your .env file');
      return "Error: Gemini API key not found. Please check server configuration.";
    }
    
    if (!genAI) {
      console.error('Gemini client not initialized');
      return "Error: Gemini client not initialized. Please check server configuration.";
    }
    
    // Use Gemini to summarize
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const prompt = customPrompt || `
    Please summarize the following Hebrew text in Hebrew. 
    Create a comprehensive summary that captures the main points and key details.
    
    Text to summarize:
    ${text}
    `;
    
    console.log(`Using prompt${customPrompt ? ' (custom)' : ''} to summarize`);
    
    const result = await model.generateContent(prompt);
    const summary = result.response.text();
    
    console.log(`Summary generated: ${summary.substring(0, 100)}...`);
    
    return summary;
  } catch (error) {
    console.error('Error summarizing text:', error);
    return "Error during summarization process: " + error.message;
  }
}

// Function to generate PDF
export async function generatePDF(content) {
  try {
    console.log('Generating PDF...');
    
    const tempDir = path.join(__dirname, '..', 'temp');
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const outputPath = path.join(tempDir, `summary_${Date.now()}.pdf`);
    
    // Launch browser
    const browser = await puppeteer.launch({
      executablePath: process.env.NODE_ENV === 'production' 
        ? '/usr/bin/google-chrome'  // Path to Chrome on Render
        : puppeteer.executablePath(), // Local path during development
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set content
    await page.setContent(`
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 40px;
              direction: rtl;
            }
            pre {
              white-space: pre-wrap;
              word-wrap: break-word;
            }
          </style>
        </head>
        <body>
          <pre>${content}</pre>
        </body>
      </html>
    `);
    
    // Generate PDF
    await page.pdf({
      path: outputPath,
      format: 'A4',
      margin: {
        top: '40px',
        right: '40px',
        bottom: '40px',
        left: '40px'
      }
    });
    
    await browser.close();
    
    console.log(`PDF generated at: ${outputPath}`);
    return outputPath;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
} 