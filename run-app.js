// Script to run the application with environment variables
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read environment variables from .env file
const envPath = resolve(__dirname, '.env');
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

// Set NODE_ENV
env.NODE_ENV = 'development';

// Combine with existing environment variables
const processEnv = { ...process.env, ...env };

// Run the application
console.log('Starting the application...');
console.log('Environment variables loaded from .env file');

const tsx = resolve(__dirname, 'node_modules', '.bin', 'tsx');
const server = spawn('node', [tsx, 'server/index.ts'], {
  env: processEnv,
  stdio: 'inherit',
  shell: true
});

server.on('error', (error) => {
  console.error('Failed to start the application:', error);
});

server.on('close', (code) => {
  if (code !== 0) {
    console.log(`Application process exited with code ${code}`);
  }
});
