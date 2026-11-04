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

	it("does not swallow trailing punctuation into the link", () => {
		render(
			<SourceModal
				isOpen
				onClose={vi.fn()}
				sources={["Fonte: https://www.ifnmg.edu.br/estude-no-ifnmg."]}
			/>,
		);

		expect(screen.getByRole("link")).toHaveAttribute(
			"href",
			"https://www.ifnmg.edu.br/estude-no-ifnmg",
		);
	});

	it("keeps balanced parentheses in the URL but not the ones around it", () => {
		render(
			<SourceModal
				isOpen
				onClose={vi.fn()}
				sources={[
					"https://pt.wikipedia.org/wiki/Foo_(bar) (veja https://www.ifnmg.edu.br).",
				]}
			/>,
		);

		const [wiki, site] = screen.getAllByRole("link");
		expect(wiki).toHaveAttribute(
			"href",
			"https://pt.wikipedia.org/wiki/Foo_(bar)",
		);
		expect(site).toHaveAttribute("href", "https://www.ifnmg.edu.br");
		expect(screen.getByRole("listitem")).toHaveTextContent(
			"https://pt.wikipedia.org/wiki/Foo_(bar) (veja https://www.ifnmg.edu.br).",
		);
	});

	it("renders in a portal on document.body so a transformed ancestor can't confine the overlay", () => {
		const { container } = render(
			<div style={{ transform: "translateY(0)" }}>
				<SourceModal isOpen onClose={vi.fn()} sources={["Fonte"]} />
			</div>,
		);

		const dialog = screen.getByRole("dialog");
		expect(container.contains(dialog)).toBe(false);
		expect(document.body.contains(dialog)).toBe(true);
		expect(dialog).toHaveAccessibleName("Fontes e Referências");
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
