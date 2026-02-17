// config.js (Vite-compatible)

const envWsUrl = import.meta.env.VITE_WS_URL;

const originFallback =
  typeof window !== "undefined"
    ? `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}`
    : null;

export const WS_URL =
  envWsUrl || (import.meta.env.DEV ? "ws://localhost:8080" : originFallback);