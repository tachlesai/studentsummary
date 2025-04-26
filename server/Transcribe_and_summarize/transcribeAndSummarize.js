import { createClient } from '@deepgram/sdk';
import fs from "fs/promises";
import { summarizeText } from './audioProcessing.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get Deepgram API key from environment variables
const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
console.log('Deepgram API key (first 5 chars):', deepgramApiKey ? deepgramApiKey.substring(0, 5) + '...' : 'Not set');
console.log('Using Deepgram API key:', deepgramApiKey ? deepgramApiKey.substring(0, 5) + '...' : 'Not set');

// Initialize Deepgram client only if API key is available
const deepgram = deepgramApiKey ? createClient(deepgramApiKey) : null;

// Development mode flag
const isDevelopment = process.env.NODE_ENV !== 'production';

// Mock transcription function for development
async function mockTranscribeAudio(filePath) {
  console.log(`[MOCK] Transcribing file: ${filePath}`);
  
  // Create a mock transcription based on the file type
  const fileExt = path.extname(filePath).toLowerCase();
  let mockText = '';
  
  if (fileExt === '.mp3' || fileExt === '.wav' || fileExt === '.m4a') {
    mockText = 'זהו תמלול לדוגמה שנוצר במצב פיתוח. המערכת מזהה שאתה משתמש במצב פיתוח ומספקת תמלול מדומה במקום להשתמש ב-API של Deepgram. במצב הפעלה אמיתי, התמלול יהיה מבוסס על תוכן הקובץ השמע שהועלה. כרגע, אנחנו מספקים טקסט לדוגמה כדי לאפשר לך לבדוק את התפקוד של האפליקציה מבלי לצרוך קריאות API יקרות. התמלול האמיתי יכלול את כל הטקסט שנאמר בהקלטה, עם סימני פיסוק ופורמט מתאים.';
  } else {
    mockText = 'קובץ לא מזוהה. אנא העלה קובץ שמע בפורמט נתמך.';
  }
  
  // Save mock transcription to file for consistency
  const transcriptionPath = path.join(__dirname, '..', 'temp', 'transcription.txt');
  
  // Ensure the temp directory exists
  await fs.mkdir(path.join(__dirname, '..', 'temp'), { recursive: true });
  
  // Write the mock transcription to file
  await fs.writeFile(transcriptionPath, mockText, 'utf8');
  
  return mockText;
}

