import { BookOpen, X } from "lucide-react";
import { useId, useRef } from "react";
import { createPortal } from "react-dom";
import { useDialogFocus } from "../hooks/use-dialog-focus";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";

interface SourceModalProps {
	isOpen: boolean;
	onClose: () => void;
	sources: string[];
}

// http(s) URL up to the next whitespace or quote/angle bracket.
const URL_PATTERN = /https?:\/\/[^\s<>"]+/g;
const TRAILING_PUNCTUATION = /[.,;:!?'\]]$/;

const countChar = (text: string, char: string) => text.split(char).length - 1;

// Sentence punctuation right after a URL is prose, not part of it, so
// "veja https://site.br." links to https://site.br. A trailing ")" only
// belongs to the URL when it closes a "(" inside it, as in
// https://pt.wikipedia.org/wiki/Foo_(bar), but not in "(veja https://site.br)".
const trimUrl = (raw: string) => {
	let url = raw;
	for (;;) {
		if (TRAILING_PUNCTUATION.test(url)) {
			url = url.slice(0, -1);
		} else if (url.endsWith(")") && countChar(url, ")") > countChar(url, "(")) {
			url = url.slice(0, -1);
		} else {
			return url;
		}
	}
};

const renderSource = (text: string) => {
	const parts: React.ReactNode[] = [];
	let cursor = 0;

	for (const match of text.matchAll(URL_PATTERN)) {
		const url = trimUrl(match[0]);
		if (!/^https?:\/\/./.test(url)) continue;
		parts.push(text.slice(cursor, match.index));
		parts.push(
			<a
				key={match.index}
				href={url}
				target="_blank"
				rel="noopener noreferrer"
				className="text-secondary hover:text-primary underline break-all"
			>
				{url}
			</a>,
		);
		cursor = match.index + url.length;
	}
	parts.push(text.slice(cursor));

	return parts;
};

export const SourceModal: React.FC<SourceModalProps> = ({
	isOpen,
	onClose,
	sources,
}) => {
	const dialogRef = useRef<HTMLDivElement>(null);
	const titleId = useId();
	useDialogFocus(dialogRef, isOpen, onClose);

	if (!isOpen) return null;

	// Portal to body: MessageItem's `animate-in` leaves a transform on the
	// message wrapper, which would make this `fixed` overlay cover only the
	// message box instead of the viewport.
	return createPortal(
		// biome-ignore lint/a11y/useKeyWithClickEvents: Escape is handled by useDialogFocus; this is a mouse-only backdrop dismiss
		// biome-ignore lint/a11y/noStaticElementInteractions: backdrop is not itself a control, just a dismiss target
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
			onClick={onClose}
		>
			<Card
				ref={dialogRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				onClick={(e) => e.stopPropagation()}
				className="max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200"
			>
				<div className="flex items-center justify-between p-4 border-b border-emerald-100 bg-emerald-50/30">
					<div className="flex items-center gap-2 text-primary">
						<BookOpen size={20} />
						<h3 id={titleId} className="font-semibold text-lg">
							Fontes e Referências
						</h3>
					</div>
					<Button
						variant="ghost"
						onClick={onClose}
						aria-label="Fechar"
						className="p-1 rounded-full"
					>
						<X size={20} />
					</Button>
				</div>
				<div className="p-6 max-h-[60vh] overflow-y-auto scrollbar-custom">
					<ul className="space-y-4">
						{sources.map((source, index) => (
							<li
								/* biome-ignore lint/suspicious/noArrayIndexKey: using index for unique keys */
								key={index}
								className="flex gap-3 text-slate-700 leading-relaxed"
							>
								<span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-secondary text-xs flex items-center justify-center font-bold">
									{index + 1}
								</span>
								<div className="text-sm">{renderSource(source)}</div>
							</li>
						))}
					</ul>
				</div>
				<div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
					<Button onClick={onClose} className="px-8">
						Entendi
					</Button>
				</div>
			</Card>
		</div>,
		document.body,
	);
};
