import { describe, expect, it, vi } from "vitest";
import App from "./App";
import { render, screen, withAuthedSession } from "./test/test-utils";

vi.mock("./services/api", () => ({
	authService: { login: vi.fn(), register: vi.fn() },
	chatService: {
		getHistory: vi.fn().mockResolvedValue([]),
		getChat: vi.fn(),
		sendMessage: vi.fn(),
		deleteChat: vi.fn(),
	},
}));

describe("App routing / PrivateRoute", () => {
	it("redirects an unauthenticated visitor away from the chat area to /login", async () => {
		window.history.pushState({}, "", "/");
		render(<App />);

		expect(
			await screen.findByRole("heading", { name: /acesse o castanha/i }),
		).toBeInTheDocument();
	});

	it("lets an authenticated user reach the chat layout", async () => {
		withAuthedSession();
		window.history.pushState({}, "", "/");
		render(<App />);

		expect(await screen.findByText("Nova Conversa")).toBeInTheDocument();
	});

	it("renders the register page at /register regardless of auth state", async () => {
		window.history.pushState({}, "", "/register");
		render(<App />);

		expect(
			await screen.findByRole("heading", { name: /criar conta/i }),
		).toBeInTheDocument();
	});
});
