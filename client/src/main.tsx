import { createRoot } from "react-dom/client";
import App from "./App";

// Import CSS directly
import "./index.css";

// Log for debugging
console.log("Main.tsx loaded, CSS should be applied");

createRoot(document.getElementById("root")!).render(<App />);
