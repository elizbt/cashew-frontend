import type { ReactNode } from "react";

interface CardProps {
	children: ReactNode;
	className?: string;
	variant?: "default" | "glass" | "emerald";
}

export const Card = ({
	children,
	className = "",
	variant = "default",
}: CardProps) => {
	const variants = {
		default: "bg-white border border-slate-100",
		glass: "bg-white/80 backdrop-blur-sm border border-white/20",
		emerald: "bg-emerald-50/30 border border-emerald-100",
	};

	return (
		<div className={`rounded-2xl shadow-sm ${variants[variant]} ${className}`}>
			{children}
		</div>
	);
};
