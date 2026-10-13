import { describe, expect, it, vi } from "vitest";
import { render, screen, userEvent } from "../test/test-utils";
import { SourceModal } from "./SourceModal";

describe("SourceModal", () => {
	it("renders nothing when closed", () => {
		const { container } = render(
			<SourceModal isOpen={false} onClose={vi.fn()} sources={["Fonte A"]} />,
		);
		expect(container).toBeEmptyDOMElement();
	});

	it("lists every source with a stable numbered order", () => {
		render(
			<SourceModal
				isOpen
				onClose={vi.fn()}
				sources={["Regulamento acadêmico", "Manual do aluno"]}
			/>,
		);

		expect(screen.getByText("Regulamento acadêmico")).toBeInTheDocument();
		expect(screen.getByText("Manual do aluno")).toBeInTheDocument();
		expect(screen.getByText("1")).toBeInTheDocument();
		expect(screen.getByText("2")).toBeInTheDocument();
	});

	it("turns embedded URLs into safe, new-tab links", () => {
		render(
			<SourceModal
				isOpen
				onClose={vi.fn()}
				sources={[
					"Veja em https://ifnmg.edu.br/regulamento para mais detalhes",
				]}
			/>,
		);

		const link = screen.getByRole("link", {
			name: "https://ifnmg.edu.br/regulamento",
		});
		expect(link).toHaveAttribute("href", "https://ifnmg.edu.br/regulamento");
		expect(link).toHaveAttribute("target", "_blank");
		expect(link).toHaveAttribute("rel", "noopener noreferrer");
	});

	it("never turns plain (non-http) text into a clickable link, even if it looks like a scheme", () => {
		render(
			<SourceModal
				isOpen
				onClose={vi.fn()}
				sources={["javascript:alert(1) não é uma URL http"]}
			/>,
		);

		expect(screen.queryByRole("link")).not.toBeInTheDocument();
	});

	it("calls onClose from both the close (X) button and the 'Entendi' button", async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();
		render(<SourceModal isOpen onClose={onClose} sources={["Fonte"]} />);

		await user.click(screen.getByText("Entendi"));
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("closes when the Escape key is pressed", async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();
		render(<SourceModal isOpen onClose={onClose} sources={["Fonte"]} />);

		await user.keyboard("{Escape}");
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("closes when clicking the backdrop, but not when clicking inside the dialog", async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();
		render(<SourceModal isOpen onClose={onClose} sources={["Fonte"]} />);

		await user.click(screen.getByText("Fontes e Referências"));
		expect(onClose).not.toHaveBeenCalled();

		await user.click(screen.getByRole("dialog").parentElement as HTMLElement);
		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
