import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function summarizeAudioWithGemini(audioPath, style = 'detailed', language = 'hebrew') {
  try {
    // Read the audio file
    const audioData = fs.readFileSync(audioPath);
    const audioBase64 = audioData.toString('base64');

    // Get the file extension and corresponding MIME type
    const ext = path.extname(audioPath).toLowerCase();
    const mimeType = {
      '.mp3': 'audio/mpeg',
      '.mp4': 'video/mp4',
      '.wav': 'audio/wav',
      '.m4a': 'audio/mp4'
    }[ext] || 'audio/mpeg';

    // Create the model
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

    // Prepare the prompt
    const prompt = `Please provide a ${style} summary of this audio recording in ${language}. 
    Focus on the main points, key ideas, and important details.
    Format the summary in a clear, structured way.
    If there are any technical terms or specific concepts, explain them briefly.
    Include timestamps for important sections if possible.`;

    // Generate content
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: mimeType,
          data: audioBase64
        }
      }
    ]);

    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error in summarizeAudioWithGemini:', error);
    throw new Error(`Failed to summarize audio: ${error.message}`);
  }
} 