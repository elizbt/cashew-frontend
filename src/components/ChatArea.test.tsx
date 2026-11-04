import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "../test/test-utils";
import type { Message } from "../types/chat";
import { ChatArea } from "./ChatArea";

let messages: Message[] = [];
let isLoading = false;

vi.mock("../context/ChatContext", () => ({
	useChat: () => ({ messages, isLoading, sendMessage: vi.fn() }),
}));

let scrollToSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	messages = [];
	isLoading = false;
	// setup.ts installs scrollTo as a vi.fn() under jsdom, so spyOn hands back
	// that same mock with the previous test's calls still recorded.
	scrollToSpy = vi
		.spyOn(Element.prototype, "scrollTo")
		.mockImplementation(() => {});
	scrollToSpy.mockClear();
});

describe("ChatArea auto-scroll", () => {
	it("scrolls to the bottom when a new message arrives", () => {
		messages = [{ id: "1", role: "user", content: "Oi" }];
		const { rerender } = render(<ChatArea />);
		scrollToSpy.mockClear();

		messages = [...messages, { id: "2", role: "assistant", content: "Olá" }];
		rerender(<ChatArea />);

		expect(scrollToSpy).toHaveBeenCalledTimes(1);
	});

	it("scrolls when the typing indicator appears", () => {
		messages = [{ id: "1", role: "user", content: "Oi" }];
		const { rerender } = render(<ChatArea />);
		scrollToSpy.mockClear();

		isLoading = true;
		rerender(<ChatArea />);

		expect(scrollToSpy).toHaveBeenCalledTimes(1);
	});

	it("scrolls when another conversation with the same message count is opened", () => {
		messages = [{ id: "a1", role: "user", content: "Oi" }];
		const { rerender } = render(<ChatArea />);
		scrollToSpy.mockClear();

		messages = [{ id: "b1", role: "user", content: "Outra" }];
		rerender(<ChatArea />);

		expect(scrollToSpy).toHaveBeenCalledTimes(1);
	});

	it("does not scroll an empty conversation", () => {
		render(<ChatArea />);

		expect(scrollToSpy).not.toHaveBeenCalled();
	});
});
