export const APP_CONFIG = {
	API_URL: import.meta.env.VITE_API_URL || "http://localhost:3333",
	APP_NAME: "Castanha",
	VERSION: "1.0.0",
};

export const UI_CONFIG = {
	ANIMATION_DURATION: 300,
	MAX_CHAT_HISTORY: 50,
	MAX_TEXTAREA_HEIGHT: 200,
};

// Shown when an assistant answer comes without its own sources (fallback
// answers, or messages saved before the backend persisted sources): every
// answer must point somewhere the student can confirm the information.
export const DEFAULT_SOURCE_URL = "https://www.ifnmg.edu.br";
