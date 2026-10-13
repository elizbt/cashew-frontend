import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, userEvent } from "../test/test-utils";
import { ChatInput } from "./ChatInput";

const sendMessageMock = vi.fn();
let isLoading = false;

vi.mock("../context/ChatContext", () => ({
	useChat: () => ({ sendMessage: sendMessageMock, isLoading }),
}));

beforeEach(() => {
	sendMessageMock.mockClear();
	isLoading = false;
});

describe("ChatInput", () => {
	it("sends the trimmed message on Enter and clears the field", async () => {
		const user = userEvent.setup();
		render(<ChatInput />);

		const textarea = screen.getByPlaceholderText(/pergunte para a castanha/i);
		await user.type(textarea, "  Olá Castanha  {Enter}");

		expect(sendMessageMock).toHaveBeenCalledWith("Olá Castanha");
		expect(textarea).toHaveValue("");
	});

	it("does not submit on Shift+Enter, allowing a newline instead", async () => {
		const user = userEvent.setup();
		render(<ChatInput />);

		const textarea = screen.getByPlaceholderText(/pergunte para a castanha/i);
		await user.type(textarea, "linha 1{Shift>}{Enter}{/Shift}linha 2");

		expect(sendMessageMock).not.toHaveBeenCalled();
		expect(textarea).toHaveValue("linha 1\nlinha 2");
	});

	it("does not send an empty or whitespace-only message", async () => {
		const user = userEvent.setup();
		render(<ChatInput />);

		const textarea = screen.getByPlaceholderText(/pergunte para a castanha/i);
		await user.type(textarea, "   {Enter}");

		expect(sendMessageMock).not.toHaveBeenCalled();
	});

	it("disables the send button while a response is loading", () => {
		isLoading = true;
		render(<ChatInput />);

		const button = screen.getByRole("button");
		expect(button).toBeDisabled();
	});

	it("disables the send button when the input is empty", () => {
		render(<ChatInput />);
		expect(screen.getByRole("button")).toBeDisabled();
	});

	it("recomputes the textarea height on every keystroke, not just on mount", async () => {
		// jsdom doesn't perform real layout, so scrollHeight is always 0 unless
		// we stub it. Tying it to the current text length lets us prove the
		// resize effect re-runs as the user types (the bug being regression
		// tested: the effect used to run once with an empty `[]` dependency array).
		const user = userEvent.setup();
		render(<ChatInput />);

		const textarea = screen.getByPlaceholderText(
			/pergunte para a castanha/i,
		) as HTMLTextAreaElement;
		Object.defineProperty(textarea, "scrollHeight", {
			configurable: true,
			get() {
				return this.value.length * 10;
			},
		});

		await user.type(textarea, "abc");
		expect(textarea.style.height).toBe("30px");

		await user.type(textarea, "defgh");
		expect(textarea.style.height).toBe("80px");
	});
});
