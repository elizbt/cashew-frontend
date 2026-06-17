import axios from "axios";
import { APP_CONFIG } from "../config/constants";
import type { LoginCredentials, RegisterData } from "../types/auth";
import { STORAGE_KEYS } from "../types/storage";

const api = axios.create({
	baseURL: APP_CONFIG.API_URL,
});

api.interceptors.request.use((config) => {
	const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			localStorage.removeItem(STORAGE_KEYS.TOKEN);
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

		const response = await api.post<SendMessageResponse>("/chat", payload);
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
