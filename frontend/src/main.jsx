import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import "./design-system/tokens.css";
import "./design-system/styles.css";
import App from "./App.jsx";
import { LanguageProvider } from "./i18n/LanguageContext.jsx";
import { ToastProvider } from "./design-system";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <LanguageProvider>
      <ToastProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ToastProvider>
    </LanguageProvider>
  </StrictMode>
);
