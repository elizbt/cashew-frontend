import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, userEvent } from "../test/test-utils";
import { Sidebar } from "./Sidebar";

const loadChatMock = vi.fn();
const startNewChatMock = vi.fn();
const deleteChatMock = vi.fn();
const signOutMock = vi.fn();

let chatHistory: Array<{ id: string; title: string }> = [];

vi.mock("../context/ChatContext", () => ({
	useChat: () => ({
		chatHistory,
		currentChatId: null,
		loadChat: loadChatMock,
		startNewChat: startNewChatMock,
		deleteChat: deleteChatMock,
	}),
}));

vi.mock("../context/AuthContext", () => ({
	useAuth: () => ({
		user: { id: "1", name: "Ana Silva", email: "ana@test.com" },
		signOut: signOutMock,
	}),
}));

beforeEach(() => {
	chatHistory = [];
	loadChatMock.mockClear();
	startNewChatMock.mockClear();
	deleteChatMock.mockClear();
	signOutMock.mockClear();
});

describe("Sidebar", () => {
	it("shows an empty state when there is no chat history", () => {
		render(<Sidebar />);
		expect(
			screen.getByText(/nenhuma conversa encontrada/i),
		).toBeInTheDocument();
	});

	it("lists chat history entries and loads a chat on click", async () => {
		chatHistory = [{ id: "1", title: "Sobre matrícula" }];
		const user = userEvent.setup();
		render(<Sidebar />);

		await user.click(screen.getByText("Sobre matrícula"));
		expect(loadChatMock).toHaveBeenCalledWith("1");
	});

	it("starts a new chat when 'Nova Conversa' is clicked", async () => {
		const user = userEvent.setup();
		render(<Sidebar />);

		await user.click(screen.getByText("Nova Conversa"));
		expect(startNewChatMock).toHaveBeenCalled();
	});

	it("requires confirmation before deleting a chat", async () => {
		chatHistory = [{ id: "1", title: "Sobre matrícula" }];
		const user = userEvent.setup();
		render(<Sidebar />);

		await user.click(screen.getByTitle("Excluir conversa"));
		expect(deleteChatMock).not.toHaveBeenCalled();

		expect(
			screen.getByText(/esta ação não poderá ser desfeita/i),
		).toBeInTheDocument();

		await user.click(screen.getByText("Excluir"));
		expect(deleteChatMock).toHaveBeenCalledWith("1");
	});

	it("shows the signed-in user's name and initial", () => {
		render(<Sidebar />);
		expect(screen.getByText("Ana Silva")).toBeInTheDocument();
		expect(screen.getByText("A")).toBeInTheDocument();
	});

	it("signs out when Sair is clicked", async () => {
		const user = userEvent.setup();
		render(<Sidebar />);

		await user.click(screen.getByText("Sair"));
		expect(signOutMock).toHaveBeenCalled();
	});
});
