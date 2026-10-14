import type React from "react";
import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";
import { authService } from "../services/api";
import type { AuthResponse, User } from "../types/auth";
import { STORAGE_KEYS } from "../types/storage";

interface AuthContextData {
	user: User | null;
	loading: boolean;
	signIn: (response: AuthResponse) => void;
	signOut: () => Promise<void>;
	isAuthenticated: boolean;
}

function readStoredUser(): User | null {
	const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
	if (!storedUser) return null;
	try {
		return JSON.parse(storedUser) as User;
	} catch {
		// Corrupted cache is equivalent to no cache: the user just logs in again.
		localStorage.removeItem(STORAGE_KEYS.USER);
		return null;
	}
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// The session itself now lives in an httpOnly cookie we can't read from
		// JS, so this is an optimistic hydration from the last known profile,
		// not proof the session is still valid. If the cookie has expired, the
		// next API call gets a 401 and the response interceptor in
		// services/api.ts clears this and redirects to /login.
		// Sessions from before the cookie migration left a readable JWT here;
		// the backend still accepts it as Bearer, so it must not linger.
		localStorage.removeItem(STORAGE_KEYS.TOKEN);

		const storedUser = readStoredUser();
		if (storedUser) {
			setUser(storedUser);
			// The in-memory CSRF token is lost on reload. Best-effort: a 401
			// here is already handled by the response interceptor.
			authService.restoreCsrfToken().catch((error) => {
				console.error("Failed to restore CSRF token:", error);
			});
		}
		setLoading(false);
	}, []);

	const signIn = ({ user }: AuthResponse) => {
		localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
		setUser(user);
	};

	const signOut = async () => {
		try {
			await authService.logout();
		} catch (error) {
			console.error("Failed to invalidate session on the server:", error);
		}

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
