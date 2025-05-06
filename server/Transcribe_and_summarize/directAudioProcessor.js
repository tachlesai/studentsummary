/**
 * Direct Audio Processor
 * This module provides direct audio processing using Google AI Studio's Gemini model
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { encode } from 'gpt-3-encoder';

// Promisify exec
const execAsync = promisify(exec);

// Setup paths and directories
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from correct path
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });
console.log(`[DirectProcessor] Loading environment from: ${envPath}`);

// Initialize API client
const geminiApiKey = process.env.GEMINI_API_KEY;
console.log(`[DirectProcessor] Gemini API key: ${geminiApiKey ? geminiApiKey.substring(0, 5) + '...' : 'NOT FOUND'}`);

// Create API client
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

/**
 * Convert audio file to WAV format for better processing
 * @param {string} filePath - Path to the audio file
 * @returns {Promise<string>} - Path to the converted WAV file
 */
async function convertToWav(filePath) {
  try {
    console.log(`[DirectProcessor] Converting audio file: ${filePath}`);
    
    // Create a unique output path
    const outputPath = path.join(
      path.dirname(filePath),
      `converted_${Date.now()}_${path.basename(filePath).replace(/\.[^/.]+$/, '')}.wav`
    );
    
    // Run ffmpeg to convert the file with proper parameters for speech recognition
    await execAsync(`ffmpeg -y -i "${filePath}" -acodec pcm_s16le -ac 1 -ar 16000 "${outputPath}"`);
    
    // Verify the file was created and has content
    if (!fs.existsSync(outputPath)) {
      throw new Error(`Conversion failed, output file not created: ${outputPath}`);
    }
    
    const fileStats = fs.statSync(outputPath);
    console.log(`[DirectProcessor] Converted file size: ${fileStats.size} bytes (${(fileStats.size / 1024 / 1024).toFixed(2)}MB)`);
    
    if (fileStats.size < 1000) {
      throw new Error(`Conversion produced a suspiciously small file: ${fileStats.size} bytes`);
    }
    
    return outputPath;
  } catch (error) {
    console.error(`[DirectProcessor] Error converting audio:`, error);
    throw error;
  }
}

/**
 * Transcribe audio file using Gemini
 * @param {string} filePath - Path to audio file
 * @returns {Promise<string>} - Transcription text
 */
