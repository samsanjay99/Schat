import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import http from "http";
import { serveStatic, setupVite } from "./vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const PORT = process.env.PORT || 3000;

async function main() {
  try {
    console.log(`Starting server in ${IS_PRODUCTION ? "production" : "development"} mode`);
    
    const app = express();
    const server = http.createServer(app);
    
    // In production, serve static files
    if (IS_PRODUCTION) {
      console.log("Setting up production static file serving");
      serveStatic(app);
    } else {
      // In development, use Vite's dev server
      console.log("Setting up development server with Vite");
      await setupVite(app, server);
    }

    // Simple health check endpoint
    app.get("/api/health", (_req, res) => {
      res.json({ status: "ok" });
    });
    
    // Start the server
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
    
    // Handle shutdown gracefully
    const shutdown = () => {
      console.log("Shutting down server...");
      server.close(() => {
        console.log("Server stopped");
        process.exit(0);
      });
    };
    
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    
  } catch (error) {
    console.error("Server error:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
