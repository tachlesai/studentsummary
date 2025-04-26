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
    
    const fileStats = fs.statSync(filePath);
    console.log(`[DirectProcessor] Audio file size: ${fileStats.size} bytes (${(fileStats.size / 1024 / 1024).toFixed(2)}MB)`);
    
    // Step 2: Process based on output type
    if (options.onlyTranscribe) {
      // If only transcription is requested
      console.log(`[DirectProcessor] Starting transcription process...`);
      transcript = await transcribeWithGemini(filePath);
      console.log(`[DirectProcessor] Transcription completed successfully`);
      return {
        success: true,
        transcript,
        summary: null
      };
    } else {
      // If summarization is requested, send directly to Gemini for summarization
      console.log(`[DirectProcessor] Starting direct audio summarization...`);
      summary = await summarizeAudioWithGemini(filePath, options);
      console.log(`[DirectProcessor] Summarization completed successfully`);
      return {
        success: true,
        transcript: null,
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