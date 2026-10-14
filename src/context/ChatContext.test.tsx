import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "../types/storage";
import { AuthProvider } from "./AuthContext";
import { ChatProvider, useChat } from "./ChatContext";

vi.mock("../services/api", () => ({
	authService: { restoreCsrfToken: vi.fn().mockResolvedValue(undefined) },
	chatService: {
		getHistory: vi.fn(),
		getChat: vi.fn(),
		sendMessage: vi.fn(),
		deleteChat: vi.fn(),
	},
}));

import { chatService } from "../services/api";

const mockedChatService = vi.mocked(chatService);

function seedSession() {
	localStorage.setItem(STORAGE_KEYS.TOKEN, "tok");
	localStorage.setItem(
		STORAGE_KEYS.USER,
		JSON.stringify({ id: "1", name: "Ana", email: "ana@test.com" }),
	);
}

function wrapper({ children }: { children: ReactNode }) {
	return (
		<AuthProvider>
			<ChatProvider>{children}</ChatProvider>
		</AuthProvider>
	);
}

async function renderAuthedChat() {
	seedSession();
	mockedChatService.getHistory.mockResolvedValue([]);
	const { result } = renderHook(() => useChat(), { wrapper });
	await waitFor(() => expect(mockedChatService.getHistory).toHaveBeenCalled());
	return result;
}

describe("useChat outside provider", () => {
	it("throws when used without a ChatProvider", () => {
		// React logs the render error to console.error even though we catch it below.
		vi.spyOn(console, "error").mockImplementation(() => {});
		expect(() => renderHook(() => useChat())).toThrow(
			"useChat must be used within a ChatProvider",
		);
	});
});

describe("ChatContext.loadHistory normalization", () => {
	beforeEach(() => {
		seedSession();
	});

	it("accepts a plain array response", async () => {
		mockedChatService.getHistory.mockResolvedValue([{ id: "1", title: "Oi" }]);
		const { result } = renderHook(() => useChat(), { wrapper });

		await waitFor(() => expect(result.current.chatHistory).toHaveLength(1));
		expect(result.current.chatHistory[0]).toMatchObject({
			id: "1",
			title: "Oi",
		});
	});

	it("unwraps an object response whose first array-valued property is the list", async () => {
		mockedChatService.getHistory.mockResolvedValue({
			// `title` is intentionally omitted here: this simulates a raw backend
			// item that hasn't gone through normalization yet, exercising the
			// `name` fallback in loadHistory's field-guessing chain.
			// @ts-expect-error - raw pre-normalization payload shape
			chats: [{ id: "2", name: "Fallback name field" }],
		});
		const { result } = renderHook(() => useChat(), { wrapper });

		await waitFor(() => expect(result.current.chatHistory).toHaveLength(1));
		expect(result.current.chatHistory[0].title).toBe("Fallback name field");
	});

	it("falls back to an empty list for an empty object response", async () => {
		mockedChatService.getHistory.mockResolvedValue({});
		const { result } = renderHook(() => useChat(), { wrapper });

		await waitFor(() =>
			expect(mockedChatService.getHistory).toHaveBeenCalled(),
		);
		expect(result.current.chatHistory).toEqual([]);
	});

	it("falls back to cached localStorage history when the request fails", async () => {
		localStorage.setItem(
			STORAGE_KEYS.HISTORY,
			JSON.stringify([{ id: "cached", title: "Do cache" }]),
		);
		mockedChatService.getHistory.mockRejectedValue(new Error("network down"));

		const { result } = renderHook(() => useChat(), { wrapper });

		await waitFor(() => expect(result.current.chatHistory).toHaveLength(1));
		expect(result.current.chatHistory[0].id).toBe("cached");
	});
});

describe("ChatContext.sendMessage", () => {
	it("appends the user message optimistically, then the assistant reply", async () => {
		const result = await renderAuthedChat();
		mockedChatService.sendMessage.mockResolvedValue({
			response: "Resposta da Castanha",
			chatId: "chat-1",
		});

		await act(async () => {
			await result.current.sendMessage("Oi Castanha");
		});

		expect(result.current.messages).toHaveLength(2);
		expect(result.current.messages[0]).toMatchObject({
			role: "user",
			content: "Oi Castanha",
		});
		expect(result.current.messages[0].id).toEqual(expect.any(String));
		expect(result.current.messages[1]).toMatchObject({
			role: "assistant",
			content: "Resposta da Castanha",
		});
		expect(result.current.messages[1].id).toEqual(expect.any(String));
		expect(result.current.messages[0].id).not.toBe(
			result.current.messages[1].id,
		);
	});

	it("resolves the reply through the answer/content/message/text fallback chain", async () => {
		const result = await renderAuthedChat();
		mockedChatService.sendMessage.mockResolvedValue({
			text: "via text field",
			chatId: "c1",
		});

		await act(async () => {
			await result.current.sendMessage("oi");
		});

		expect(result.current.messages[1].content).toBe("via text field");
	});

	it("stringifies a non-string response payload instead of rendering [object Object]", async () => {
		const result = await renderAuthedChat();
		// `SendMessageResponse.response` is typed as `string`, but ChatContext
		// defensively handles the backend returning a nested object anyway —
		// this simulates that real-world mismatch between the type and the API.
		mockedChatService.sendMessage.mockResolvedValue({
			// @ts-expect-error - intentionally non-string to exercise the defensive stringify branch
			response: { nested: "value" },
			chatId: "c1",
		});

		await act(async () => {
			await result.current.sendMessage("oi");
		});

		expect(result.current.messages[1].content).toBe(
			JSON.stringify({ nested: "value" }),
		);
	});

	it("shows a friendly placeholder when the backend returns no textual content and no sources", async () => {
		const result = await renderAuthedChat();
		mockedChatService.sendMessage.mockResolvedValue({ chatId: "c1" });

		await act(async () => {
			await result.current.sendMessage("oi");
		});

		expect(result.current.messages[1].content).toBe(
			"O assistente não retornou nenhuma resposta textual.",
		);
	});

	it("appends a graceful error message and clears the loading flag when the request fails", async () => {
		const result = await renderAuthedChat();
		mockedChatService.sendMessage.mockRejectedValue({
			response: { status: 500 },
		});

		await act(async () => {
			await result.current.sendMessage("oi");
		});

		expect(result.current.isLoading).toBe(false);
		expect(result.current.messages[1].role).toBe("assistant");
		expect(result.current.messages[1].content).toContain("Erro 500");
	});

	it("still sends the message when crypto.randomUUID is unavailable (plain-HTTP LAN access)", async () => {
		vi.stubGlobal("crypto", {});
		try {
			const result = await renderAuthedChat();
			mockedChatService.sendMessage.mockResolvedValue({
				response: "ok",
				chatId: "chat-1",
			});

			await act(async () => {
				await result.current.sendMessage("oi");
			});

			const ids = result.current.messages.map((m) => m.id);
			expect(ids).toHaveLength(2);
			expect(new Set(ids).size).toBe(2);
		} finally {
			vi.unstubAllGlobals();
		}
	});

	it("registers a new chat id and persists it as the last opened chat", async () => {
		const result = await renderAuthedChat();
		mockedChatService.sendMessage.mockResolvedValue({
			response: "ok",
			chatId: "brand-new",
		});

		await act(async () => {
			await result.current.sendMessage("primeira mensagem");
		});

		expect(result.current.currentChatId).toBe("brand-new");
		expect(localStorage.getItem(STORAGE_KEYS.LAST_CHAT_ID)).toBe("brand-new");
	});
});

