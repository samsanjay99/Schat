import { defineConfig, PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Asynchronously load the cartographer plugin only if on Replit
async function getCartographerPlugin(): Promise<PluginOption[]> {
  if (process.env.REPL_ID !== undefined) {
    try {
      const cartographerModule = await import("@replit/vite-plugin-cartographer");
      return [cartographerModule.cartographer()];
    } catch (e) {
      console.warn("[Schat-Vite-Config] Failed to load @replit/vite-plugin-cartographer:", e);
      return [];
    }
  }
  return [];
}

export default defineConfig(async ({ command, mode }) => {
  const cartographerPlugins = await getCartographerPlugin();
  
  // Project root directory (two levels up from this file)
  const projectRoot = path.resolve(__dirname, '../..');

  return {
    plugins: [
      react(),
      runtimeErrorOverlay(),
      ...cartographerPlugins, // Spread the conditionally loaded plugin(s)
    ],
    resolve: {
      alias: {
        "@": path.resolve(projectRoot, "client", "src"),
        "@shared": path.resolve(projectRoot, "shared"),
        "@assets": path.resolve(projectRoot, "attached_assets"),
      },
    },
    root: path.resolve(projectRoot, "client"),
    build: {
      outDir: path.resolve(projectRoot, "dist/public"),
      emptyOutDir: true,
    },
  };
});
