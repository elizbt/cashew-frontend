import { Loader2, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { UI_CONFIG } from "../config/constants";
import { useChat } from "../context/ChatContext";
import { Button } from "./ui/Button";

export const ChatInput: React.FC = () => {
	const [input, setInput] = useState("");
	const { sendMessage, isLoading } = useChat();
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const handleSubmit = (e?: React.FormEvent) => {
		e?.preventDefault();
		if (input.trim() && !isLoading) {
			sendMessage(input.trim());
			setInput("");
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit();
		}
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: `input` isn't read directly, but the effect must re-run on every keystroke to recompute scrollHeight
	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			textareaRef.current.style.height = `${Math.min(
				textareaRef.current.scrollHeight,
				UI_CONFIG.MAX_TEXTAREA_HEIGHT,
			)}px`;
		}
	}, [input]);

	return (
		<div className="bg-white p-4 pb-8 backdrop-blur-sm">
			<form
				onSubmit={handleSubmit}
				className="max-w-3xl mx-auto relative flex items-end gap-2"
			>
				<div className="relative flex-1 bg-emerald-50 border border-secondary rounded-3xl shadow-sm focus-within:border-primary transition-colors overflow-hidden">
					<textarea
						ref={textareaRef}
						rows={1}
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="Pergunte para a Castanha"
						className="w-full p-3 pl-5 pr-14 bg-transparent outline-none resize-none text-slate-900 placeholder:text-slate-500"
					/>
					<Button
						type="submit"
						variant="ghost"
						disabled={!input.trim() || isLoading}
						className="absolute right-2 bottom-1.5 p-2"
					>
						{isLoading ? (
							<Loader2 className="animate-spin text-secondary" size={20} />
						) : (
							<Send className="text-secondary" size={20} />
						)}
					</Button>
				</div>
			</form>
			<p className="text-[10px] text-center text-slate-500 mt-2 font-medium">
				O Chatbot pode cometer erros. Verifique informações importantes no site
				oficial do IFNMG.
			</p>
		</div>
	);
};