describe("ChatContext.loadChat", () => {
	it("loads messages for a chat and remembers it as the last opened chat", async () => {
		const result = await renderAuthedChat();
		mockedChatService.getChat.mockResolvedValue({
			id: "c9",
			title: "t",
			// @ts-expect-error - simulating a backend payload without message ids
			messages: [{ role: "user", content: "hey" }],
		});

		await act(async () => {
			await result.current.loadChat("c9");
		});

		expect(result.current.currentChatId).toBe("c9");
		expect(result.current.messages).toMatchObject([
			{ role: "user", content: "hey" },
		]);
		expect(result.current.messages[0].id).toEqual(expect.any(String));
		expect(localStorage.getItem(STORAGE_KEYS.LAST_CHAT_ID)).toBe("c9");
	});

	it("preserves message ids the backend already provides instead of generating new ones", async () => {
		const result = await renderAuthedChat();
		mockedChatService.getChat.mockResolvedValue({
			id: "c9",
			title: "t",
			messages: [{ id: "server-id-1", role: "user", content: "hey" }],
		});

		await act(async () => {
			await result.current.loadChat("c9");
		});

		expect(result.current.messages[0].id).toBe("server-id-1");
	});

	it("clears the remembered last-chat id when loading fails", async () => {
		const result = await renderAuthedChat();
		localStorage.setItem(STORAGE_KEYS.LAST_CHAT_ID, "stale-id");
		mockedChatService.getChat.mockRejectedValue(new Error("not found"));

		await act(async () => {
			await result.current.loadChat("stale-id");
		});

		expect(localStorage.getItem(STORAGE_KEYS.LAST_CHAT_ID)).toBeNull();
	});
});

describe("ChatContext.startNewChat", () => {
	it("resets messages and the current chat id", async () => {
		const result = await renderAuthedChat();
		mockedChatService.getChat.mockResolvedValue({
			id: "c9",
			title: "t",
			messages: [{ id: "m1", role: "user", content: "hey" }],
		});
		await act(async () => {
			await result.current.loadChat("c9");
		});

		act(() => {
			result.current.startNewChat();
		});

		expect(result.current.messages).toEqual([]);
		expect(result.current.currentChatId).toBeNull();
		expect(localStorage.getItem(STORAGE_KEYS.LAST_CHAT_ID)).toBeNull();
	});
});

describe("ChatContext.deleteChat", () => {
	it("removes the chat optimistically and confirms with the server", async () => {
		const result = await renderAuthedChat();
		act(() => {
			result.current.startNewChat();
		});
		mockedChatService.getHistory.mockResolvedValue([{ id: "a", title: "A" }]);
		mockedChatService.deleteChat.mockResolvedValue(undefined);

		// seed one chat via optimistic history save through sendMessage flow
		mockedChatService.sendMessage.mockResolvedValue({
			response: "ok",
			chatId: "a",
		});
		await act(async () => {
			await result.current.sendMessage("msg");
		});
		expect(result.current.chatHistory.some((c) => c.id === "a")).toBe(true);

		await act(async () => {
			await result.current.deleteChat("a");
		});

		expect(result.current.chatHistory.some((c) => c.id === "a")).toBe(false);
		expect(mockedChatService.deleteChat).toHaveBeenCalledWith("a");
	});

	it("rolls back the optimistic removal and alerts the user when the server call fails", async () => {
		const result = await renderAuthedChat();
		mockedChatService.sendMessage.mockResolvedValue({
			response: "ok",
			chatId: "a",
		});
		await act(async () => {
			await result.current.sendMessage("msg");
		});

		mockedChatService.deleteChat.mockRejectedValue(new Error("server error"));
		const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

		await act(async () => {
			await result.current.deleteChat("a");
		});

		expect(result.current.chatHistory.some((c) => c.id === "a")).toBe(true);
		expect(alertSpy).toHaveBeenCalled();
	});
});
