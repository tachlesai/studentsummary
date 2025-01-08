// Step 1: Install the required package in your Node.js project
// Run this in your terminal: npm install youtube-dl-exec

// Step 2: Import youtube-dl-exec using ES modules syntax
import ytdl from 'youtube-dl-exec';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Step 3: Define the function to download audio from YouTube
async function downloadAudio(link) {
  try {
    // Create temp directory if it doesn't exist
    const tempDir = path.resolve('./temp');
    await fs.mkdir(tempDir, { recursive: true });
    
    // Clean up any existing files
    try {
      await fs.unlink(path.join(tempDir, 'audio.webm.part'));
      await fs.unlink(path.join(tempDir, 'audio.webm'));
      await fs.unlink(path.join(tempDir, 'audio.mp3'));
    } catch (e) {
      // Ignore errors if files don't exist
    }
    
    // Download with simpler options
    const outputPath = path.join(tempDir, 'audio.mp3');
    const options = [
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', '192K',
      '-P', tempDir,  // Set download path explicitly
      '-o', 'audio.mp3',  // Simpler output name
      '--no-keep-video'
    ];

    console.log('Starting download...');
    await execAsync(`yt-dlp ${options.join(' ')} "${link}"`);

    // Verify the file exists
    await fs.access(outputPath);
    console.log('Download complete!');
    return outputPath;
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
}

// Example usage
const youtubeLink = 'https://www.youtube.com/watch?v=VyCuoh9HCd8';
downloadAudio(youtubeLink);

export default downloadAudio;
