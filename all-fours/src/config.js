const envWsUrl = process.env.REACT_APP_WS_URL;

const originFallback =
	typeof window !== "undefined"
		? `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}`
		: null;

export const WS_URL = envWsUrl || originFallback;
