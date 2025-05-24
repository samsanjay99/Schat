// Simple script to load environment variables and run the application
import { execSync } from 'child_process';
import fs from 'fs';

try {
  // Read the .env file
  const envContent = fs.readFileSync('./.env', 'utf8');
  
  // Create a command that sets all environment variables and runs the application
  let command = '';
  
  // Set NODE_ENV
  command += 'set NODE_ENV=development && ';
  
  // Add each environment variable from .env
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      command += `set ${key}=${value} && `;
    }
  });
  
  // Add the command to run the application
  command += 'npx tsx server/index.ts';
  
  console.log('Starting application with environment variables...');
  
  // Execute the command
  execSync(command, { stdio: 'inherit' });
} catch (error) {
  console.error('Error:', error.message);
}
