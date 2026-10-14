import { render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";

export function renderWithRouter(
	ui: ReactElement,
	{
		route = "/",
		withAuthProvider = true,
	}: { route?: string; withAuthProvider?: boolean } = {},
) {
	function Wrapper({ children }: { children: ReactNode }) {
		const content = withAuthProvider ? (
			<AuthProvider>{children}</AuthProvider>
		) : (
			children
		);
		return <MemoryRouter initialEntries={[route]}>{content}</MemoryRouter>;
	}

	return render(ui, { wrapper: Wrapper });
}

export function withAuthedSession(
	user = { id: "1", name: "Ana", email: "ana@test.com" },
) {
	// The real session lives in an httpOnly cookie the frontend never sees —
	// only the (non-sensitive) user profile is cached client-side.
	localStorage.setItem("@Castanha:user", JSON.stringify(user));
}

export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
