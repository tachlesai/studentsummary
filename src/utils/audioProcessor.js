import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

class AudioProcessor {
  constructor() {
    this.ffmpeg = null;
    this.initialized = false;
    this.maxFileSize = 1024 * 1024 * 1024; // 1GB limit
    this.allowedTypes = ['video/mp4', 'video/quicktime', 'audio/mpeg', 'audio/wav', 'audio/mp4'];
    this.processingChunkSize = 100 * 1024 * 1024; // 100MB chunks
  }

  async initialize() {
    if (this.initialized) return;

    try {
      this.ffmpeg = new FFmpeg();
      
      // Load FFmpeg core with shared memory
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        workerURL: await toBlobURL(`${baseURL}/ffmpeg-worker.js`, 'text/javascript'),
      });

      this.initialized = true;
      console.log('[AudioProcessor] FFmpeg initialized successfully');
    } catch (error) {
      console.error('[AudioProcessor] Initialization error:', error);
      throw new Error('Failed to initialize audio processor');
    }
  }

  validateFile(file) {
    // Check file size
    if (file.size > this.maxFileSize) {
      throw new Error(`File size exceeds limit of ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    // Check file type
    if (!this.allowedTypes.includes(file.type)) {
      throw new Error('Unsupported file type. Please upload MP4, MOV, MP3, WAV, or M4A files');
    }

    // Check for malicious file names
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    if (safeFileName !== file.name) {
      throw new Error('Invalid file name. Please use only letters, numbers, dots, and hyphens');
    }
  }

  async processAudio(file, onProgress) {
    try {
      // Validate file
      this.validateFile(file);

      // Initialize if needed
      if (!this.initialized) {
        await this.initialize();
      }

      // Generate a secure random name for the output file
      const outputFileName = `processed_${crypto.randomUUID()}.mp3`;
      
      // Process in chunks if file is large
      if (file.size > this.processingChunkSize) {
        console.log('[AudioProcessor] Large file detected, processing in chunks...');
        return await this.processLargeFile(file, outputFileName, onProgress);
      }

      // For smaller files, process normally
      console.log('[AudioProcessor] Processing file...');
      await this.ffmpeg.writeFile(file.name, await fetchFile(file));

      await this.ffmpeg.exec([
        '-i', file.name,
        '-vn', // No video
        '-acodec', 'libmp3lame', // Use MP3 codec
        '-ab', '64k', // Lower bitrate
        '-ar', '22050', // Lower sample rate
        '-y', // Overwrite output file if exists
        outputFileName
      ]);

      // Read the processed file
      const data = await this.ffmpeg.readFile(outputFileName);
      
      // Clean up
      await this.ffmpeg.deleteFile(file.name);
      await this.ffmpeg.deleteFile(outputFileName);

      // Convert to blob
      const blob = new Blob([data], { type: 'audio/mpeg' });
      
      console.log('[AudioProcessor] Audio processing complete');
      return blob;
    } catch (error) {
      console.error('[AudioProcessor] Processing error:', error);
      throw new Error(`Failed to process audio file: ${error.message}`);
    }
  }

  async processLargeFile(file, outputFileName, onProgress) {
    try {
      const totalChunks = Math.ceil(file.size / this.processingChunkSize);
      let processedChunks = 0;
      const chunks = [];

      // Process file in chunks
      for (let start = 0; start < file.size; start += this.processingChunkSize) {
        const end = Math.min(start + this.processingChunkSize, file.size);
        const chunk = file.slice(start, end);
        const chunkName = `chunk_${processedChunks}.mp3`;

        // Process chunk
        await this.ffmpeg.writeFile(chunkName, await fetchFile(chunk));
        await this.ffmpeg.exec([
          '-i', chunkName,
          '-vn',
          '-acodec', 'libmp3lame',
          '-ab', '64k',
          '-ar', '22050',
          '-y',
          `processed_${chunkName}`
        ]);

        // Read processed chunk
        const chunkData = await this.ffmpeg.readFile(`processed_${chunkName}`);
        chunks.push(chunkData);

        // Clean up chunk files
        await this.ffmpeg.deleteFile(chunkName);
        await this.ffmpeg.deleteFile(`processed_${chunkName}`);

        // Update progress
        processedChunks++;
        if (onProgress) {
          onProgress((processedChunks / totalChunks) * 100);
        }
      }

      // Combine all chunks
      const combinedData = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
      let offset = 0;
      for (const chunk of chunks) {
        combinedData.set(chunk, offset);
        offset += chunk.length;
      }

      return new Blob([combinedData], { type: 'audio/mpeg' });
    } catch (error) {
      console.error('[AudioProcessor] Large file processing error:', error);
      throw new Error(`Failed to process large file: ${error.message}`);
    }
  }

  async cleanup() {
    if (this.ffmpeg) {
      try {
        await this.ffmpeg.terminate();
        this.initialized = false;
        console.log('[AudioProcessor] Cleanup complete');
      } catch (error) {
        console.error('[AudioProcessor] Cleanup error:', error);
      }
    }
  }
}

// Create a singleton instance
const audioProcessor = new AudioProcessor();
export default audioProcessor; 