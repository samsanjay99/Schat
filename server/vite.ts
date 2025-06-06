import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../client/config/vite.config";
import { nanoid } from "nanoid";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    // Disable HMR to prevent constant refreshing
    hmr: false,
    // Set to true to allow all hosts
    allowedHosts: true as true, // Type assertion to fix TypeScript error
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function servePublicAssets(app: Express) {
  try {
    const distPath = path.resolve(__dirname, "..", "dist", "public");
    console.log("Production: Serving static files from:", distPath);

    if (!fs.existsSync(distPath)) {
      console.error(
        `FATAL: Build directory not found: ${distPath}. Make sure the client has been built successfully.`
      );
      return;
    }

    try {
      const files = fs.readdirSync(distPath);
      console.log("Files in dist/public:", files);
      if (files.includes("static.css")) {
        console.log("Found static.css in dist/public.");
      } else {
        console.warn("WARNING: static.css NOT found in dist/public.");
      }
    } catch (err) {
      console.error("Error listing dist/public directory contents:", err);
    }

    app.use(express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (path.extname(filePath) === ".css") {
          res.setHeader("Cache-Control", "public, max-age=31536000");
        }
      },
    }));
  } catch (err) {
    console.error("Error in servePublicAssets setup:", err);
  }
}

export function serveSpaFallback(app: Express) {
  try {
    const indexPath = path.resolve(__dirname, "..", "dist", "public", "index.html");
    if (!fs.existsSync(indexPath)) {
      console.error(
        `FATAL: index.html not found at: ${indexPath}. Cannot serve SPA.`
      );
      app.use("*", (_req, res) => {
        res.status(404).send("Application not found. Missing index.html.");
      });
      return;
    }

    app.use("*", (_req, res) => {
      res.sendFile(indexPath);
    });
  } catch (err) {
    console.error("Error in serveSpaFallback setup:", err);
  }
}
