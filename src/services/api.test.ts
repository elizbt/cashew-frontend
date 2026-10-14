import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";
import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
} from "vitest";
import { APP_CONFIG } from "../config/constants";
import { STORAGE_KEYS } from "../types/storage";
import api, { authService, chatService, resetCsrfStateForTests } from "./api";

const BASE_URL = APP_CONFIG.API_URL;

const server = setupServer(
	http.post(`${BASE_URL}/login`, async ({ request }) => {
		const body = (await request.json()) as { password?: string };
		if (body.password === "wrong") {
			return HttpResponse.json(
				{ message: "invalid credentials" },
				{ status: 401 },
			);
		}
		return HttpResponse.json({ user: { id: "1" } });
	}),
	http.post(
		`${BASE_URL}/logout`,
		() => new HttpResponse(null, { status: 204 }),
	),
	http.get(`${BASE_URL}/chats`, () => HttpResponse.json([])),
	http.get(`${BASE_URL}/protected-expired`, () =>
		HttpResponse.json({ message: "session expired" }, { status: 401 }),
	),
);

let originalLocation: Location;

// jsdom doesn't implement the Cookie Store API, so direct document.cookie
// assignment is the only way to simulate the non-httpOnly csrfToken cookie
// the backend sets alongside the httpOnly session cookie.
function setCsrfCookie(value: string) {
	// biome-ignore lint/suspicious/noDocumentCookie: jsdom has no Cookie Store API to fall back to
	document.cookie = `csrfToken=${value}`;
}

function clearCsrfCookie() {
	setCsrfCookie("");
}

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
	server.resetHandlers();
	clearCsrfCookie();
	resetCsrfStateForTests();
});
afterAll(() => server.close());

beforeEach(() => {
	originalLocation = window.location;
	// jsdom silently no-ops real navigation, so we swap in a plain writable
	// object to observe redirects. Crucially it must start with a *valid*
	// absolute href (not ""), since axios/msw resolve outgoing request URLs
	// against `window.location` as the base and an empty base throws
	// "Invalid URL" even for already-absolute request URLs.
	// @ts-expect-error - jsdom navigation stub for redirect assertions
	delete window.location;
	// @ts-expect-error
	window.location = { ...originalLocation, href: originalLocation.href };
});

afterEach(() => {
	// @ts-expect-error - restoring the real jsdom Location after the test stub
	window.location = originalLocation;
});

describe("api instance: cookie-based auth", () => {
	it("is configured to send credentials (the httpOnly session cookie) on every request", () => {
		expect(api.defaults.withCredentials).toBe(true);
	});

	it("never attaches an Authorization header — the session lives in an httpOnly cookie, not JS-readable state", async () => {
		server.use(
			http.get(`${BASE_URL}/chats`, ({ request }) => {
				expect(request.headers.get("Authorization")).toBeNull();
				return HttpResponse.json([]);
			}),
		);
		await api.get("/chats");
	});
});

