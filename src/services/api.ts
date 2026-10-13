import axios from "axios";
import { APP_CONFIG } from "../config/constants";
import type { LoginCredentials, RegisterData } from "../types/auth";
import { STORAGE_KEYS } from "../types/storage";

const DEFAULT_TIMEOUT_MS = 15000;
// The /chat endpoint triggers retrieval + LLM generation on the backend,
// which can legitimately take longer than a plain CRUD request.
const CHAT_TIMEOUT_MS = 60000;

// Auth now rides on an httpOnly session cookie set by the backend (Set-Cookie
// on /login and /register) instead of a token we read/write ourselves. The
// browser attaches it automatically as long as every request carries
// credentials — the token itself is never visible to JS, which is the whole
// point (an XSS payload can no longer read it out of localStorage).
const CSRF_COOKIE_NAME = "csrfToken";
const CSRF_HEADER_NAME = "X-CSRF-Token";
const CSRF_PROTECTED_METHODS = new Set(["post", "delete"]);

function readCsrfCookie(): string | null {
	const match = document.cookie.match(
		new RegExp(`(?:^|;\\s*)${CSRF_COOKIE_NAME}=([^;]*)`),
	);
	return match ? decodeURIComponent(match[1]) : null;
}

const api = axios.create({
	baseURL: APP_CONFIG.API_URL,
	timeout: DEFAULT_TIMEOUT_MS,
	withCredentials: true,
});

api.interceptors.request.use((config) => {
	const method = config.method?.toLowerCase();
	const isChatRoute = config.url?.startsWith("/chat");

	if (method && isChatRoute && CSRF_PROTECTED_METHODS.has(method)) {
		const csrfToken = readCsrfCookie();
		if (csrfToken) {
			config.headers[CSRF_HEADER_NAME] = csrfToken;
		}
	}

	return config;
});

api.interceptors.response.use(
	(response) => response,
	(error) => {
		const isAuthRequest =
			error.config?.url?.endsWith("/login") ||
			error.config?.url?.endsWith("/register");

		if (error.response?.status === 401 && !isAuthRequest) {
			localStorage.removeItem(STORAGE_KEYS.USER);
			window.location.href = "/login";
		}
		return Promise.reject(error);
	},
);

export const authService = {
	async login(credentials: LoginCredentials) {
		const response = await api.post("/login", credentials);
		return response.data;
	},

	async register(data: RegisterData) {
		const response = await api.post("/register", data);
		return response.data;
	},

	async logout() {
		await api.post("/logout");
	},
};

import type {
	ChatHistoryItem,
	ChatSession,
	SendMessageRequest,
	SendMessageResponse,
} from "../types/chat";

export const chatService = {
	async sendMessage(message: string, chatId?: string | null) {
		const payload: SendMessageRequest = {
			message,
			content: message,
		};
		if (chatId) {
			payload.chatId = chatId;
		}

		const response = await api.post<SendMessageResponse>("/chat", payload, {
			timeout: CHAT_TIMEOUT_MS,
		});
		return response.data;
	},

	async getChat(id: string) {
		const response = await api.get<ChatSession>(`/chat/${id}`);
		return response.data;
	},

	async getHistory() {
		const response = await api.get<
			ChatHistoryItem[] | { [key: string]: ChatHistoryItem[] }
		>("/chats");
		return response.data;
	},

	async deleteChat(id: string) {
		await api.delete(`/chat/${id}`);
	},
};

export default api;
