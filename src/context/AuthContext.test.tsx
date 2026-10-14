import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "../types/storage";

vi.mock("../services/api", () => ({
	authService: {
		logout: vi.fn(),
		restoreCsrfToken: vi.fn(),
	},
}));

import { authService } from "../services/api";
import { AuthProvider, useAuth } from "./AuthContext";

const mockedAuthService = vi.mocked(authService);

let originalLocation: Location;

beforeEach(() => {
	mockedAuthService.logout.mockReset().mockResolvedValue(undefined);
	mockedAuthService.restoreCsrfToken.mockReset().mockResolvedValue(undefined);
	originalLocation = window.location;
	// @ts-expect-error - jsdom navigation stub
	delete window.location;
	// @ts-expect-error
	window.location = { ...originalLocation, href: "" };
});

afterEach(() => {
	// @ts-expect-error - restoring the real jsdom Location after the test stub
	window.location = originalLocation;
});

describe("AuthContext", () => {
	it("removes the legacy JWT left in localStorage by the pre-cookie version on mount", async () => {
		localStorage.setItem(STORAGE_KEYS.TOKEN, "legacy-jwt");

		const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(localStorage.getItem(STORAGE_KEYS.TOKEN)).toBeNull();
	});

	it("restores the CSRF token when a cached session is hydrated, but not without one", async () => {
		const first = renderHook(() => useAuth(), { wrapper: AuthProvider });
		await waitFor(() => expect(first.result.current.loading).toBe(false));
		expect(mockedAuthService.restoreCsrfToken).not.toHaveBeenCalled();
		first.unmount();

		localStorage.setItem(
			STORAGE_KEYS.USER,
			JSON.stringify({ id: "1", name: "Ana", email: "ana@test.com" }),
		);
		const second = renderHook(() => useAuth(), { wrapper: AuthProvider });
		await waitFor(() => expect(second.result.current.loading).toBe(false));
		expect(mockedAuthService.restoreCsrfToken).toHaveBeenCalledTimes(1);
	});

	it("treats a corrupted cached profile as no session instead of crashing", async () => {
		localStorage.setItem(STORAGE_KEYS.USER, "{not json");

		const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.isAuthenticated).toBe(false);
		expect(localStorage.getItem(STORAGE_KEYS.USER)).toBeNull();
	});

	it("starts in a loading state and resolves to unauthenticated with no stored session", async () => {
		const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.isAuthenticated).toBe(false);
		expect(result.current.user).toBeNull();
	});

	it("optimistically restores the cached user profile on mount (the session itself is an httpOnly cookie the frontend can't read)", async () => {
		localStorage.setItem(
			STORAGE_KEYS.USER,
			JSON.stringify({ id: "1", name: "Ana", email: "ana@test.com" }),
		);

		const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.isAuthenticated).toBe(true);
		expect(result.current.user?.name).toBe("Ana");
	});

	it("signIn persists only the user profile (no token — that lives in an httpOnly cookie now) and flips isAuthenticated", async () => {
		const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
		await waitFor(() => expect(result.current.loading).toBe(false));

		act(() => {
			result.current.signIn({
				user: { id: "2", name: "Bia", email: "bia@test.com" },
			});
		});

		expect(result.current.isAuthenticated).toBe(true);
		expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) ?? "{}")).toEqual(
			{
				id: "2",
				name: "Bia",
				email: "bia@test.com",
			},
		);
		expect(localStorage.getItem(STORAGE_KEYS.TOKEN)).toBeNull();
	});

	it("signOut invalidates the server session, clears every local auth/cache key, and redirects to /login", async () => {
		localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({ id: "1" }));
		localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([]));
		localStorage.setItem(STORAGE_KEYS.CHAT_CACHE("chat-1"), JSON.stringify([]));
		localStorage.setItem(STORAGE_KEYS.CHAT_CACHE("chat-2"), JSON.stringify([]));
		// A token left over from before the httpOnly-cookie migration should
		// still get swept up by the general STORAGE_KEYS cleanup loop.
		localStorage.setItem(STORAGE_KEYS.TOKEN, "stale-legacy-token");
		localStorage.setItem("unrelated-key", "keep-me");

		const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.signOut();
		});

		expect(mockedAuthService.logout).toHaveBeenCalledTimes(1);
		expect(localStorage.getItem(STORAGE_KEYS.TOKEN)).toBeNull();
		expect(localStorage.getItem(STORAGE_KEYS.USER)).toBeNull();
		expect(localStorage.getItem(STORAGE_KEYS.CHAT_CACHE("chat-1"))).toBeNull();
		expect(localStorage.getItem(STORAGE_KEYS.CHAT_CACHE("chat-2"))).toBeNull();
		expect(localStorage.getItem("unrelated-key")).toBe("keep-me");
		expect(result.current.isAuthenticated).toBe(false);
		expect(window.location.href).toBe("/login");
	});

	it("still logs out locally even if the server-side logout call fails", async () => {
		mockedAuthService.logout.mockRejectedValue(new Error("network down"));
		localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({ id: "1" }));

		const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.signOut();
		});

		expect(localStorage.getItem(STORAGE_KEYS.USER)).toBeNull();
		expect(result.current.isAuthenticated).toBe(false);
		expect(window.location.href).toBe("/login");
	});
});
