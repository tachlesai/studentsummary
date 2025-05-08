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
    
    // Create a model instance - using the newer Gemini 2.5 Pro model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-exp-03-25" });
    
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
    
    // Create a model instance - using the newer Gemini 2.5 Pro model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-exp-03-25" });
    
    // Base prompt for student-friendly summarization
    let prompt = `You are an expert educational summarizer. Create a student-friendly summary of the following Hebrew text, which is a transcription of an audio recording.`;

    // Add specific instructions based on the selected style
    switch (options.style) {
      case 'concise':
        prompt += `\n\nCreate a concise summary using clear and concise bullet points. Focus only on the essential concepts, definitions, examples, and key ideas. Group related points where relevant. Each bullet point should capture one core idea in one sentence. Do not add external information or personal interpretation.`;
        break;
      
      case 'detailed':
        prompt += `\n\nWrite a comprehensive and detailed summary that fully captures everything important that was said. Include explanations, definitions, processes, examples, and context, all written in clear and academic language. The goal is for a student to study from your summary as if they had attended the lecture. Structure the text logically, and maintain the same order of topics as in the original lecture.`;
        break;
      
      case 'narrative':
        prompt += `\n\nGenerate a brief narrative summary of the key ideas. Keep it to one or two well-structured paragraphs. Avoid excessive detail, and focus on delivering a readable, fluent overview of the main arguments, themes, or ideas. Use full sentences – do not use bullet points.`;
        break;
      
      case 'thematic':
        prompt += `\n\nSummarize the content by dividing it into thematic sections or topic-based headers. Under each section, write a concise summary of the relevant material. Focus on clarity and structure. Ensure that all major areas covered in the lecture are represented. This is helpful for students who want to focus on specific parts of the lecture later.`;
        break;
      
      case 'qa':
        prompt += `\n\nExtract important information and convert it into a Q&A format suitable for student practice and revision. Each question should address a major topic or key concept mentioned in the lecture. Provide clear and direct answers based strictly on the content of the lecture. Do not invent or assume additional information. Aim for around 5–15 question-answer pairs, depending on the amount of material covered.`;
        break;
      
      case 'glossary':
        prompt += `\n\nExtract a list of important terms and their definitions as presented or implied by the speaker. Only include terms that were explicitly mentioned or explained. For each term, provide a short and clear definition that reflects the context of the lecture. Format as a glossary-style list.`;
        break;
      
      case 'steps':
        prompt += `\n\nIdentify any processes, methods, workflows, or step-based explanations. Summarize them clearly as a numbered list of steps, maintaining the logical sequence as presented in the lecture. This summary should help a student understand the "how" or "in what order" of the discussed content.`;
        break;
      
      case 'tldr':
        prompt += `\n\nWrite a one-sentence summary that captures the core purpose or insight of the lecture in the simplest and clearest way possible. This should help a student quickly understand what the lecture was mainly about.`;
        break;
      
      default:
        prompt += `\n\nCreate a balanced summary that captures the main points while maintaining readability and clarity.`;
    }

    // Add language preference
    switch (options.language) {
      case 'en':
        prompt += `\n\nPlease provide the summary in English.`;
        break;
      case 'he':
        prompt += `\n\nPlease provide the summary in Hebrew.`;
        break;
      case 'ar':
        prompt += `\n\nPlease provide the summary in Arabic.`;
        break;
      case 'fr':
        prompt += `\n\nPlease provide the summary in French.`;
        break;
      case 'ru':
        prompt += `\n\nPlease provide the summary in Russian.`;
        break;
      default:
        prompt += `\n\nPlease provide the summary in Hebrew.`;
        break;
    }

    // Add the text to be summarized
    prompt += `\n\nHere is the text to summarize:\n${text}`;

    console.log(`[DirectProcessor] Sending request to Gemini API...`);
    const result = await model.generateContent(prompt);
    console.log(`[DirectProcessor] Received response from Gemini API`);
    
    const summary = result.response.text();
    console.log(`[DirectProcessor] Summary generated: ${summary.length} characters`);
    
    return summary;
  } catch (error) {
    console.error(`[DirectProcessor] Error in summarization:`, error);
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
    
    // Create a model instance - using the newer Gemini 2.5 Pro model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-exp-03-25" });
    
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
 * @returns {Promise<Object>} - Object containing chunk file paths and original path
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
    return {
      chunks: [filePath],
      originalPath: filePath,
      isOriginalReturned: true
    };
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

  return {
    chunks: chunkFiles,
    originalPath: filePath,
    isOriginalReturned: false
  };
}

/**
 * Comprehensive cleanup of all temporary files
 * @param {Array<string>} filePaths - Array of file paths to clean up
 * @param {Object} options - Options for cleanup
 */
async function cleanupAllFiles(filePaths = [], options = {}) {
  console.log(`[DirectProcessor] Cleaning up ${filePaths.length} temporary files...`);
  
  const errors = [];
  for (const filePath of filePaths) {
    if (!filePath || typeof filePath !== 'string') continue;
    
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`[DirectProcessor] Cleaned up: ${filePath}`);
      }
    } catch (error) {
      console.error(`[DirectProcessor] Failed to clean up file ${filePath}:`, error.message);
      errors.push({ file: filePath, error: error.message });
    }
  }
  
  // Additionally, clean up debug transcript files
  if (options.cleanDebugFiles) {
    const tempDir = path.join(__dirname, '..', 'temp');
    try {
      if (fs.existsSync(tempDir)) {
        const now = Date.now();
        const debugFiles = fs.readdirSync(tempDir)
          .filter(f => f.startsWith('direct_transcript_') && f.endsWith('.txt'))
          .map(f => path.join(tempDir, f));
        
        for (const debugFile of debugFiles) {
          try {
            const stats = fs.statSync(debugFile);
            // Only delete debug files older than 1 hour
            if (now - stats.mtimeMs > 60 * 60 * 1000) {
              fs.unlinkSync(debugFile);
              console.log(`[DirectProcessor] Cleaned up debug file: ${debugFile}`);
            }
          } catch (error) {
            console.error(`[DirectProcessor] Failed to clean up debug file ${debugFile}:`, error.message);
          }
        }
      }
    } catch (error) {
      console.error(`[DirectProcessor] Error cleaning debug files:`, error.message);
    }
  }
  
  return { success: errors.length === 0, errors };
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

  const filesToCleanup = []; // Track all files created during processing
  let wavFile = null;
  
  try {
    // Step 1: Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }

    // Step 2: Check if only transcription is requested
    if (options.onlyTranscribe) {
      const transcript = await transcribeWithGemini(filePath);
      
      // The transcribeWithGemini function already cleans up its WAV file
      // We can also clean up any debug files
      await cleanupAllFiles([], { cleanDebugFiles: true });
      
      return {
        success: true,
        transcript,
        summary: null // No summarization needed
      };
    }

    // Step 3: Directly summarize the audio file
    const summary = await summarizeAudioWithGemini(filePath, options);
    
    // Clean up any debug files
    await cleanupAllFiles([], { cleanDebugFiles: true });

    return {
      success: true,
      summary,
      transcript: null // No transcription needed
    };
  } catch (error) {
    console.error(`[DirectProcessor] Error processing audio:`, error);
    
    // Attempt to clean up any files that might have been created
    if (filesToCleanup.length > 0) {
      await cleanupAllFiles(filesToCleanup, { cleanDebugFiles: true });
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Export functions
export {
  transcribeWithGemini,
  summarizeWithGemini,
  cleanupAllFiles
};

export default {
  processAudio,
  transcribeWithGemini,
  summarizeWithGemini,
  cleanupAllFiles
}; 