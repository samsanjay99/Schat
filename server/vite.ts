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

export function serveStatic(app: Express) {
  try {
    const distPath = path.resolve(__dirname, "..", "dist", "public");
    
    console.log("Static files path:", distPath);
    
    // Create directories if they don't exist
    try {
      if (!fs.existsSync(distPath)) {
        fs.mkdirSync(distPath, { recursive: true });
        console.log("Created missing dist/public directory");
      }
    } catch (err) {
      console.error("Error creating directories:", err);
    }
    
    // Copy static.css to the dist directory if it exists
    try {
      const staticCssSource = path.resolve(__dirname, "..", "client", "src", "static.css");
      const staticCssTarget = path.resolve(distPath, "src");
      
      if (fs.existsSync(staticCssSource)) {
        if (!fs.existsSync(staticCssTarget)) {
          fs.mkdirSync(staticCssTarget, { recursive: true });
        }
        fs.copyFileSync(staticCssSource, path.resolve(staticCssTarget, "static.css"));
        console.log("Copied static.css to dist directory");
      } else {
        console.error("static.css source file not found:", staticCssSource);
      }
    } catch (err) {
      console.error("Error copying static.css:", err);
    }
    
    // Log the contents of the dist/public directory to help debug
    try {
      const files = fs.readdirSync(distPath);
      console.log("Files in dist/public:", files);
      
      // Check if src directory exists
      const srcPath = path.join(distPath, "src");
      if (fs.existsSync(srcPath)) {
        const srcFiles = fs.readdirSync(srcPath);
        console.log("Files in src directory:", srcFiles);
      } else {
        console.log("src directory not found");
      }
    } catch (err) {
      console.error("Error listing directory:", err);
    }

    // Serve static files with error handling
    app.use(express.static(distPath, {
      fallthrough: true,
      setHeaders: (res) => {
        res.setHeader('Cache-Control', 'no-cache');
      }
    }));
    
    // Special handler for static.css
    app.get('/src/static.css', (req, res) => {
      try {
        const cssPath = path.resolve(distPath, 'src', 'static.css');
        if (fs.existsSync(cssPath)) {
          res.setHeader('Content-Type', 'text/css');
          fs.createReadStream(cssPath).pipe(res);
        } else {
          console.error('static.css file not found at:', cssPath);
          res.status(404).send('CSS file not found');
        }
      } catch (err) {
        console.error('Error serving static.css:', err);
        res.status(500).send('Error serving CSS file');
      }
    });

    // fall through to index.html if the file doesn't exist
    app.use("*", (_req, res) => {
      try {
        const indexPath = path.resolve(distPath, "index.html");
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          console.error("index.html not found at:", indexPath);
          res.status(404).send("Page not found");
        }
      } catch (err) {
        console.error("Error serving index.html:", err);
        res.status(500).send("Internal server error");
      }
    });
  } catch (err) {
    console.error("Error in serveStatic:", err);
  }
}
