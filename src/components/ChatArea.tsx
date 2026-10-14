import { useCallback, useEffect, useRef } from "react";
import { useChat } from "../context/ChatContext";
import { ChatInput } from "./ChatInput";
import { MessageItem } from "./MessageItem";
import { Suggestions } from "./Suggestions";
import { TypingIndicator } from "./TypingIndicator";

export const ChatArea: React.FC = () => {
	const { messages, isLoading } = useChat();
	const scrollRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = useCallback(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTo({
				top: scrollRef.current.scrollHeight,
				behavior: "smooth",
			});
		}
	}, []);

	useEffect(() => {
		scrollToBottom();
	}, [scrollToBottom]);

	return (
		<div className="flex-1 flex flex-col bg-white relative">
			<div
				ref={scrollRef}
				className="flex-1 overflow-y-auto px-4 md:px-0 scroll-smooth flex flex-col"
			>
				<div
					className={`max-w-3xl mx-auto py-8 w-full ${messages.length === 0 ? "flex-1 flex items-center justify-center" : ""}`}
				>
					{messages.length === 0 ? (
						<Suggestions />
					) : (
						<div className="flex flex-col pb-4">
							{messages.map((msg) => (
								<MessageItem key={msg.id} message={msg} />
							))}
							{isLoading && <TypingIndicator />}
						</div>
					)}
				</div>
			</div>
			<ChatInput />
		</div>
	);
};
