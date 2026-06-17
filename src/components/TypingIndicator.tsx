import type React from "react";

export const TypingIndicator: React.FC = () => {
	return (
		<div className="flex items-center gap-1.5 px-6 py-4 animate-in fade-in duration-300">
			<div
				className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce"
				style={{ animationDelay: "0ms" }}
			/>
			<div
				className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce"
				style={{ animationDelay: "150ms" }}
			/>
			<div
				className="w-1.5 h-1.5 bg-secondary rounded-full animate-bounce"
				style={{ animationDelay: "300ms" }}
			/>
		</div>
	);
};
