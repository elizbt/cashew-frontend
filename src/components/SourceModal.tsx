import { BookOpen, X } from "lucide-react";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";

interface SourceModalProps {
	isOpen: boolean;
	onClose: () => void;
	sources: string[];
}

const renderSource = (text: string) => {
	const urlRegex = /(https?:\/\/[^\s]+)/g;
	const parts = text.split(urlRegex);

	return parts.map((part, i) => {
		if (part.match(urlRegex)) {
			return (
				<a
					/* biome-ignore lint/suspicious/noArrayIndexKey: using index for unique keys */
					key={i}
					href={part}
					target="_blank"
					rel="noopener noreferrer"
					className="text-secondary hover:text-primary underline break-all"
				>
					{part}
				</a>
			);
		}
		return part;
	});
};

export const SourceModal: React.FC<SourceModalProps> = ({
	isOpen,
	onClose,
	sources,
}) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
			<Card className="max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
				<div className="flex items-center justify-between p-4 border-b border-emerald-100 bg-emerald-50/30">
					<div className="flex items-center gap-2 text-primary">
						<BookOpen size={20} />
						<h3 className="font-semibold text-lg">Fontes e Referências</h3>
					</div>
					<Button
						variant="ghost"
						onClick={onClose}
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
		</div>
	);
};
