/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			keyframes: {
				fadein: {
					"0%": { opacity: "0", transform: "translateY(10px)" },
					"100%": { opacity: "1", transform: "translateY(0)" },
				},
			},
			animation: {
				in: "fadein 0.3s ease-out forwards",
			},
			colors: {
				primary: "#064e3b", // Emerald 900
				secondary: "#059669", // Emerald 600
				background: "#ffffff", // Pure white
				accent: "#10b981", // Emerald 500
			},
			fontFamily: {
				serif: ["Merriweather", "serif"],
				sans: ["Outfit", "Inter", "sans-serif"],
			},
		},
	},
	plugins: [],
};
