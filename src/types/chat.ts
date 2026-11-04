export interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
	sources?: string[];
	/** Client-side error placeholder, not an answer from the assistant. */
	isError?: boolean;
}

export interface ChatSession {
	id: string;
	title: string;
	messages: Message[];
}

export interface ChatHistoryItem {
	id: string;
	title: string;
	_id?: string;
	chatId?: string;
	name?: string;
	subject?: string;
	lastMessage?: string;
}

export interface SendMessageRequest {
	message: string;
	content: string;
	chatId?: string;
}

export interface SendMessageResponse {
	response?: string;
	answer?: string;
	content?: string;
	message?: string;
	text?: string;
	sources?: string[];
	chatId: string;
}
