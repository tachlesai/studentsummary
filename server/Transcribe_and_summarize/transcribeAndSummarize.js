import axios from "axios";
import fs from "fs/promises"; // Use `fs/promises` for async file operations
import OpenAI from "openai";

const hfApiToken = "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"; // Replace with your Hugging Face token
const openAiApiKey = "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"; // Replace with your OpenAI API key
const model = "openai/whisper-large-v3";
const filePath = "./audioTest.m4a"; // Update with your actual audio file path

const openai = new OpenAI({ apiKey: openAiApiKey });

// Transcription Function
async function transcribeAudio(filePath, retries = 3, delay = 5000) {
  try {
    const audioData = await fs.readFile(filePath);

    for (let i = 0; i <= retries; i++) {
      try {
        const response = await axios.post(
          `https://api-inference.huggingface.co/models/${model}`,
          audioData,
          {
            headers: {
              Authorization: `Bearer ${hfApiToken}`,
              "Content-Type": "audio/m4a",
            },
          }
        );

        //console.log("Transcription complete.");
        return response.data.text;
      } catch (error) {
        if (
          error.response &&
          error.response.data &&
          error.response.data.error &&
          error.response.data.error.includes("too busy")
        ) {
          console.error(
            `Attempt ${i + 1} failed: Model too busy. Retrying in ${delay / 1000} seconds...`
          );
          if (i < retries) {
            await new Promise((resolve) => setTimeout(resolve, delay));
          } else {
            throw new Error("Max retries reached. Unable to transcribe.");
          }
        } else {
          throw error;
        }
      }
    }
  } catch (finalError) {
    console.error("Final Error:", finalError.message || finalError);
    throw finalError;
  }
}

// Summarization Function
async function summarizeText(openAiApiKey, text) {
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
    console.error("Error summarizing text:", error.response?.data || error.message);
    throw error;
  }
}

// Process transcription in chunks and summarize
async function processAndSummarize(filePath) {
  try {
    // Step 1: Transcribe the audio
    const transcription = await transcribeAudio(filePath);

    // Step 2: Break transcription into 5-minute chunks (assuming ~1500 words per 5 minutes)
    const words = transcription.split(" ");
    const chunkSize = 1500; // Approximate word count for 5 minutes
    const chunks = [];

    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize).join(" "));
    }

    // Step 3: Summarize each chunk
    const summaries = [];
    for (const [index, chunk] of chunks.entries()) {
      console.log(`Summarizing chunk ${index + 1}/${chunks.length}...`);
      const summary = await summarizeText(openAiApiKey, chunk);
      summaries.push(summary);
    }

    // Step 4: Combine all summaries into a final summary
    const finalSummary = await summarizeText(openAiApiKey, summaries.join(" "));

    console.log("הנה הסיכום שלך:", finalSummary);
    return finalSummary;
  } catch (error) {
    console.error("Error processing and summarizing:", error);
    throw error;
  }
}

// Call the process function
processAndSummarize(filePath).catch((err) => console.error(err));