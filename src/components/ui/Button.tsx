import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	children: ReactNode;
	variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
	size?: "sm" | "md" | "lg";
	isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	function Button(
		{
			children,
			variant = "primary",
			size = "md",
			isLoading,
			className = "",
			disabled,
			type = "button",
			...props
		},
		ref,
	) {
		const baseStyles =
			"inline-flex items-center justify-center rounded-xl font-medium transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

		const variants = {
			primary: "bg-secondary text-white hover:bg-primary shadow-sm",
			secondary: "bg-emerald-100 text-secondary hover:bg-emerald-200",
			outline: "border border-white/10 text-white hover:bg-white/10",
			danger: "text-emerald-200/50 hover:text-red-300 hover:bg-red-500/10",
			ghost: "p-2 text-secondary hover:bg-emerald-50 rounded-lg",
		};

		const sizes = {
			sm: "px-3 py-1.5 text-xs",
			md: "px-6 py-2.5 text-sm",
			lg: "px-8 py-3 text-base",
		};

		const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

		return (
			<button
				ref={ref}
				type={type}
				className={combinedClassName}
				disabled={disabled || isLoading}
				{...props}
			>
				{isLoading ? (
					<div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
				) : null}
				{children}
			</button>
		);
	},
);
