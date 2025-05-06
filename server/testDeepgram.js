import { createClient } from '@deepgram/sdk';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '.env');
dotenv.config({ path: envPath });

console.log(`Loading environment from: ${envPath}`);
console.log('Testing Deepgram API connection...');

// Get API key
const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
if (!deepgramApiKey) {
  console.error('Error: No Deepgram API key found in .env file');
  process.exit(1);
}

console.log(`API key found: ${deepgramApiKey.substring(0, 5)}...`);

// Create Deepgram client
try {
  const deepgram = createClient(deepgramApiKey);
  console.log('Deepgram client created successfully');
  
  // Make a simple API call to check connection
  console.log('Making test API call to Deepgram...');
  
  // Simple test using the version endpoint
  deepgram.version.get()
    .then((response) => {
      console.log('Deepgram API connected successfully!');
      console.log('API Response:', response);
      
      // Check account balance
      console.log('\nChecking account balance...');
      return deepgram.manage.getBalance();
    })
    .then((balance) => {
      console.log('Account balance:', balance);
      console.log('\nDeepgram API is working correctly!');
    })
    .catch((error) => {
      console.error('Error connecting to Deepgram API:', error);
    });
  
} catch (error) {
  console.error('Error creating Deepgram client:', error);
} 