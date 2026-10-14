import { describe, expect, it, vi } from "vitest";
import { render, screen, userEvent } from "../test/test-utils";
import ConfirmationModal from "./ConfirmationModal";

describe("ConfirmationModal", () => {
	it("renders nothing when isOpen is false", () => {
		const { container } = render(
			<ConfirmationModal
				isOpen={false}
				onClose={vi.fn()}
				onConfirm={vi.fn()}
				title="Excluir"
				message="Tem certeza?"
			/>,
		);
		expect(container).toBeEmptyDOMElement();
	});

	it("shows the title and message when open", () => {
		render(
			<ConfirmationModal
				isOpen
				onClose={vi.fn()}
				onConfirm={vi.fn()}
				title="Excluir conversa"
				message="Esta ação não poderá ser desfeita."
			/>,
		);
		expect(screen.getByText("Excluir conversa")).toBeInTheDocument();
		expect(
			screen.getByText("Esta ação não poderá ser desfeita."),
		).toBeInTheDocument();
	});

	it("calls onClose (without onConfirm) when Cancelar is clicked", async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();
		const onConfirm = vi.fn();
		render(
			<ConfirmationModal
				isOpen
				onClose={onClose}
				onConfirm={onConfirm}
				title="t"
				message="m"
			/>,
		);

		await user.click(screen.getByText("Cancelar"));
		expect(onClose).toHaveBeenCalledTimes(1);
		expect(onConfirm).not.toHaveBeenCalled();
	});

	it("calls both onConfirm and onClose when Excluir is clicked", async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();
		const onConfirm = vi.fn();
		render(
			<ConfirmationModal
				isOpen
				onClose={onClose}
				onConfirm={onConfirm}
				title="t"
				message="m"
			/>,
		);

		await user.click(screen.getByText("Excluir"));
		expect(onConfirm).toHaveBeenCalledTimes(1);
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("closes when the Escape key is pressed", async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();
		render(
			<ConfirmationModal
				isOpen
				onClose={onClose}
				onConfirm={vi.fn()}
				title="t"
				message="m"
			/>,
		);

		await user.keyboard("{Escape}");
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("closes when clicking the backdrop, but not when clicking inside the dialog", async () => {
		const user = userEvent.setup();
		const onClose = vi.fn();
		render(
			<ConfirmationModal
				isOpen
				onClose={onClose}
				onConfirm={vi.fn()}
				title="Excluir conversa"
				message="m"
			/>,
		);

		await user.click(screen.getByText("Excluir conversa"));
		expect(onClose).not.toHaveBeenCalled();

		await user.click(screen.getByRole("dialog").parentElement as HTMLElement);
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it("exposes proper dialog semantics for assistive technology", () => {
		render(
			<ConfirmationModal
				isOpen
				onClose={vi.fn()}
				onConfirm={vi.fn()}
				title="Excluir conversa"
				message="m"
			/>,
		);

		const dialog = screen.getByRole("dialog");
		expect(dialog).toHaveAttribute("aria-modal", "true");
		expect(dialog).toHaveAccessibleName("Excluir conversa");
	});

	it("moves focus into the dialog, keeps Tab inside it, and restores focus on close", async () => {
		const user = userEvent.setup();
		const trigger = document.createElement("button");
		document.body.appendChild(trigger);
		trigger.focus();

		const { rerender } = render(
			<ConfirmationModal
				isOpen
				onClose={vi.fn()}
				onConfirm={vi.fn()}
				title="Excluir"
				message="Tem certeza?"
			/>,
		);

		const closeButton = screen.getByRole("button", { name: "Fechar" });
		const confirmButton = screen.getByRole("button", { name: "Excluir" });
		expect(closeButton).toHaveFocus();

		await user.tab({ shift: true });
		expect(confirmButton).toHaveFocus();
		await user.tab();
		expect(closeButton).toHaveFocus();

		rerender(
			<ConfirmationModal
				isOpen={false}
				onClose={vi.fn()}
				onConfirm={vi.fn()}
				title="Excluir"
				message="Tem certeza?"
			/>,
		);
		expect(trigger).toHaveFocus();
		trigger.remove();
	});
});
