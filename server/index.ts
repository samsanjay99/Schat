import express, { type Request, type Response, type NextFunction } from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import http from "http";
import { serveStatic, setupVite } from "./vite";
import { registerRoutes } from "./routes";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const PORT = process.env.PORT || 3000;

async function main() {
  try {
    console.log(`Starting server in ${IS_PRODUCTION ? "production" : "development"} mode`);
    
    const app = express();

    // Add essential middleware for parsing request bodies
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    // Register all API routes and get the server instance (which includes WebSocket setup)
    // This must happen before Vite/static serving setup
    const server = await registerRoutes(app);

    // Generic error handling middleware (add after API routes)
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Unhandled error:", err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });
    
    // Setup frontend serving (Vite dev server or static files)
    // This comes after API routes so they take precedence
    if (IS_PRODUCTION) {
      console.log("Setting up production static file serving");
      serveStatic(app);
    } else {
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
    console.error("Server error during startup:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
