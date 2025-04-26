/**
 * Test script for audio transcription
 * Run this script with: node testAudio.js <audioFilePath>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { transcribeAudio } from './audioProcessing.js';
import { processAudioFile } from './processAndSummarize.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check for audio file path argument
if (process.argv.length < 3) {
  console.error('Please provide an audio file path as an argument.');
  console.log('Usage: node testAudio.js <audioFilePath>');
  process.exit(1);
}

const audioFilePath = process.argv[2];

// Validate the file exists
if (!fs.existsSync(audioFilePath)) {
  console.error(`Audio file not found: ${audioFilePath}`);
  process.exit(1);
}

console.log(`\n=============================================`);
console.log(`Testing audio file: ${audioFilePath}`);
console.log(`=============================================\n`);

// Simple file stats
const stats = fs.statSync(audioFilePath);
console.log(`File size: ${stats.size} bytes (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
console.log(`File type: ${path.extname(audioFilePath)}`);

// ANSI colors for output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m"
};

async function runTests() {
  try {
    console.log(`\n${colors.bright}${colors.blue}Running audio file check...${colors.reset}\n`);
    
    // Test processAudioFile
    console.log(`${colors.bright}${colors.yellow}Testing full audio processing pipeline...${colors.reset}`);
    console.time('Full processing time');
    const result = await processAudioFile(audioFilePath);
    console.timeEnd('Full processing time');
    
    if (result.success) {
      console.log(`\n${colors.bright}${colors.green}Processing successful!${colors.reset}`);
      console.log(`Transcript length: ${result.transcript.length} characters`);
      console.log(`Word count: ${result.transcript.split(' ').length} words`);
      console.log(`Transcript saved to: ${result.transcriptPath}`);
      console.log(`PDF saved to: ${result.pdfPath}`);
      
      // Show a sample of the transcript
      console.log(`\n${colors.bright}Transcript sample:${colors.reset}`);
      console.log(`${colors.cyan}${result.transcript.substring(0, 300)}...${colors.reset}`);
    } else {
      console.log(`\n${colors.bright}${colors.red}Processing failed:${colors.reset} ${result.error}`);
    }
    
    // Test direct transcription
    console.log(`\n${colors.bright}${colors.yellow}Testing direct transcription...${colors.reset}`);
    console.time('Direct transcription time');
    const transcript = await transcribeAudio(audioFilePath);
    console.timeEnd('Direct transcription time');
    
    console.log(`\n${colors.bright}Transcript length:${colors.reset} ${transcript.length} characters`);
    console.log(`${colors.bright}Word count:${colors.reset} ${transcript.split(' ').length} words`);
    
    // Show a sample of the transcript
    console.log(`\n${colors.bright}Direct transcript sample:${colors.reset}`);
    console.log(`${colors.cyan}${transcript.substring(0, 300)}...${colors.reset}`);
    
    console.log(`\n${colors.bright}${colors.green}Tests completed successfully!${colors.reset}`);
  } catch (error) {
    console.error(`\n${colors.bright}${colors.red}Error running tests:${colors.reset}`, error);
  }
}

runTests(); 