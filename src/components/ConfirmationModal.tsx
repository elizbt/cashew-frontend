import { AlertTriangle, X } from "lucide-react";
import type React from "react";
import { useEffect } from "react";

interface ConfirmationModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	message: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
	isOpen,
	onClose,
	onConfirm,
	title,
	message,
}) => {
	useEffect(() => {
		if (!isOpen) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: Escape is handled above; this is a mouse-only backdrop dismiss
		// biome-ignore lint/a11y/noStaticElementInteractions: backdrop is not itself a control, just a dismiss target
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
			onClick={onClose}
		>
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: onClick only stops backdrop-close propagation; not itself an interactive control */}
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="confirmation-modal-title"
				onClick={(e) => e.stopPropagation()}
				className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"
			>
				<div className="flex justify-between items-center p-4 border-b border-gray-100">
					<h3
						id="confirmation-modal-title"
						className="text-lg font-bold text-gray-900 flex items-center gap-2"
					>
						<AlertTriangle className="text-amber-500" size={20} />
						{title}
					</h3>
					<button
						type="button"
						onClick={onClose}
						aria-label="Fechar"
						className="text-gray-400 hover:text-gray-600 transition-colors p-1"
					>
						<X size={20} />
					</button>
				</div>

				<div className="p-6">
					<p className="text-gray-600 leading-relaxed">{message}</p>
				</div>

				<div className="flex items-center gap-3 p-4 bg-gray-50 border-t border-gray-100">
					<button
						type="button"
						onClick={onClose}
						className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
					>
						Cancelar
					</button>
					<button
						type="button"
						onClick={() => {
							onConfirm();
							onClose();
						}}
						className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
					>
						Excluir
					</button>
				</div>
			</div>
		</div>
	);
};

export default ConfirmationModal;