// Updated Transcription Function using Deepgram
async function transcribeAudio(filePath, retries = 3, delay = 5000) {
  // Import the improved version from audioProcessing.js
  const { transcribeAudio: improvedTranscribe } = await import('./audioProcessing.js');
  
  try {
    console.log('Delegating to improved transcription function');
    // Call the improved transcription function
    const transcript = await improvedTranscribe(filePath);
    
    // Log length metrics
    console.log(`Transcription word count: ${transcript.split(' ').length}`);
    console.log(`Transcription character length: ${transcript.length}`);
    
    // Save transcription to file
    const transcriptionPath = path.join(__dirname, '..', 'temp', 'transcription.txt');
    
    // Ensure the temp directory exists
    await fs.mkdir(path.join(__dirname, '..', 'temp'), { recursive: true });
    
    // Write the transcription to file
    await fs.writeFile(transcriptionPath, transcript, 'utf8');

    return transcript;
  } catch (error) {
    console.error("Error in improved transcription:", error);
    
    // If the improved method fails, fall back to the original method
    console.log("Falling back to original transcription method");
    
    // Always try to use real API first, even in development
    if (!deepgramApiKey || deepgramApiKey === '') {
      console.log('No Deepgram API key found, using mock transcription');
      return mockTranscribeAudio(filePath);
    }
    
    try {
      console.log('Using real Deepgram API for transcription (fallback)');
      const audioData = await fs.readFile(filePath);

      const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
        audioData,
        {
          model: 'whisper-large',
          language: 'he',
          smart_format: true,
        }
      );

      if (error) {
        throw new Error('Deepgram transcription failed: ' + error);
      }

      // Save transcription to file
      const transcriptionPath = path.join(__dirname, '..', 'temp', 'transcription.txt');
      
      // Ensure the temp directory exists
      await fs.mkdir(path.join(__dirname, '..', 'temp'), { recursive: true });
      
      // Write the transcription to file
      await fs.writeFile(transcriptionPath, result.results.channels[0].alternatives[0].transcript, 'utf8');

      return result.results.channels[0].alternatives[0].transcript;
    } catch (fallbackError) {
      console.error("Error in fallback transcription:", fallbackError);
      
      // Retry logic for API failures
      if (retries > 0) {
        console.log(`Retrying transcription in ${delay/1000} seconds... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return transcribeAudio(filePath, retries - 1, delay * 1.5);
      }
      
      // If all retries fail, fall back to mock
      console.log("All retries failed, falling back to mock transcription");
      return mockTranscribeAudio(filePath);
    }
  }
}

// Process transcription in chunks and summarize
async function processAndSummarize(filePath, options = {}) {
  try {
    // Process options
    const style = options.style || 'detailed'; // concise, detailed, academic
    const format = options.format || 'bullets'; // bullets, paragraphs
    const language = options.language || 'he'; // he, en
    const maxPoints = options.maxPoints || 10; // 1-20
    const onlyTranscribe = options.onlyTranscribe || false; // Just transcribe without summarizing
    
    console.log(`Processing with options: style=${style}, format=${format}, language=${language}, maxPoints=${maxPoints}, onlyTranscribe=${onlyTranscribe}`);
    
    // Step 1: Transcribe the audio
    const transcription = await transcribeAudio(filePath);
    
    // If only transcription is requested, return it immediately
    if (onlyTranscribe) {
      console.log('Only transcription requested, skipping summarization');
      return transcription;
    }

    // Step 2: Break transcription into chunks
    const words = transcription.split(" ");
    const chunkSize = 1500;
    const chunks = [];

    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize).join(" "));
    }

    // Step 3: Summarize each chunk with options
    const summaries = [];
    for (const [index, chunk] of chunks.entries()) {
      console.log(`Summarizing chunk ${index + 1}/${chunks.length}...`);
      
      // Create a specific prompt for each style, format, and language
      let promptStyle = '';
      if (style === 'concise') {
        promptStyle = 'Create a concise and brief summary including only the most essential points.';
      } else if (style === 'detailed') {
        promptStyle = 'Create a comprehensive summary that captures the main points and key details.';
      } else if (style === 'academic') {
        promptStyle = 'Create a thorough academic summary with formal language, citing main concepts and their relationships.';
      }
      
      let promptFormat = '';
      if (format === 'bullets') {
        promptFormat = `Format the summary as a bullet point list with a maximum of ${maxPoints} points.`;
      } else {
        promptFormat = 'Format the summary as coherent paragraphs with good transitions between ideas.';
      }
      
      let promptLanguage = '';
      if (language === 'en') {
        promptLanguage = 'Write the summary in English.';
      } else {
        promptLanguage = 'Write the summary in Hebrew.';
      }
      
      const customPrompt = `
        ${promptStyle} ${promptFormat} ${promptLanguage}
        
        Text to summarize:
        ${chunk}
      `;
      
      // Always try to use real API first, even in development mode
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === '') {
        console.log('No Gemini API key found, using mock summary');
        const mockSummary = createMockSummary(chunk, style, format, language, maxPoints);
        summaries.push(mockSummary);
      } else {
        // Use the custom prompt for the summary
        console.log('Using real Gemini API for summarization');
        const summary = await summarizeText(chunk, customPrompt);
        summaries.push(summary);
      }
    }

    // Step 4: Combine all summaries into a final summary
    let finalSummary;
    if (summaries.length > 1) {
      const combinedText = summaries.join("\n\n");
      
      // Create a prompt for the final summary
      const finalPrompt = `
        ${promptStyle} ${promptFormat} ${promptLanguage}
        This is a final summary combining multiple section summaries.
        
        Text to summarize:
        ${combinedText}
      `;
      
      // Always try to use real API first, even in development mode
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === '') {
        console.log('No Gemini API key found, using mock final summary');
        finalSummary = createMockSummary(combinedText, style, format, language, maxPoints);
      } else {
        console.log('Using real Gemini API for final summarization');
        finalSummary = await summarizeText(combinedText, finalPrompt);
      }
    } else {
      finalSummary = summaries[0];
    }

    console.log("הנה הסיכום שלך:", finalSummary);
    return finalSummary;
  } catch (error) {
    console.error("Error processing and summarizing:", error);
    
    // Only use mock as absolute last resort
    if (error.message && error.message.includes('API key')) {
      console.log('API key error, using mock summary');
      
      // Extract filename from path for title
      const pathParts = filePath.split('/');
      const filename = pathParts[pathParts.length - 1].replace(/\.[^/.]+$/, "");
      
      // Create a mock summary based on options
      const style = options.style || 'detailed';
      const format = options.format || 'bullets';
      const language = options.language || 'he';
      const maxPoints = options.maxPoints || 10;
      
      let mockContent = '';
      
      if (language === 'en') {
        mockContent = `This is a sample summary created in development mode with style=${style}, format=${format}, and maxPoints=${maxPoints}.`;
      } else {
        mockContent = `זהו סיכום לדוגמה שנוצר במצב פיתוח עם סגנון=${style}, פורמט=${format}, ומקסימום נקודות=${maxPoints}.`;
      }
      
      if (format === 'bullets') {
        let bulletPoints = [];
        for (let i = 1; i <= Math.min(maxPoints, 5); i++) {
          if (language === 'en') {
            bulletPoints.push(`Point ${i}: Sample content for demonstration.`);
          } else {
            bulletPoints.push(`נקודה ${i}: תוכן לדוגמה לצורך הדגמה.`);
          }
        }
        mockContent = bulletPoints.join('\n');
      }
      
      return {
        content: mockContent,
        title: filename || "סיכום דוגמה",
        pdf_path: "/mock-pdfs/sample.pdf",
        created_at: new Date().toISOString()
      };
    }
    
    // For all other errors, just rethrow
    throw error;
  }
}

// Helper function to create mock summaries
function createMockSummary(text, style, format, language, maxPoints) {
  let mockContent = '';
  
  if (language === 'en') {
    mockContent = `This is a sample summary created in development mode with style=${style}, format=${format}, and maxPoints=${maxPoints}.`;
  } else {
    mockContent = `זהו סיכום לדוגמה שנוצר במצב פיתוח עם סגנון=${style}, פורמט=${format}, ומקסימום נקודות=${maxPoints}.`;
  }
  
  if (format === 'bullets') {
    let bulletPoints = [];
    for (let i = 1; i <= Math.min(maxPoints, 5); i++) {
      if (language === 'en') {
        bulletPoints.push(`Point ${i}: Sample content for demonstration.`);
      } else {
        bulletPoints.push(`נקודה ${i}: תוכן לדוגמה לצורך הדגמה.`);
      }
    }
    mockContent = bulletPoints.join('\n');
  }
  
  return mockContent;
}

// Export only what's needed
export { processAndSummarize };