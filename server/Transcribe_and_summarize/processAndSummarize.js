import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import { transcribeAudio } from './audioProcessing.js';
import { generatePDF } from './audioProcessing.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

/**
 * Check the audio file details using ffprobe
 * @param {string} filePath - Path to the audio file
 * @returns {Promise<object>} - Audio file details
 */
async function checkAudioFile(filePath) {
  try {
    console.log(`Checking audio file: ${filePath}`);
    const fileStats = fs.statSync(filePath);
    console.log(`File size: ${fileStats.size} bytes (${(fileStats.size / 1024 / 1024).toFixed(2)} MB)`);
    
    // Get file metadata with ffprobe
    try {
      const { stdout } = await execAsync(`ffprobe -v error -show_format -show_streams -print_format json "${filePath}"`);
      const metadata = JSON.parse(stdout);
      console.log('Audio file metadata:', JSON.stringify(metadata, null, 2));
      
      return {
        success: true,
        metadata,
        filePath,
        fileSize: fileStats.size
      };
    } catch (ffprobeError) {
      console.error('Error getting audio metadata:', ffprobeError);
      return {
        success: false,
        error: ffprobeError.message,
        filePath,
        fileSize: fileStats.size
      };
    }
  } catch (error) {
    console.error('Error checking audio file:', error);
    return {
      success: false,
      error: error.message,
      filePath
    };
  }
}

/**
 * Process an audio file and generate a summary
 * @param {string} filePath - Path to the audio file
 * @returns {Promise<object>} - Summary result
 */
export async function processAudioFile(filePath) {
  try {
    // First check the audio file details
    const fileCheck = await checkAudioFile(filePath);
    if (!fileCheck.success) {
      console.error('Audio file check failed:', fileCheck.error);
    }
    
    // Even if the check fails, try to transcribe anyway
    console.log('Transcribing audio...');
    const transcript = await transcribeAudio(filePath);
    console.log(`Transcript generated (${transcript.length} characters, ${transcript.split(' ').length} words)`);
    
    // Save the transcript to a file
    const transcriptPath = path.join(__dirname, '..', 'temp', `transcript_${Date.now()}.txt`);
    fs.writeFileSync(transcriptPath, transcript, 'utf8');
    
    // Generate a PDF from the transcript
    console.log('Generating PDF from transcript...');
    const pdfPath = await generatePDF(transcript);
    
    return {
      success: true,
      transcript,
      transcriptPath,
      pdfPath
    };
  } catch (error) {
    console.error('Error processing audio file:', error);
    return {
      success: false,
      error: error.message
    };
  }
} 