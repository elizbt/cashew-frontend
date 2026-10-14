import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { chatService } from "../services/api";
import type { ChatHistoryItem, Message } from "../types/chat";
import { STORAGE_KEYS } from "../types/storage";
import { useAuth } from "./AuthContext";

interface ChatContextType {
	messages: Message[];
	currentChatId: string | null;
	chatHistory: ChatHistoryItem[];
	isLoading: boolean;
	sendMessage: (content: string) => Promise<void>;
	startNewChat: () => void;
	loadChat: (id: string) => Promise<void>;
	deleteChat: (id: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ApiErrorResponse {
	response?: {
		status?: number;
		data?: unknown;
	};
}

// crypto.randomUUID only exists in secure contexts (HTTPS or localhost);
// opening the dev server by LAN IP over plain HTTP would otherwise throw
// before sendMessage's try block and silently drop the message.
let fallbackIdCounter = 0;

function createMessageId() {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
		return crypto.randomUUID();
	}
	fallbackIdCounter += 1;
	return `msg-${Date.now()}-${fallbackIdCounter}`;
}

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const { isAuthenticated } = useAuth();
	const [messages, setMessages] = useState<Message[]>([]);
	const [currentChatId, setCurrentChatId] = useState<string | null>(null);
	const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const loadHistory = useCallback(async () => {
		if (!isAuthenticated) return;

		try {
			const data = await chatService.getHistory();

			let historyArray: ChatHistoryItem[] = [];
			if (Array.isArray(data)) {
				historyArray = data;
			} else if (data && typeof data === "object") {
				const foundArray = Object.values(data).find((val) =>
					Array.isArray(val),
				);
				if (foundArray) {
					historyArray = foundArray as ChatHistoryItem[];
				} else if (Object.keys(data).length === 0) {
					historyArray = [];
				}
			}

			const normalizedHistory: ChatHistoryItem[] = historyArray.map(
				(item: ChatHistoryItem) => ({
					id: item.id || item._id || item.chatId || String(Math.random()),
					title:
						item.title ||
						item.name ||
						item.subject ||
						item.lastMessage ||
						"Conversa sem título",
				}),
			);

			setChatHistory(normalizedHistory);
			localStorage.setItem(
				STORAGE_KEYS.HISTORY,
				JSON.stringify(normalizedHistory),
			);
		} catch (error) {
			console.error("Failed to load history from server:", error);
			const savedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
			if (savedHistory) {
				setChatHistory(JSON.parse(savedHistory));
			}
		}
	}, [isAuthenticated]);

	const saveToHistoryOptimistic = useCallback((id: string, title: string) => {
		setChatHistory((prev) => {
			const exists = prev.find((item) => item.id === id);
			if (exists) return prev;
			const newHistory = [{ id, title }, ...prev];
			localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(newHistory));
			return newHistory;
		});
	}, []);

	const loadChat = useCallback(
		async (id: string) => {
			if (!isAuthenticated) return;

			setIsLoading(true);
			try {
				const data = await chatService.getChat(id);
				const loadedMessages = (data.messages || []).map((msg) => ({
					...msg,
					id: msg.id || createMessageId(),
				}));
				setMessages(loadedMessages);
				setCurrentChatId(id);
				localStorage.setItem(STORAGE_KEYS.LAST_CHAT_ID, id);
			} catch (error) {
				console.error("Failed to load chat:", error);
				localStorage.removeItem(STORAGE_KEYS.LAST_CHAT_ID);
			} finally {
				setIsLoading(false);
			}
		},
		[isAuthenticated],
	);

	const startNewChat = useCallback(() => {
		setMessages([]);
		setCurrentChatId(null);
		localStorage.removeItem(STORAGE_KEYS.LAST_CHAT_ID);
	}, []);

	useEffect(() => {
		if (isAuthenticated) {
			loadHistory();
			const lastChatId = localStorage.getItem(STORAGE_KEYS.LAST_CHAT_ID);
			if (lastChatId) {
				loadChat(lastChatId);
			}
		} else {
			setMessages([]);
			setChatHistory([]);
			setCurrentChatId(null);
		}
	}, [isAuthenticated, loadHistory, loadChat]);

	useEffect(() => {
		if (currentChatId && messages.length > 0) {
			localStorage.setItem(
				STORAGE_KEYS.CHAT_CACHE(currentChatId),
				JSON.stringify(messages),
			);
		}
	}, [messages, currentChatId]);

	const sendMessage = async (content: string) => {
		const userMessage: Message = {
			id: createMessageId(),
			role: "user",
			content,
		};
		setMessages((prev) => [...prev, userMessage]);
		setIsLoading(true);

		try {
			const data = await chatService.sendMessage(
				content,
				currentChatId || undefined,
			);

			let responseContent =
				data.response ||
				data.answer ||
				data.content ||
				data.message ||
				data.text ||
				"";

			if (typeof responseContent === "object" && responseContent !== null) {
				responseContent = JSON.stringify(responseContent);
			}

			if (!responseContent && !data.sources) {
				responseContent = "O assistente não retornou nenhuma resposta textual.";
			}

			const assistantMessage: Message = {
				id: createMessageId(),
				role: "assistant",
				content: String(responseContent),
				sources: Array.isArray(data.sources) ? data.sources : [],
			};

			setMessages((prev) => [...prev, assistantMessage]);

			if (!currentChatId && data.chatId) {
				setCurrentChatId(data.chatId);
				localStorage.setItem(STORAGE_KEYS.LAST_CHAT_ID, data.chatId);
				saveToHistoryOptimistic(data.chatId, content.substring(0, 30));
				setTimeout(() => loadHistory(), 1000);
			}
		} catch (error: unknown) {
			const err = error as ApiErrorResponse;
			const errorMessage: Message = {
				id: createMessageId(),
				role: "assistant",
				content: `Erro ${err.response?.status || ""}: Não foi possível obter resposta do servidor. Verifique se o backend está rodando corretamente.`,
			};
			setMessages((prev) => [...prev, errorMessage]);
		} finally {
			setIsLoading(false);
		}
	};

	const deleteChat = async (id: string) => {
		const originalHistory = [...chatHistory];

		try {
			const newHistory = chatHistory.filter((item) => item.id !== id);
			setChatHistory(newHistory);
			localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(newHistory));
			localStorage.removeItem(STORAGE_KEYS.CHAT_CACHE(id));

			if (currentChatId === id) {
				startNewChat();
			}

			await chatService.deleteChat(id);
		} catch (error: unknown) {
			console.error("Failed to delete chat on server:", error);

			setChatHistory(originalHistory);
			localStorage.setItem(
				STORAGE_KEYS.HISTORY,
				JSON.stringify(originalHistory),
			);

			alert(
				"Não foi possível excluir a conversa no servidor. O histórico foi restaurado.",
			);
		}
	};

	return (
		<ChatContext.Provider
			value={{
				messages,
				currentChatId,
				chatHistory,
				isLoading,
				sendMessage,
				startNewChat,
				loadChat,
				deleteChat,
			}}
		>
			{children}
		</ChatContext.Provider>
	);
};

export const useChat = () => {
	const context = useContext(ChatContext);
	if (context === undefined) {
		throw new Error("useChat must be used within a ChatProvider");
	}
	return context;
};