describe("api request interceptor: CSRF header", () => {
	it("attaches X-CSRF-Token (read from the csrfToken cookie) on POST /chat", async () => {
		setCsrfCookie("secret-csrf-value");
		server.use(
			http.post(`${BASE_URL}/chat`, ({ request }) => {
				expect(request.headers.get("X-CSRF-Token")).toBe("secret-csrf-value");
				return HttpResponse.json({ response: "ok", chatId: "1" });
			}),
		);

		await chatService.sendMessage("oi");
	});

	it("attaches X-CSRF-Token on DELETE /chat/:id", async () => {
		setCsrfCookie("secret-csrf-value");
		server.use(
			http.delete(`${BASE_URL}/chat/:id`, ({ request }) => {
				expect(request.headers.get("X-CSRF-Token")).toBe("secret-csrf-value");
				return new HttpResponse(null, { status: 204 });
			}),
		);

		await chatService.deleteChat("chat-1");
	});

	it("does not attach X-CSRF-Token on GET requests to /chat routes", async () => {
		setCsrfCookie("secret-csrf-value");
		server.use(
			http.get(`${BASE_URL}/chat/:id`, ({ request }) => {
				expect(request.headers.get("X-CSRF-Token")).toBeNull();
				return HttpResponse.json({ id: "1", title: "t", messages: [] });
			}),
		);

		await chatService.getChat("chat-1");
	});

	it("does not attach X-CSRF-Token on routes outside /chat, e.g. /login", async () => {
		setCsrfCookie("secret-csrf-value");
		server.use(
			http.post(`${BASE_URL}/login`, ({ request }) => {
				expect(request.headers.get("X-CSRF-Token")).toBeNull();
				return HttpResponse.json({ user: { id: "1" } });
			}),
		);

		await authService.login({ email: "a@a.com", password: "123456" });
	});

	it("omits the header entirely when no csrfToken cookie is set yet", async () => {
		server.use(
			http.post(`${BASE_URL}/chat`, ({ request }) => {
				expect(request.headers.get("X-CSRF-Token")).toBeNull();
				return HttpResponse.json({ response: "ok", chatId: "1" });
			}),
		);

		await chatService.sendMessage("oi");
	});
});

describe("CSRF token from the response body (API on another host)", () => {
	it("uses the csrfToken returned by /login when the cookie isn't readable, until logout", async () => {
		server.use(
			http.post(`${BASE_URL}/login`, () =>
				HttpResponse.json({ user: { id: "1" }, csrfToken: "body-csrf" }),
			),
			http.post(`${BASE_URL}/chat`, ({ request }) => {
				expect(request.headers.get("X-CSRF-Token")).toBe("body-csrf");
				return HttpResponse.json({ response: "ok", chatId: "1" });
			}),
		);

		await authService.login({ email: "a@a.com", password: "123456" });
		await chatService.sendMessage("oi");

		await authService.logout();
		server.use(
			http.post(`${BASE_URL}/chat`, ({ request }) => {
				expect(request.headers.get("X-CSRF-Token")).toBeNull();
				return HttpResponse.json({ response: "ok", chatId: "1" });
			}),
		);
		await chatService.sendMessage("oi");
	});

	it("restores the token from GET /csrf after a reload", async () => {
		server.use(
			http.get(`${BASE_URL}/csrf`, () =>
				HttpResponse.json({ csrfToken: "restored-csrf" }),
			),
			http.delete(`${BASE_URL}/chat/:id`, ({ request }) => {
				expect(request.headers.get("X-CSRF-Token")).toBe("restored-csrf");
				return new HttpResponse(null, { status: 204 });
			}),
		);

		await authService.restoreCsrfToken();
		await chatService.deleteChat("chat-1");

		await authService.logout();
	});
});

