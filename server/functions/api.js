// Netlify serverless function for API routes
const express = require('express');
const serverless = require('serverless-http');
const path = require('path');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const { registerRoutes } = require('../../dist/index.js');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Create HTTP server
const server = createServer(app);

// Setup WebSocket server for real-time chat
const wss = new WebSocketServer({ server });

// Register all routes
registerRoutes(app, server, wss);

// Export the serverless handler
module.exports.handler = serverless(app);
