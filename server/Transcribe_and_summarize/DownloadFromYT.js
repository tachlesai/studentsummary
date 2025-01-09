// Step 1: Install the required package in your Node.js project
// Run this in your terminal: npm install youtube-dl-exec

// Step 2: Import youtube-dl-exec using ES modules syntax
import ytdl from 'youtube-dl-exec';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Step 3: Define the function to download audio from YouTube
async function downloadAudio(link) {
  try {
    // Create temp directory if it doesn't exist
    const tempDir = path.join(path.dirname(__filename), 'temp');
    await fs.mkdir(tempDir, { recursive: true });
    
    const outputPath = path.join(tempDir, 'audio.mp3');
    console.log('Starting download...');
    console.log('Output path:', outputPath);

    // Use youtube-dl-exec directly
    await ytdl(link, {
      extractAudio: true,
      audioFormat: 'mp3',
      audioQuality: '192k',
      output: outputPath,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true,
      addHeader: [
        'referer:youtube.com',
        'user-agent:Mozilla/5.0'
      ]
    });

    console.log('Download complete!');
    return outputPath;
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
}

// Example usage
const youtubeLink = 'https://www.youtube.com/watch?v=HQ3yZ2es_Ts';
downloadAudio(youtubeLink);

export default downloadAudio;
