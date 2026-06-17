export interface User {
	id: string;
	name: string;
	email: string;
}

export interface AuthResponse {
	user: User;
	token: string;
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
