export interface User {
	id: string;
	name: string;
	email: string;
	role: 'rd_staff' | 'admin';
	avatar?: string;
}

export interface LoginCredentials {
	email: string;
	password: string;
}

export interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
}