async function transcribeWithGemini(filePath) {
  try {
    console.log(`[DirectProcessor] Transcribing file: ${filePath}`);
    
    // First check if Gemini is available
    if (!genAI) {
      throw new Error('Gemini client not initialized - API key may be missing');
    }
    
    // Convert to WAV format
    const wavFile = await convertToWav(filePath);
    console.log(`[DirectProcessor] Using WAV file for transcription: ${wavFile}`);
    
    // Read file content
    const fileBuffer = fs.readFileSync(wavFile);
    console.log(`[DirectProcessor] Audio file size: ${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB`);
    
    // Create a model instance - using the newer Gemini 1.5 Pro model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Prepare the prompt for transcription
    const prompt = `Please transcribe the following audio file. The audio is in Hebrew. 
    Provide a detailed transcription that captures all spoken content, including any pauses, 
    emphasis, or important sounds. Format the output as plain text.`;
    
    console.log(`[DirectProcessor] Sending request to Gemini API...`);
    // Send to Gemini API
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "audio/wav",
          data: fileBuffer.toString('base64')
        }
      }
    ]);
    console.log(`[DirectProcessor] Received response from Gemini API`);
    
    // Clean up the temporary WAV file
    try {
      fs.unlinkSync(wavFile);
      console.log(`[DirectProcessor] Cleaned up temporary WAV file`);
    } catch (cleanupError) {
      console.error(`[DirectProcessor] Failed to clean up WAV file:`, cleanupError);
    }
    
    // Extract transcript
    const transcript = result.response.text();
    console.log(`[DirectProcessor] Transcription successful: ${transcript.length} characters, ${transcript.split(' ').length} words`);
    
    // Save transcription to a file for debugging
    const transcriptFile = path.join(__dirname, '..', 'temp', `direct_transcript_${Date.now()}.txt`);
    fs.writeFileSync(transcriptFile, transcript, 'utf8');
    console.log(`[DirectProcessor] Transcription saved to: ${transcriptFile}`);
    
    return transcript;
  } catch (error) {
    console.error(`[DirectProcessor] Transcription error:`, error);
    // Log more details about the error
    if (error.response) {
      console.error(`[DirectProcessor] Error response:`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    throw error;
  }
}

/**
 * Summarize text using Gemini
 * @param {string} text - Text to summarize
 * @param {object} options - Summarization options
 * @returns {Promise<string>} - Summary text
 */
async function summarizeWithGemini(text, options = {}) {
  try {
    console.log(`[DirectProcessor] Summarizing text of length: ${text.length}`);
    console.log(`[DirectProcessor] Summarization options:`, options);
    
    if (!genAI) {
      throw new Error('Gemini client not initialized - API key may be missing');
    }
    
    // Create a model instance - using the newer Gemini 1.5 Pro model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Base prompt for student-friendly summarization
    let prompt = `You are an expert educational summarizer. Create a student-friendly summary of the following Hebrew text, which is a transcription of an audio recording.

    Guidelines for the summary:
    1. Structure:
       - Start with a clear, simple overview of the main topic
       - Break down complex ideas into easy-to-understand points
       - Use clear headings and subheadings
       - End with key takeaways or study points
    
    2. Content:
       - Focus on the most important concepts
       - Explain difficult terms in simple language
       - Include relevant examples that help understanding
       - Highlight key definitions and formulas
       - Add study tips or memory aids where helpful
    
    3. Style:
       - Write in clear, simple Hebrew
       - Use short paragraphs and bullet points
       - Include "Key Points" sections
       - Add "Remember" boxes for important information
       - Use emojis or symbols to highlight important points (📝 for notes, 💡 for tips, ⭐ for key points)
    
    4. Study-Friendly Features:
       - Add "Quick Review" sections
       - Include "Practice Questions" where appropriate
       - Highlight connections between different topics
       - Add "Common Mistakes to Avoid" sections
       - Include "Further Reading" suggestions if relevant`;

    // Add specific instructions based on options
    if (options.includeDefinitions) {
      prompt += `\n\nSpecial Focus: Include clear definitions and explanations of all technical terms.`;
    }
    
    if (options.includeExamples) {
      prompt += `\n\nSpecial Focus: Provide multiple real-world examples for each concept.`;
    }
    
    if (options.includePracticeQuestions) {
      prompt += `\n\nSpecial Focus: Add practice questions at the end of each section.`;
    }
    
    if (options.includeKeyPoints) {
      prompt += `\n\nSpecial Focus: Highlight key points with bullet points and emojis.`;
    }
    
    if (options.includeTimeline) {
      prompt += `\n\nSpecial Focus: Organize information chronologically where possible.`;
    }
    
    if (options.includeDiagrams) {
      prompt += `\n\nSpecial Focus: Describe how to visualize concepts using simple diagrams.`;
    }
    
    if (options.includeComparisons) {
      prompt += `\n\nSpecial Focus: Compare and contrast related concepts.`;
    }
    
    // Add the text to summarize
    prompt += `\n\nText to summarize:\n${text}`;
    
    // Generate summary
    const result = await model.generateContent(prompt);
    const summary = result.response.text();
    
    console.log(`[DirectProcessor] Summary generated: ${summary.length} characters`);
    
    return summary;
  } catch (error) {
    console.error(`[DirectProcessor] Summarization error:`, error);
    throw error;
  }
}

/**
 * Summarize audio directly using Gemini
 * @param {string} filePath - Path to audio file
 * @param {object} options - Summarization options
 * @returns {Promise<string>} - Summary text
 */
async function summarizeAudioWithGemini(filePath, options = {}) {
  try {
    console.log(`[DirectProcessor] Summarizing audio file: ${filePath}`);
    
    // First check if Gemini is available
    if (!genAI) {
      throw new Error('Gemini client not initialized - API key may be missing');
    }
    
    // Convert to WAV format
    const wavFile = await convertToWav(filePath);
    console.log(`[DirectProcessor] Using WAV file for summarization: ${wavFile}`);
    
    // Read file content
    const fileBuffer = fs.readFileSync(wavFile);
    console.log(`[DirectProcessor] Audio file size: ${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB`);
    
    // Create a model instance - using the newer Gemini 1.5 Pro model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Prepare the prompt for summarization with student-friendly formatting
    const prompt = `You are an expert educational summarizer. Create a student-friendly summary of the following Hebrew audio recording.

    Guidelines for the summary:
    1. Language:
       - Write the summary in Hebrew
       - Use clear, simple Hebrew that students can understand
       - Keep the language accessible and engaging
    
    2. Structure:
       - Start with a clear, simple overview of the main topic
       - Break down complex ideas into easy-to-understand points
       - Use clear headings and subheadings
       - End with key takeaways or study points
    
    3. Content:
       - Focus on the most important concepts
       - Explain difficult terms in simple language
       - Include relevant examples that help understanding
       - Highlight key definitions and formulas
       - Add study tips or memory aids where helpful
    
    4. Style:
       - Use short paragraphs and bullet points
       - Include "Key Points" sections
       - Add "Remember" boxes for important information
       - Use emojis or symbols to highlight important points (📝 for notes, 💡 for tips, ⭐ for key points)
    
    5. Study-Friendly Features:
       - Add "Quick Review" sections
       - Include "Practice Questions" where appropriate
       - Highlight connections between different topics
       - Add "Common Mistakes to Avoid" sections
       - Include "Further Reading" suggestions if relevant

    Please summarize the following audio recording following these guidelines.`;
    
    console.log(`[DirectProcessor] Sending request to Gemini API for summarization...`);
    // Send to Gemini API
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "audio/wav",
          data: fileBuffer.toString('base64')
        }
      }
    ]);
    console.log(`[DirectProcessor] Received response from Gemini API for summarization`);
    
    // Clean up the temporary WAV file
    try {
      fs.unlinkSync(wavFile);
      console.log(`[DirectProcessor] Cleaned up temporary WAV file`);
    } catch (cleanupError) {
      console.error(`[DirectProcessor] Failed to clean up WAV file:`, cleanupError);
    }
    
    // Extract summary
    const summary = result.response.text();
    console.log(`[DirectProcessor] Summarization successful: ${summary.length} characters, ${summary.split(' ').length} words`);
    
    return summary;
  } catch (error) {
    console.error(`[DirectProcessor] Summarization error:`, error);
    // Log more details about the error
    if (error.response) {
      console.error(`[DirectProcessor] Error response:`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    throw error;
  }
}

/**
 * Split audio file into 30-minute chunks using ffmpeg
 * @param {string} filePath - Path to the audio file
 * @returns {Promise<string[]>} - Array of chunk file paths
 */
async function splitAudioIfNeeded(filePath) {
  const stats = fs.statSync(filePath);
  const fileSizeMB = stats.size / 1024 / 1024;

  // Get duration using ffprobe
  const ffprobeCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
  const { stdout: durationStr } = await execAsync(ffprobeCmd);
  const duration = parseFloat(durationStr);

  // If file is under 100MB and under 30 minutes, no need to split
  if (fileSizeMB <= 100 && duration <= 30 * 60) {
    return [filePath];
  }

  // Split into 30-minute chunks
  const outputDir = path.dirname(filePath);
  const baseName = path.basename(filePath, path.extname(filePath));
  const chunkPattern = path.join(outputDir, `${baseName}_chunk_%03d${path.extname(filePath)}`);
  const splitCmd = `ffmpeg -i "${filePath}" -f segment -segment_time 1800 -c copy "${chunkPattern}"`;
  await execAsync(splitCmd);

  // Find all chunk files
  const chunkFiles = fs.readdirSync(outputDir)
    .filter(f => f.startsWith(baseName + '_chunk_') && f.endsWith(path.extname(filePath)))
    .map(f => path.join(outputDir, f));

  return chunkFiles;
}

// Helper: sleep for ms milliseconds
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper: Gemini API call with retry on 429
async function callGeminiWithRetry(fn, ...args) {
  let attempts = 0;
  while (true) {
    try {
      return await fn(...args);
    } catch (err) {
      // Check for 429 error
      if (err && err.message && err.message.includes('429')) {
        // Try to extract retryDelay from error message
        let retryMs = 60000; // default 60s
        const match = err.message.match(/"retryDelay":"(\d+)s"/);
        if (match) {
          retryMs = parseInt(match[1], 10) * 1000;
        }
        console.warn(`[DirectProcessor] Gemini 429 error, waiting ${retryMs / 1000}s before retrying...`);
        await sleep(retryMs);
        attempts++;
        continue;
      }
      throw err;
    }
  }
}

/**
 * Process audio file - main function
 * @param {string} filePath - Path to the audio file
 * @param {object} options - Processing options
 * @returns {Promise<object>} - Processing results
 */
export async function processAudio(filePath, options = {}) {
  console.log(`[DirectProcessor] Starting direct audio processing: ${filePath}`);
  console.log(`[DirectProcessor] Options:`, options);
  
  let transcript = null;
  let summary = null;
  let error = null;
  
  try {
    // Step 1: Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }
    
    // Step 2: Split if needed
    const chunkFiles = await splitAudioIfNeeded(filePath);
    let allTranscripts = [];
    let allSummaries = [];
    for (const chunk of chunkFiles) {
      const fileStats = fs.statSync(chunk);
      console.log(`[DirectProcessor] Processing chunk: ${chunk} (${(fileStats.size / 1024 / 1024).toFixed(2)}MB)`);
      await sleep(2000); // 2 second delay between requests
      if (options.onlyTranscribe) {
        const chunkTranscript = await callGeminiWithRetry(transcribeWithGemini, chunk);
        const chunkTokens = encode(chunkTranscript).length;
        console.log(`[DirectProcessor] Chunk transcript token count: ${chunkTokens}`);
        allTranscripts.push(chunkTranscript);
      } else {
        // Always transcribe first for summary
        const chunkTranscript = await callGeminiWithRetry(transcribeWithGemini, chunk);
        const chunkTokens = encode(chunkTranscript).length;
        console.log(`[DirectProcessor] Chunk transcript token count: ${chunkTokens}`);
        allTranscripts.push(chunkTranscript);
      }
    }
    if (options.onlyTranscribe) {
      transcript = allTranscripts.join('\n---\n');
      return {
        success: true,
        transcript,
        summary: null
      };
    } else {
      // Count tokens in the full transcript
      transcript = allTranscripts.join('\n');
      const tokenCount = encode(transcript).length;
      console.log(`[DirectProcessor] Transcript token count: ${tokenCount}`);
      if (tokenCount > 120000) {
        // Too long for Gemini, use summary of summaries
        console.log('[DirectProcessor] Transcript too long, using summary of summaries approach');
        // Summarize each chunk transcript
        for (const chunkTranscript of allTranscripts) {
          await sleep(2000);
          const chunkSummary = await callGeminiWithRetry(async (text) => {
            // Use Gemini to summarize text
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
            const prompt = `סכם את הטקסט הבא בעברית ברמה ידידותית לסטודנט, כולל כותרות, דגשים, וטיפים ללמידה:\n\n${text}`;
            const result = await model.generateContent([prompt]);
            return result.response.text();
          }, chunkTranscript);
          const summaryTokens = encode(chunkSummary).length;
          console.log(`[DirectProcessor] Chunk summary token count: ${summaryTokens}`);
          allSummaries.push(chunkSummary);
        }
        // Now summarize all summaries together
        const summariesText = allSummaries.join('\n');
        const summariesTokens = encode(summariesText).length;
        console.log(`[DirectProcessor] All summaries token count: ${summariesTokens}`);
        const finalSummary = await callGeminiWithRetry(async (text) => {
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
          const prompt = `סכם את כל הסיכומים הבאים לסיכום אחד ברור, לא חזרתי, ומסודר:\n\n${text}`;
          const result = await model.generateContent([prompt]);
          return result.response.text();
        }, summariesText);
        const finalSummaryTokens = encode(finalSummary).length;
        console.log(`[DirectProcessor] Final summary token count: ${finalSummaryTokens}`);
        summary = finalSummary;
      } else {
        // Full transcript is within token limit, summarize as one
        console.log(`[DirectProcessor] Sending full transcript to Gemini for summary. Token count: ${tokenCount}`);
        summary = await callGeminiWithRetry(async (text) => {
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
          const prompt = `סכם את הטקסט הבא בעברית ברמה ידידותית לסטודנט, כולל כותרות, דגשים, וטיפים ללמידה:\n\n${text}`;
          const result = await model.generateContent([prompt]);
          return result.response.text();
        }, transcript);
        const summaryTokens = encode(summary).length;
        console.log(`[DirectProcessor] Full summary token count: ${summaryTokens}`);
      }
      return {
        success: true,
        transcript,
        summary
      };
    }
  } catch (processError) {
    console.error(`[DirectProcessor] Processing error:`, processError);
    error = processError.message;
    
    // Log additional error details
    if (processError.response) {
      console.error(`[DirectProcessor] Error response details:`, {
        status: processError.response.status,
        statusText: processError.response.statusText,
        data: processError.response.data
      });
    }
    
    return {
      success: false,
      error,
      transcript,
      summary
    };
  }
}

// Export functions
export default {
  processAudio,
  transcribeWithGemini,
  summarizeWithGemini
}; 