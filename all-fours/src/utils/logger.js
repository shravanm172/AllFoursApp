// src/utils/logger.js

// Vite: true in dev, false in prod builds
const DEBUG = import.meta.env.DEV;

// To allow manually forcing logs on in prod for quick diagnosis:
// set localStorage.DEBUG_LOGS = "1" in browser console
const FORCE = typeof window !== "undefined" && window.localStorage?.getItem("DEBUG_LOGS") === "1";

export const LOG_ENABLED = DEBUG || FORCE;

export function log(...args) {
  if (LOG_ENABLED) console.log(...args);
}

export function info(...args) {
  if (LOG_ENABLED) console.info(...args);
}

export function debug(...args) {
  if (LOG_ENABLED) console.debug(...args);
}

// Usually keep warnings/errors always on (they matter in prod)
export function warn(...args) {
  console.warn(...args);
}

export function error(...args) {
  console.error(...args);
}
