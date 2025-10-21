import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";
import App from "./App.tsx";
import { applyBranding } from "./utils/appBranding";

// Ensure fonts are loaded before rendering
if ("fonts" in document) {
  Promise.all([
    document.fonts.load("16px Electrolize"),
    document.fonts.load("16px Fredoka"),
  ]).catch(() => {
    // Fallback if font loading fails
    console.warn("Font loading failed, using fallback fonts");
  });
}

const rootElement = document.getElementById("root");
applyBranding();

if (!rootElement) {
  throw new Error("Failed to find the root element");
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
