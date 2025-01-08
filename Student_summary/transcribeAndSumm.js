import axios from "axios";
import fs from "fs/promises"; // Use `fs/promises` for async file operations
import OpenAI from "openai";
import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import path from 'path';

const hfApiToken = "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"; // Replace with your Hugging Face token
const openAiApiKey = "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"; // Replace with your OpenAI API key
const model = "openai/whisper-large-v3";
const filePath = "C:/Users/shoti/Downloads/WhatsApp Audio 2024-11-27 at 16.40.50_7e005c9f.mp3";
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
      model: "gpt-4o-mini",
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
    const finalSummary = summaries.join("\n");

    console.log("הנה הסיכום שלך:", finalSummary);
    return finalSummary;
  } catch (error) {
    console.error("Error processing and summarizing:", error);
    throw error;
  }
}

// Function to generate PDF with Hebrew text
async function generatePDFWithHebrew(summaryText, outputFilePath) {
  try {
    // Load the font file (replace with the path to your Hebrew font)
    const fontBytes = await fs.readFile('C:/Users/shoti/studentsummary/Student_summary/fonts/Noto_Sans_Hebrew/static/NotoSansHebrew-Thin.ttf');

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    // Register the fontkit instance
    pdfDoc.registerFontkit(fontkit);

    // Embed the Hebrew font
    const customFont = await pdfDoc.embedFont(fontBytes);

    // Add a page and write Hebrew text
    const page = pdfDoc.addPage([600, 800]); // Page dimensions: width x height
    const fontSize = 12;
    const margin = 50;
    const textWidth = page.getWidth() - 2 * margin;
    const words = summaryText.split(' ');
    let line = '';
    let y = page.getHeight() - margin;

    for (const word of words) {
      const testLine = line + word + ' ';
      const lineWidth = customFont.widthOfTextAtSize(testLine, fontSize);

      if (lineWidth > textWidth) {
        // Draw the current line and start a new one
        page.drawText(line, { x: margin, y, size: fontSize, font: customFont, direction: 'rtl' });
        line = word + ' ';
        y -= fontSize + 4;

        if (y < margin) {
          // Add a new page if out of space
          page = pdfDoc.addPage([600, 800]);
          y = page.getHeight() - margin;
        }
      } else {
        line = testLine;
      }
    }

    // Draw the remaining line
    if (line) {
      page.drawText(line, { x: margin, y, size: fontSize, font: customFont, direction: 'rtl' });
    }

    // Serialize the PDF document to bytes
    const pdfBytes = await pdfDoc.save();

    // Write the PDF to the specified output file
    await fs.writeFile(outputFilePath, pdfBytes);

    console.log(`PDF with Hebrew text created successfully: ${outputFilePath}`);
  } catch (error) {
    console.error('Error generating PDF with Hebrew:', error);
    throw error;
  }
}

// Main function to process the summary and create a Hebrew PDF
async function processSummaryAndCreateHebrewPDF(filePath) {
  try {
    // Step 1: Process and summarize
    const summaryText = await processAndSummarize(filePath);

    // Step 2: Specify the output PDF file path
    const outputDir = path.join(process.cwd(), 'outputs');
    const outputFilePath = path.join(outputDir, 'summary-hebrew.pdf');

    // Ensure the output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Step 3: Generate the Hebrew PDF
    await generatePDFWithHebrew(summaryText, outputFilePath);

    console.log('Hebrew summary has been saved as a PDF.');
  } catch (error) {
    console.error('Error processing summary and creating Hebrew PDF:', error);
  }
}

// Run the process
processSummaryAndCreateHebrewPDF(filePath).catch((err) => console.error(err));
