import { createRoot } from "react-dom/client";
import App from "./App";

// No need to import CSS as it's included directly in the HTML
// Log for debugging
console.log("Main.tsx loaded - using static CSS");

createRoot(document.getElementById("root")!).render(<App />);
