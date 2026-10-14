import axios, { type InternalAxiosRequestConfig } from "axios";
import { APP_CONFIG } from "../config/constants";
import type {
	AuthResponse,
	LoginCredentials,
	RegisterData,
} from "../types/auth";
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

// The backend returns the CSRF token in the /login body and on GET /csrf as
// well as in the csrfToken cookie: when the API is on a different host than
// the frontend, document.cookie only exposes the frontend's own cookies, so
// the cookie alone would leave every POST/DELETE /chat failing with 403.
let csrfToken: string | null = null;
// In-flight GET /csrf, so a POST fired right after a reload waits for it
// instead of going out without the header.
let csrfRestore: Promise<void> | null = null;

function restoreCsrfToken() {
	csrfRestore ??= api
		.get<{ csrfToken: string }>("/csrf")
		.then((response) => {
			csrfToken = response.data.csrfToken;
		})
		.finally(() => {
			csrfRestore = null;
		});
	return csrfRestore;
}

interface CsrfRetryConfig extends InternalAxiosRequestConfig {
	csrfRetried?: boolean;
}

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

api.interceptors.request.use(async (config) => {
	const method = config.method?.toLowerCase();
	const isChatRoute = config.url?.startsWith("/chat");

	if (method && isChatRoute && CSRF_PROTECTED_METHODS.has(method)) {
		if (csrfRestore) {
			// A failed restore is recovered by the 403 retry below.
			await csrfRestore.catch(() => undefined);
		}
		const token = csrfToken ?? readCsrfCookie();
		if (token) {
			config.headers[CSRF_HEADER_NAME] = token;
		}
	}

	return config;
});

api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const config = error.config as CsrfRetryConfig | undefined;
		// The in-memory token can be missing (restore failed) or stale (a
		// login in another tab rotated the cookie): fetch it again and retry
		// once instead of failing every write until the page is reloaded.
		if (
			error.response?.status === 403 &&
			error.response.data?.code === "CSRF_INVALID" &&
			config &&
			!config.csrfRetried
		) {
			config.csrfRetried = true;
			csrfToken = null;
			await restoreCsrfToken();
			config.headers[CSRF_HEADER_NAME] = csrfToken;
			return api(config);
		}

		const isAuthRequest =
			error.config?.url?.endsWith("/login") ||
			error.config?.url?.endsWith("/register");

		if (error.response?.status === 401 && !isAuthRequest) {
			csrfToken = null;
			localStorage.removeItem(STORAGE_KEYS.TOKEN);
			localStorage.removeItem(STORAGE_KEYS.USER);
			window.location.href = "/login";
		}
		return Promise.reject(error);
	},
);

export const authService = {
	async login(credentials: LoginCredentials) {
		const response = await api.post<AuthResponse>("/login", credentials);
		csrfToken = response.data.csrfToken ?? null;
		return response.data;
	},

	restoreCsrfToken,

	async register(data: RegisterData) {
		const response = await api.post("/register", data);
		return response.data;
	},

	async logout() {
		try {
			await api.post("/logout");
		} finally {
			csrfToken = null;
		}
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

/** Test-only: module state would otherwise leak between test cases. */
export function resetCsrfStateForTests() {
	csrfToken = null;
	csrfRestore = null;
}

export default api;
