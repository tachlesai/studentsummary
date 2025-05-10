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
        prompt += `\n\nCreate a concise summary using clear and concise bullet points. Focus only on the essential concepts, definitions, examples, and key ideas. Group related points where relevant. Each bullet point should capture one core idea in one sentence. Do not add external information or personal interpretation.
        
        Formatting for concise style:
        - Use bullet points (•) for each main point
        - Group related points under bold headers
        - Start each bullet with a key term or concept in bold if applicable
        - Keep each bullet to 1-2 sentences maximum
        - Use emojis at the start of important points (📌, 🔑, 💡)
        - End with a "Key Takeaways" section with 3-5 most important points`;
        break;
      
      case 'detailed':
        prompt += `\n\nWrite a comprehensive and detailed summary that fully captures everything important that was said. Include explanations, definitions, processes, examples, and context, all written in clear and academic language. The goal is for a student to study from your summary as if they had attended the lecture. Structure the text logically, and maintain the same order of topics as in the original lecture.
        
        Formatting for detailed style:
        - Use clear section headers with numbering (1, 2, 3)
        - Include subsections with decimal numbering (1.1, 1.2, etc.)
        - Format important definitions in blockquotes or with special formatting
        - Use tables to organize related information when appropriate
        - Include "Important Note:" sections for critical information
        - End with a "Summary of Key Points" section`;
        break;
      
      case 'narrative':
        prompt += `\n\nGenerate a brief narrative summary of the key ideas. Keep it to one or two well-structured paragraphs. Avoid excessive detail, and focus on delivering a readable, fluent overview of the main arguments, themes, or ideas. Use full sentences – do not use bullet points.
        
        Formatting for narrative style:
        - Write in flowing paragraphs with clear topic sentences
        - Use italics for emphasis on key terms or concepts
        - Keep to 2-3 paragraphs maximum
        - Use transition words between ideas (furthermore, however, therefore)
        - Focus on the relationships between concepts
        - End with a concluding sentence that captures the main point`;
        break;
      
      case 'thematic':
        prompt += `\n\nSummarize the content by dividing it into thematic sections or topic-based headers. Under each section, write a concise summary of the relevant material. Focus on clarity and structure. Ensure that all major areas covered in the lecture are represented. This is helpful for students who want to focus on specific parts of the lecture later.
        
        Formatting for thematic style:
        - Use clear, descriptive section headers with emoji icons
        - Start each section with a one-sentence overview
        - Include 3-5 bullet points under each section
        - Use bold text for key concepts in each section
        - Add a "Connection" note at the end of each section showing how it relates to other sections
        - End with a "Themes Overview" that lists all major themes`;
        break;
      
      case 'qa':
        prompt += `\n\nExtract important information and convert it into a Q&A format suitable for student practice and revision. Each question should address a major topic or key concept mentioned in the lecture. Provide clear and direct answers based strictly on the content of the lecture. Do not invent or assume additional information. Aim for around 5–15 question-answer pairs, depending on the amount of material covered.
        
        Formatting for Q&A style:
        - Format questions in bold and numbered (Q1, Q2, etc.)
        - Group questions by topic with clear section headers
        - Keep questions clear and specific
        - Format answers in plain text below each question
        - Include "Why it matters:" after important answers
        - End with 2-3 "Review Questions" that require synthesizing multiple concepts`;
        break;
      
      case 'glossary':
        prompt += `\n\nExtract a list of important terms and their definitions as presented or implied by the speaker. Only include terms that were explicitly mentioned or explained. For each term, provide a short and clear definition that reflects the context of the lecture. Format as a glossary-style list.
        
        Formatting for glossary style:
        - Format terms in bold and alphabetical order
        - Provide clear, concise definitions (1-3 sentences)
        - Include context or examples where mentioned
        - Mark key terms with a star (★) symbol
        - Group related terms under category headers if appropriate
        - Include "See also:" references to related terms
        - End with a "Core Concepts" section listing 5-7 most important terms`;
        break;
      
      case 'steps':
        prompt += `\n\nIdentify any processes, methods, workflows, or step-based explanations. Summarize them clearly as a numbered list of steps, maintaining the logical sequence as presented in the lecture. This summary should help a student understand the "how" or "in what order" of the discussed content.
        
        Formatting for steps style:
        - Use clear numbered steps (Step 1, Step 2, etc.)
        - Start each step with an action verb
        - Include a brief explanation for each step
        - Add notes or warnings for tricky steps
        - Use arrows (→) to show the flow between steps
        - Include a "Before you begin" section if appropriate
        - End with a "Common Mistakes" section`;
        break;
      
      case 'tldr':
        prompt += `\n\nWrite a one-sentence summary that captures the core purpose or insight of the lecture in the simplest and clearest way possible. This should help a student quickly understand what the lecture was mainly about. Then add 3-5 bullet points with the key supporting ideas.
        
        Formatting for TLDR style:
        - Start with a single, bold sentence summary (maximum 25 words)
        - Follow with 3-5 short bullet points of supporting details
        - Use emojis to highlight the main categories of information
        - Keep the entire summary under 150 words
        - Focus only on the absolute most important concepts
        - End with a "Why this matters:" single sentence`;
        break;
      
      default:
        prompt += `\n\nCreate a balanced summary that captures the main points while maintaining readability and clarity.
        
        Formatting for default style:
        - Use clear section headers with numbering (1, 2, 3)
        - Include subsections with decimal numbering (1.1, 1.2, etc.)
        - Format important definitions in blockquotes or with special formatting
        - Use tables to organize related information when appropriate
        - Include "Important Note:" sections for critical information
        - End with a "Summary of Key Points" section`;
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
    console.log(`[DirectProcessor] Summary style: ${options.style || 'detailed'}`);
    
    // First check if Gemini is available
    if (!genAI) {
      throw new Error('Gemini client not initialized - API key may be missing');
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    console.log(`[DirectProcessor] Audio file size: ${fileSizeMB.toFixed(2)}MB`);

    // Get file extension and mime type
    const ext = path.extname(filePath).toLowerCase();
    let mimeType;
    switch (ext) {
      case '.mp3':
        mimeType = 'audio/mpeg';
        break;
      case '.mp4':
        mimeType = 'video/mp4';
        break;
      case '.wav':
        mimeType = 'audio/wav';
        break;
      case '.m4a':
        mimeType = 'audio/mp4';
        break;
      default:
        throw new Error(`Unsupported file format: ${ext}. Supported formats are: MP3, MP4, WAV, M4A`);
    }

    // Create a model instance
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro-exp-03-25" });
    
    // Prepare the prompt
    let prompt = `You are an expert educational summarizer. Create a student-friendly summary of the following audio recording.`;
    
    // Add style-specific instructions
    prompt += getStyleSpecificPrompt(options.style);
    
    // Add language preference
    prompt += getLanguageSpecificPrompt(options.language);
    
    console.log(`[DirectProcessor] Sending request to Gemini API for summarization...`);
    
    // Read file in chunks to manage memory
    const fileStream = fs.createReadStream(filePath);
    const chunks = [];
    
    for await (const chunk of fileStream) {
      chunks.push(chunk);
    }
    
    const fileBuffer = Buffer.concat(chunks);
    
    // Send to Gemini API
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: mimeType,
          data: fileBuffer.toString('base64')
        }
      }
    ]);
    
    console.log(`[DirectProcessor] Received response from Gemini API for summarization`);
    
    // Extract summary
    const summary = result.response.text();
    console.log(`[DirectProcessor] Summarization successful: ${summary.length} characters, ${summary.split(' ').length} words`);
    
    return summary;
  } catch (error) {
    console.error(`[DirectProcessor] Summarization error:`, error);
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
async function processAudio(filePath, options = {}) {
  try {
    console.log(`[DirectProcessor] Processing audio file: ${filePath}`);
    
    // Get file stats
    const stats = fs.statSync(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    console.log(`[DirectProcessor] File size: ${fileSizeMB.toFixed(2)}MB`);

    // Get file extension
    const ext = path.extname(filePath).toLowerCase();
    if (!['.mp3', '.mp4', '.wav', '.m4a'].includes(ext)) {
      throw new Error(`Unsupported file format: ${ext}. Supported formats are: MP3, MP4, WAV, M4A`);
    }

    // Log the summary style if provided
    if (options.style) {
      console.log(`[DirectProcessor] Summary style: ${options.style}`);
    }

    // Process the audio file
    const summary = await summarizeAudioWithGemini(filePath, options);
    return {
      summary,
      style: options.style || 'detailed',
      language: options.language || 'he'
    };
  } catch (error) {
    console.error(`[DirectProcessor] Processing error:`, error);
    throw error;
  }
}

// Export functions
export {
  processAudio,
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