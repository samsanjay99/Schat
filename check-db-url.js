// Script to check the DATABASE_URL environment variable
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read environment variables from .env file
const envPath = path.resolve(__dirname, '.env');

console.log('Checking DATABASE_URL environment variable...');
console.log('Looking for .env file at:', envPath);

try {
  if (fs.existsSync(envPath)) {
    console.log('.env file found');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Parse environment variables
    const env = {};
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        env[key] = value;
      }
    });
    
    // Check if DATABASE_URL exists
    if (env.DATABASE_URL) {
      console.log('DATABASE_URL found in .env file');
      // Print first few characters for security
      console.log('DATABASE_URL starts with:', env.DATABASE_URL.substring(0, 20) + '...');
      
      // Manually set the environment variable
      process.env.DATABASE_URL = env.DATABASE_URL;
      console.log('DATABASE_URL set in process.env');
      
      // Check if it's set correctly
      console.log('process.env.DATABASE_URL starts with:', 
        process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 20) + '...' : 'undefined');
    } else {
      console.error('DATABASE_URL not found in .env file');
      console.log('Available environment variables in .env:');
      Object.keys(env).forEach(key => {
        console.log(`- ${key}`);
      });
    }
  } else {
    console.error('.env file not found');
  }
} catch (error) {
  console.error('Error reading .env file:', error.message);
}
