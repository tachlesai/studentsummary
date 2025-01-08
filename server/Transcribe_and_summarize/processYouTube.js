import downloadAudio from './DownloadFromYT.js';
import fs from 'fs/promises';
import OpenAI from 'openai';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

const openAiApiKey = "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";
const openai = new OpenAI({ apiKey: openAiApiKey });

// Modified splitAudio function to use mp3 format
async function splitAudio(inputPath, segmentLength = 300) {
  try {
    console.log("Starting audio split process...");
    const outputDir = './temp_segments';
    await fs.mkdir(outputDir, { recursive: true });
    
    // First convert to WAV format (more stable)
    console.log("Converting to WAV format...");
    const wavPath = path.join(path.dirname(inputPath), 'converted.wav');
    await execAsync(`ffmpeg -i "${inputPath}" -acodec pcm_s16le -ar 16000 -ac 1 "${wavPath}"`);
    
    // Then split the WAV
    console.log("Splitting audio into segments...");
    const command = `ffmpeg -i "${wavPath}" -f segment -segment_time ${segmentLength} -c copy "${outputDir}/segment_%03d.wav"`;
    console.log("Running command:", command);
    
    await execAsync(command);
    
    // Clean up the intermediate WAV
    await fs.unlink(wavPath);
    
    const files = await fs.readdir(outputDir);
    console.log(`Created ${files.length} segments`);
    return files.map(file => path.join(outputDir, file));
  } catch (error) {
    console.error('Error splitting audio:', error);
    throw error;
  }
}

// Modified transcribeAudio to use small model
async function transcribeAudio(filePath) {
  try {
    console.log("Starting transcription with Whisper Large V3...");
    
    // Split audio into segments
    console.log("Splitting audio into segments...");
    const segments = await splitAudio(filePath);
    let fullTranscription = '';
    
    // Process each segment
    for (const [index, segment] of segments.entries()) {
      console.log(`Starting segment ${index + 1}/${segments.length}...`);
      
      // Try Hebrew first
      try {
        console.log(`Running Whisper command: whisper "${segment}" --model large-v3 --language he`);
        const { stdout: hebrewStdout, stderr: hebrewStderr } = await execAsync(
          `whisper "${segment}" --model large-v3 --language he`,
          { maxBuffer: 1024 * 1024 * 10 } // Increase buffer size
        );
        
        console.log("Whisper output:", hebrewStdout);
        if (hebrewStderr) {
          console.log("Hebrew transcription warning:", hebrewStderr);
        }
        
        // Read the Hebrew transcript
        const transcriptPath = segment.replace(/\.[^/.]+$/, ".txt");
        const hebrewTranscript = await fs.readFile(transcriptPath, 'utf8');
        
        // If Hebrew transcript is too short, try English
        if (hebrewTranscript.trim().length < 50) {
          throw new Error("Short transcript");
        }
        
        // Add to full transcription
        fullTranscription += hebrewTranscript + '\n';
        
        // Clean up segment files
        await fs.unlink(transcriptPath);
        await fs.unlink(segment);
        
      } catch (hebrewError) {
        // Try English if Hebrew fails
        console.log(`Trying English for segment ${index + 1}...`);
        const { stdout: englishStdout, stderr: englishStderr } = await execAsync(
          `whisper "${segment}" --model large-v3 --language en`
        );
        
        if (englishStderr) {
          console.log("English transcription warning:", englishStderr);
        }
        
        // Read the English transcript
        const transcriptPath = segment.replace(/\.[^/.]+$/, ".txt");
        const englishTranscript = await fs.readFile(transcriptPath, 'utf8');
        
        // Add to full transcription
        fullTranscription += englishTranscript + '\n';
        
        // Clean up segment files
        await fs.unlink(transcriptPath);
        await fs.unlink(segment);
      }
    }
    
    console.log("Transcription completed!");
    return fullTranscription;
  } catch (error) {
    console.error("Transcription error:", error);
    throw error;
  }
}

async function summarizeText(text) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "user", content: `Summarize the following text in Hebrew with bulletpoints:\n\n${text}` },
      ],
      max_tokens: 500,
      temperature: 0.5,
    });
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error summarizing text:", error);
    throw error;
  }
}

async function processYouTubeVideo(youtubeUrl) {
  try {
    // Step 1: Download audio from YouTube
    console.log("Downloading audio from YouTube...");
    const audioPath = await downloadAudio(youtubeUrl);
    
    // Step 2: Transcribe the audio
    console.log("Transcribing audio...");
    const transcription = await transcribeAudio(audioPath);
    
    // Step 3: Break transcription into chunks and summarize
    console.log("Summarizing content...");
    const words = transcription.split(" ");
    const chunkSize = 1500;
    const chunks = [];
    
    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize).join(" "));
    }
    
    const summaries = [];
    for (const [index, chunk] of chunks.entries()) {
      console.log(`Summarizing chunk ${index + 1}/${chunks.length}...`);
      const summary = await summarizeText(chunk);
      summaries.push(summary);
    }
    
    // Step 4: Create final summary
    const finalSummary = await summarizeText(summaries.join(" "));
    
    // Clean up: Delete the audio file
    await fs.unlink(audioPath);
    
    console.log("הנה הסיכום שלך:", finalSummary);
    return finalSummary;
  } catch (error) {
    console.error("Error processing video:", error);
    throw error;
  }
}

// Example usage
const youtubeUrl = "https://www.youtube.com/watch?v=9w-wdYDF5-E";
processYouTubeVideo(youtubeUrl)
  .then(summary => console.log("Process completed successfully!"))
  .catch(error => console.error("Process failed:", error));

export default processYouTubeVideo; 