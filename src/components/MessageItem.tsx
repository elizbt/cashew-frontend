import { Quote } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Message } from "../types/chat";
import { SourceModal } from "./SourceModal";

interface MessageItemProps {
	message: Message;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
	const isAssistant = message.role !== "user";
	const [isModalOpen, setIsModalOpen] = useState(false);

	return (
		<div className={"py-6 w-full animate-in bg-transparent"}>
			<div
				className={`max-w-3xl mx-auto px-4 flex ${isAssistant ? "justify-start" : "justify-end"}`}
			>
				<div
					className={`flex flex-col max-w-[85%] ${isAssistant ? "items-start" : "items-end"}`}
				>
					<div
						className={`px-6 py-4 relative group ${
							isAssistant
								? "leading-relaxed text-slate-800 text-[15px] space-y-4"
								: "bg-secondary text-white rounded-3xl shadow-sm font-medium"
						}`}
					>
						<ReactMarkdown
							components={{
								a: ({ node, ...props }) => (
									<a
										{...props}
										target="_blank"
										rel="noopener noreferrer"
										className="text-secondary hover:text-primary underline underline-offset-2 font-medium"
									/>
								),
								hr: () => <hr className="my-6 border-emerald-100/50" />,
								blockquote: ({ children }) => (
									<blockquote className="border-l-4 border-accent pl-4 italic text-slate-600 my-4 bg-emerald-50/20 py-3 rounded-r-lg">
										{children}
									</blockquote>
								),
								p: ({ children }) => (
									<p className="mb-4 last:mb-0">{children}</p>
								),
								ul: ({ children }) => (
									<ul className="list-disc pl-5 space-y-2 mb-4">{children}</ul>
								),
								ol: ({ children }) => (
									<ol className="list-decimal pl-5 space-y-2 mb-4">
										{children}
									</ol>
								),
								h1: ({ children }) => (
									<h1 className="text-2xl font-bold mb-4 mt-6">{children}</h1>
								),
								h2: ({ children }) => (
									<h2 className="text-xl font-bold mb-3 mt-5">{children}</h2>
								),
								h3: ({ children }) => (
									<h3 className="text-lg font-bold mb-2 mt-4">{children}</h3>
								),
							}}
						>
							{message.content}
						</ReactMarkdown>

						{isAssistant && message.sources && message.sources.length > 0 && (
							<div className="mt-4 pt-2 border-t border-emerald-50 flex justify-end">
								<button
									type="button"
									onClick={() => setIsModalOpen(true)}
									className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold text-secondary bg-emerald-50/50 hover:bg-emerald-100 rounded-full transition-colors border border-emerald-100/50 shadow-sm"
									title="Ver fontes acadêmicas"
								>
									<Quote size={12} fill="currentColor" />
									<span>Fontes Acadêmicas</span>
								</button>
							</div>
						)}
					</div>
				</div>
			</div>

			{isAssistant && message.sources && (
				<SourceModal
					isOpen={isModalOpen}
					onClose={() => setIsModalOpen(false)}
					sources={message.sources}
				/>
			)}
		</div>
	);
};
