// config.js compatible for Vite and CRA

const envWsUrl =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_WS_URL) ||
  (typeof process !== "undefined" && process.env && process.env.REACT_APP_WS_URL) ||
  null;

const isDev =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DEV) ||
  (typeof process !== "undefined" && process.env && process.env.NODE_ENV === "development");

const originFallback =
  typeof window !== "undefined"
    ? `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}`
    : null;

export const WS_URL = envWsUrl || (isDev ? "ws://localhost:8080" : originFallback);
