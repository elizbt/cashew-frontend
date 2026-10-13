export interface User {
	id: string;
	name: string;
	email: string;
}

export interface AuthResponse {
	user: User;
	// Kept optional for backward compatibility: the backend may still include
	// this in the response body, but auth now rides on an httpOnly session
	// cookie (see services/api.ts) — the frontend no longer reads or stores it.
	token?: string;
}

export interface RegisterResponse {
	id: string;
	name: string;
	email: string;
}

export interface LoginCredentials {
	email: string;
	password: string;
}

export interface RegisterData {
	name: string;
	email: string;
	password: string;
}

export interface ApiError {
	response?: {
		data?: {
			message?: string;
			issues?: Array<{
				message: string;
			}>;
		};
	};
}
