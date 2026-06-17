import type React from "react";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";
import type { AuthResponse, User } from "../types/auth";
import { STORAGE_KEYS } from "../types/storage";

interface AuthContextData {
	user: User | null;
	loading: boolean;
	signIn: (response: AuthResponse) => void;
	signOut: () => void;
	isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
		const storedUser = localStorage.getItem(STORAGE_KEYS.USER);

		if (storedToken && storedUser) {
			setUser(JSON.parse(storedUser));
		}
		setLoading(false);
	}, []);

	const signIn = ({ user, token }: AuthResponse) => {
		localStorage.setItem(STORAGE_KEYS.TOKEN, token);
		localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
		setUser(user);
	};

	const signOut = () => {
		// Clear all keys from localStorage
		Object.values(STORAGE_KEYS).forEach((key) => {
			if (typeof key === "string") {
				localStorage.removeItem(key);
			}
		});

		// Also clear all cache entries (since they use a function)
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key?.startsWith("@Castanha:chat_cache_")) {
				localStorage.removeItem(key);
				i--; // Adjust index after removal
			}
		}

		setUser(null);
		window.location.href = "/login";
	};

	return (
		<AuthContext.Provider
			value={{ user, loading, signIn, signOut, isAuthenticated: !!user }}
		>
			{!loading && children}
		</AuthContext.Provider>
	);
};

export function useAuth() {
	const context = useContext(AuthContext);
	return context;
}
