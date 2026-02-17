// config.js compatible for Vite and CRA

const envWsUrl =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_WS_URL) ||
  (typeof process !== "undefined" && process.env && process.env.REACT_APP_WS_URL) ||
  null;

const isDev =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DEV) ||
  (typeof process !== "undefined" && process.env && process.env.NODE_ENV === "development");


export const WS_URL =
  envWsUrl || (isDev ? "ws://localhost:8080" : "wss://allfoursapp.onrender.com");