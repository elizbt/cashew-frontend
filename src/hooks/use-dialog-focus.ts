import { type RefObject, useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR =
	'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

// Modal dialog keyboard behavior per the WAI-ARIA dialog pattern
// (https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/): focus moves into
// the dialog on open, Tab/Shift+Tab cycle inside it, Escape closes it, and
// focus returns to the element that opened it on close.
export function useDialogFocus(
	dialogRef: RefObject<HTMLElement | null>,
	isOpen: boolean,
	onClose: () => void,
) {
	// Callers usually pass an inline arrow; keeping it in a ref stops the
	// effect from re-running (and re-stealing focus) on every parent render.
	const onCloseRef = useRef(onClose);
	onCloseRef.current = onClose;

	useEffect(() => {
		if (!isOpen) return;

		const previouslyFocused = document.activeElement as HTMLElement | null;
		const getFocusable = () =>
			Array.from(
				dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ??
					[],
			);

		getFocusable()[0]?.focus();

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onCloseRef.current();
				return;
			}
			if (e.key !== "Tab") return;

			const focusable = getFocusable();
			if (focusable.length === 0) return;
			const first = focusable[0];
			const last = focusable[focusable.length - 1];

			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			previouslyFocused?.focus?.();
		};
	}, [dialogRef, isOpen]);
}
