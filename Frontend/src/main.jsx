import { StrictMode } from "react";
import { Buffer } from "buffer";
// Provide global Buffer for libs that expect Node Buffer in browser
if (typeof window !== "undefined" && !window.Buffer) {
  window.Buffer = Buffer;
}
import { createRoot } from "react-dom/client";
import axios from "axios";
import "./index.css";
import App from "./App.jsx";

axios.defaults.withCredentials = true;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
