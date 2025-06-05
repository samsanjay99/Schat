/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./client/src/**/*.{js,jsx,ts,tsx}",
    "./client/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#128C7E",  // WhatsApp green
        secondary: "#075E54", // WhatsApp dark green
        accent: "#25D366",   // WhatsApp light green
      },
    },
  },
  plugins: [],
}; 