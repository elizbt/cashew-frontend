import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	fireEvent,
	renderWithRouter,
	screen,
	userEvent,
	waitFor,
} from "../test/test-utils";
import { STORAGE_KEYS } from "../types/storage";
import Login from "./Login";

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

describe("Login", () => {
	it("blocks submission and shows a validation message when fields are empty", async () => {
		// Note: the email/password inputs both carry the HTML `required` attribute,
		// so a real user click on the submit button never reaches handleSubmit — the
		// browser's own constraint validation blocks it first. We dispatch the
		// "submit" event directly (bypassing that native check) to exercise the
		// component's own (currently unreachable in normal usage) guard clause.
		const { container } = renderWithRouter(<Login />);

		const form = container.querySelector("form");
		expect(form).not.toBeNull();
		fireEvent.submit(form as HTMLFormElement);

		expect(
			await screen.findByText("Preencha todos os campos"),
		).toBeInTheDocument();
		expect(mockedAuthService.login).not.toHaveBeenCalled();
	});

	it("logs in, persists the user profile, and navigates to the app on success", async () => {
		// The session itself is now an httpOnly cookie set by the backend on
		// the /login response — the frontend never sees or stores a token, only
		// the (non-sensitive) user profile for optimistic hydration on reload.
		mockedAuthService.login.mockResolvedValue({
			user: { id: "1", name: "Ana", email: "ana@test.com" },
		});
		const user = userEvent.setup();
		renderWithRouter(<Login />);

		await user.type(screen.getByLabelText(/e-mail/i), "ana@test.com");
		await user.type(screen.getByLabelText(/^senha$/i), "supersecret");
		await user.click(screen.getByRole("button", { name: /entrar/i }));

		await waitFor(() => expect(navigateMock).toHaveBeenCalledWith("/"));
		expect(
			JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) ?? "{}"),
		).toMatchObject({ id: "1", name: "Ana" });
		expect(localStorage.getItem(STORAGE_KEYS.TOKEN)).toBeNull();
	});

	it("surfaces a generic server error message", async () => {
		mockedAuthService.login.mockRejectedValue({
			response: { data: { message: "E-mail ou senha inválidos" } },
		});
		const user = userEvent.setup();
		renderWithRouter(<Login />);

		await user.type(screen.getByLabelText(/e-mail/i), "ana@test.com");
		await user.type(screen.getByLabelText(/^senha$/i), "wrong-pass");
		await user.click(screen.getByRole("button", { name: /entrar/i }));

		expect(
			await screen.findByText("E-mail ou senha inválidos"),
		).toBeInTheDocument();
		expect(localStorage.getItem(STORAGE_KEYS.USER)).toBeNull();
	});

	it("joins validation issues returned by the backend into a single message", async () => {
		mockedAuthService.login.mockRejectedValue({
			response: {
				data: {
					issues: [
						{ message: "email inválido" },
						{ message: "senha muito curta" },
					],
				},
			},
		});
		const user = userEvent.setup();
		renderWithRouter(<Login />);

		await user.type(screen.getByLabelText(/e-mail/i), "a@a.com");
		await user.type(screen.getByLabelText(/^senha$/i), "123");
		await user.click(screen.getByRole("button", { name: /entrar/i }));

		expect(
			await screen.findByText("email inválido, senha muito curta"),
		).toBeInTheDocument();
	});

	it("toggles password visibility", async () => {
		const user = userEvent.setup();
		renderWithRouter(<Login />);

		const passwordInput = screen.getByLabelText(/^senha$/i) as HTMLInputElement;
		expect(passwordInput.type).toBe("password");

		const buttons = screen.getAllByRole("button");
		const toggleButton = buttons.find((btn) => btn.textContent?.trim() === "");
		expect(toggleButton).toBeDefined();
		await user.click(toggleButton as HTMLElement);
		expect(passwordInput.type).toBe("text");
	});
});
