import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	renderWithRouter,
	screen,
	userEvent,
	waitFor,
} from "../test/test-utils";
import Register from "./Register";

vi.mock("../services/api", () => ({
	authService: {
		login: vi.fn(),
		register: vi.fn(),
	},
}));

import { authService } from "../services/api";

const mockedAuthService = vi.mocked(authService);

const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
	const actual =
		await vi.importActual<typeof import("react-router-dom")>(
			"react-router-dom",
		);
	return { ...actual, useNavigate: () => navigateMock };
});

beforeEach(() => {
	navigateMock.mockClear();
});

describe("Register password strength checklist", () => {
	it("reflects each rule live as the user types", async () => {
		const user = userEvent.setup();
		renderWithRouter(<Register />);

		const passwordInput = screen.getByLabelText(/^senha$/i);
		await user.type(passwordInput, "abc");
		expect(screen.getByText(/mínimo de 6 caracteres/i)).toHaveClass(
			"text-red-500",
		);

		await user.type(passwordInput, "def1");
		expect(screen.getByText(/mínimo de 6 caracteres/i)).toHaveClass(
			"text-green-600",
		);
		expect(screen.getByText(/pelo menos um número/i)).toHaveClass(
			"text-green-600",
		);
		expect(screen.getByText(/letra maiúscula/i)).toHaveClass("text-red-500");

		await user.type(passwordInput, "A");
		expect(screen.getByText(/letra maiúscula/i)).toHaveClass("text-green-600");
	});
});

describe("Register validation", () => {
	it("rejects a name shorter than 2 characters", async () => {
		const user = userEvent.setup();
		renderWithRouter(<Register />);

		await user.type(screen.getByLabelText(/nome completo/i), "A");
		await user.type(screen.getByLabelText(/e-mail/i), "a@a.com");
		await user.type(screen.getByLabelText(/^senha$/i), "Abcdef1");
		await user.click(screen.getByRole("button", { name: /cadastrar/i }));

		expect(
			await screen.findByText("O nome deve ter pelo menos 2 caracteres"),
		).toBeInTheDocument();
		expect(mockedAuthService.register).not.toHaveBeenCalled();
	});

	it("rejects submission when the password does not meet all security criteria", async () => {
		const user = userEvent.setup();
		renderWithRouter(<Register />);

		await user.type(screen.getByLabelText(/nome completo/i), "Ana Silva");
		await user.type(screen.getByLabelText(/e-mail/i), "ana@a.com");
		await user.type(screen.getByLabelText(/^senha$/i), "weakpass");
		await user.click(screen.getByRole("button", { name: /cadastrar/i }));

		expect(
			await screen.findByText(
				"A senha não atende a todos os requisitos de segurança",
			),
		).toBeInTheDocument();
		expect(mockedAuthService.register).not.toHaveBeenCalled();
	});
});

describe("Register submission flow", () => {
	it("registers, then immediately logs in and navigates to the app", async () => {
		mockedAuthService.register.mockResolvedValue({
			id: "1",
			name: "Ana Silva",
			email: "ana@a.com",
		});
		mockedAuthService.login.mockResolvedValue({
			user: { id: "1", name: "Ana Silva", email: "ana@a.com" },
			token: "tok",
		});
		const user = userEvent.setup();
		renderWithRouter(<Register />);

		await user.type(screen.getByLabelText(/nome completo/i), "Ana Silva");
		await user.type(screen.getByLabelText(/e-mail/i), "ana@a.com");
		await user.type(screen.getByLabelText(/^senha$/i), "Abcdef1");
		await user.click(screen.getByRole("button", { name: /cadastrar/i }));

		await waitFor(() =>
			expect(mockedAuthService.register).toHaveBeenCalledWith({
				name: "Ana Silva",
				email: "ana@a.com",
				password: "Abcdef1",
			}),
		);
		await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/"));
	});

	it("shows the backend error message when the email is already registered", async () => {
		mockedAuthService.register.mockRejectedValue({
			response: { data: { message: "E-mail já cadastrado" } },
		});
		const user = userEvent.setup();
		renderWithRouter(<Register />);

		await user.type(screen.getByLabelText(/nome completo/i), "Ana Silva");
		await user.type(screen.getByLabelText(/e-mail/i), "ana@a.com");
		await user.type(screen.getByLabelText(/^senha$/i), "Abcdef1");
		await user.click(screen.getByRole("button", { name: /cadastrar/i }));

		expect(await screen.findByText("E-mail já cadastrado")).toBeInTheDocument();
		expect(navigateMock).not.toHaveBeenCalled();
	});
});
