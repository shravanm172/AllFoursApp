// src/utils/logger.js

// Works in Vite (import.meta.env) and in webpack/CRA (process.env)
const DEBUG =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.DEV) ||
  (typeof process !== "undefined" &&
    process.env &&
    process.env.NODE_ENV !== "production");

// Optional: allow forcing logs in prod via localStorage.DEBUG_LOGS="1"
let FORCE = false;
try {
  FORCE =
    typeof window !== "undefined" &&
    window.localStorage.getItem("DEBUG_LOGS") === "1";
} catch {
  FORCE = false;
}

export const LOG_ENABLED = Boolean(DEBUG || FORCE);

export function log(...args) {
  if (LOG_ENABLED) console.log(...args);
}
export function info(...args) {
  if (LOG_ENABLED) console.info(...args);
}
export function debug(...args) {
  if (LOG_ENABLED) console.debug(...args);
}
export function warn(...args) {
  console.warn(...args);
}
export function error(...args) {
  console.error(...args);
}
