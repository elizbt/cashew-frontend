import { describe, expect, it } from "vitest";
import { render, screen, userEvent } from "../test/test-utils";
import type { Message } from "../types/chat";
import { MessageItem } from "./MessageItem";

describe("MessageItem rendering", () => {
	it("renders user messages aligned as user content", () => {
		const message: Message = { id: "m1", role: "user", content: "Olá!" };
		render(<MessageItem message={message} />);
		expect(screen.getByText("Olá!")).toBeInTheDocument();
	});

	it("renders markdown formatting from the assistant", () => {
		const message: Message = {
			id: "m1",
			role: "assistant",
			content: "**negrito** e *itálico*",
		};
		render(<MessageItem message={message} />);
		expect(screen.getByText("negrito").tagName).toBe("STRONG");
		expect(screen.getByText("itálico").tagName).toBe("EM");
	});

	it("only shows the sources button when the assistant message has sources", () => {
		const { rerender } = render(
			<MessageItem
				message={{ id: "m1", role: "assistant", content: "sem fontes" }}
			/>,
		);
		expect(screen.queryByText(/fontes acadêmicas/i)).not.toBeInTheDocument();

		rerender(
			<MessageItem
				message={{
					id: "m2",
					role: "assistant",
					content: "com fontes",
					sources: ["Fonte 1"],
				}}
			/>,
		);
		expect(screen.getByText(/fontes acadêmicas/i)).toBeInTheDocument();
	});

	it("opens the source modal listing every source when clicked", async () => {
		const user = userEvent.setup();
		render(
			<MessageItem
				message={{
					id: "m1",
					role: "assistant",
					content: "resposta",
					sources: ["Regulamento do curso", "Manual do aluno"],
				}}
			/>,
		);

		await user.click(screen.getByText(/fontes acadêmicas/i));

		expect(screen.getByText("Regulamento do curso")).toBeInTheDocument();
		expect(screen.getByText("Manual do aluno")).toBeInTheDocument();
	});
});

describe("MessageItem security: markdown content is not raw HTML", () => {
	it("never executes or injects raw HTML tags embedded in assistant content", () => {
		const malicious = '<img src=x onerror="window.__pwned = true">';
		const { container } = render(
			<MessageItem
				message={{ id: "m1", role: "assistant", content: malicious }}
			/>,
		);

		expect(container.querySelector("img")).toBeNull();
		expect(
			(window as unknown as { __pwned?: boolean }).__pwned,
		).toBeUndefined();
	});

	it("never renders a <script> element from message content", () => {
		const malicious = "<script>window.__pwned = true;</script>";
		const { container } = render(
			<MessageItem
				message={{ id: "m1", role: "assistant", content: malicious }}
			/>,
		);

		expect(container.querySelector("script")).toBeNull();
		expect(
			(window as unknown as { __pwned?: boolean }).__pwned,
		).toBeUndefined();
	});

	it("renders markdown links safely with target=_blank and rel=noopener noreferrer", () => {
		const message: Message = {
			id: "m1",
			role: "assistant",
			content: "[veja aqui](https://ifnmg.edu.br/curso)",
		};
		render(<MessageItem message={message} />);

		const link = screen.getByRole("link", { name: "veja aqui" });
		expect(link).toHaveAttribute("href", "https://ifnmg.edu.br/curso");
		expect(link).toHaveAttribute("target", "_blank");
		expect(link).toHaveAttribute("rel", "noopener noreferrer");
	});
});