describe("CSRF recovery", () => {
	it("makes a write fired during the boot-time restore wait for it", async () => {
		let releaseRestore: () => void = () => undefined;
		server.use(
			http.get(`${BASE_URL}/csrf`, async () => {
				await new Promise<void>((resolve) => {
					releaseRestore = resolve;
				});
				return HttpResponse.json({ csrfToken: "late-csrf" });
			}),
			http.post(`${BASE_URL}/chat`, ({ request }) => {
				expect(request.headers.get("X-CSRF-Token")).toBe("late-csrf");
				return HttpResponse.json({ response: "ok", chatId: "1" });
			}),
		);

		const restore = authService.restoreCsrfToken();
		const send = chatService.sendMessage("oi");
		await new Promise((resolve) => setTimeout(resolve, 10));
		releaseRestore();

		await restore;
		await send;
	});

	it("refetches the token and retries once on 403 CSRF_INVALID (stale token from another tab)", async () => {
		let attempts = 0;
		server.use(
			http.get(`${BASE_URL}/csrf`, () =>
				HttpResponse.json({ csrfToken: "fresh-csrf" }),
			),
			http.post(`${BASE_URL}/chat`, ({ request }) => {
				attempts++;
				if (request.headers.get("X-CSRF-Token") !== "fresh-csrf") {
					return HttpResponse.json(
						{
							code: "CSRF_INVALID",
							message: "CSRF token inválido ou ausente.",
						},
						{ status: 403 },
					);
				}
				return HttpResponse.json({ response: "ok", chatId: "1" });
			}),
		);
		setCsrfCookie("stale-csrf");

		const data = await chatService.sendMessage("oi");

		expect(data.response).toBe("ok");
		expect(attempts).toBe(2);
	});

	it("gives up after one retry instead of looping when the token is still rejected", async () => {
		let attempts = 0;
		server.use(
			http.get(`${BASE_URL}/csrf`, () =>
				HttpResponse.json({ csrfToken: "still-wrong" }),
			),
			http.post(`${BASE_URL}/chat`, () => {
				attempts++;
				return HttpResponse.json({ code: "CSRF_INVALID" }, { status: 403 });
			}),
		);

		await expect(chatService.sendMessage("oi")).rejects.toMatchObject({
			response: { status: 403 },
		});
		expect(attempts).toBe(2);
	});

	it("does not retry a 403 that is not a CSRF failure", async () => {
		let attempts = 0;
		server.use(
			http.delete(`${BASE_URL}/chat/:id`, () => {
				attempts++;
				return HttpResponse.json({ message: "forbidden" }, { status: 403 });
			}),
		);

		await expect(chatService.deleteChat("chat-1")).rejects.toBeTruthy();
		expect(attempts).toBe(1);
	});
});

describe("api response interceptor (401 handling)", () => {
	it("clears the cached user profile and redirects to /login on a 401 from a protected route", async () => {
		localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({ id: "1" }));
		localStorage.setItem(STORAGE_KEYS.TOKEN, "legacy-jwt");

		await expect(api.get("/protected-expired")).rejects.toBeTruthy();

		expect(localStorage.getItem(STORAGE_KEYS.USER)).toBeNull();
		expect(localStorage.getItem(STORAGE_KEYS.TOKEN)).toBeNull();
		expect(window.location.href).toBe("/login");
	});

	it("does NOT wipe credentials or redirect when the 401 comes from the login endpoint itself", async () => {
		localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify({ id: "1" }));

		await expect(
			api.post("/login", { email: "a@a.com", password: "wrong" }),
		).rejects.toBeTruthy();

		expect(localStorage.getItem(STORAGE_KEYS.USER)).toBe(
			JSON.stringify({ id: "1" }),
		);
		expect(window.location.href).toBe(originalLocation.href);
	});
});

describe("authService", () => {
	it("logs in and returns the response payload", async () => {
		const data = await authService.login({
			email: "a@a.com",
			password: "123456",
		});
		expect(data).toEqual({ user: { id: "1" } });
	});

	it("posts to /logout to invalidate the server-side session", async () => {
		let called = false;
		server.use(
			http.post(`${BASE_URL}/logout`, () => {
				called = true;
				return new HttpResponse(null, { status: 204 });
			}),
		);

		await authService.logout();
		expect(called).toBe(true);
	});
});

describe("chatService", () => {
	it("sends a message without a chatId when starting a new conversation", async () => {
		server.use(
			http.post(`${BASE_URL}/chat`, async ({ request }) => {
				const body = (await request.json()) as Record<string, unknown>;
				expect(body).toEqual({ message: "oi", content: "oi" });
				return HttpResponse.json({ response: "ola", chatId: "1" });
			}),
		);
		const data = await chatService.sendMessage("oi");
		expect(data.response).toBe("ola");
	});

	it("includes chatId in the payload when continuing a conversation", async () => {
		server.use(
			http.post(`${BASE_URL}/chat`, async ({ request }) => {
				const body = (await request.json()) as Record<string, unknown>;
				expect(body.chatId).toBe("chat-9");
				return HttpResponse.json({ response: "ok", chatId: "chat-9" });
			}),
		);
		await chatService.sendMessage("continua", "chat-9");
	});
});
