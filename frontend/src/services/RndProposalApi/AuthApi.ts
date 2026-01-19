import { type User, type LoginCredentials, Role } from '../../types/auth';

// Dummy users for demonstration
const DUMMY_USERS: User[] = [
	{
		id: '1',
		name: 'Dr. John Smith',
		email: 'j.smith@wmsu.edu.ph',
		roles: [Role.RND]
	},
	{
		id: '2',
		name: 'Dr. Maria Santos',
		email: 'm.santos@wmsu.edu.ph',
		roles: [Role.RND] 
	},
	{
		id: '3',
		name: 'Admin User',
		email: 'admin@wmsu.edu.ph',
		roles: [Role.ADMIN]
	}
];

export const authApi = {
	// Login function
	login: async (credentials: LoginCredentials): Promise<User> => {
		// Simulate API delay
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Find user by email
		const user = DUMMY_USERS.find((u) => u.email === credentials.email);

		if (!user) {
			throw new Error('Invalid email or password');
		}

		// For demo purposes, accept any password for valid emails
		// In real implementation, you would verify the password hash
		if (credentials.password.length < 6) {
			throw new Error('Invalid email or password');
		}

		console.log('User logged in:', user);

		// Store auth token in localStorage (in real app, use secure storage)
		localStorage.setItem('wmsu_auth_token', `token_${user.id}`);
		localStorage.setItem('wmsu_user', JSON.stringify(user));

		return user;
	},

	// Logout function
	logout: async (): Promise<void> => {
		// Simulate API delay
		await new Promise((resolve) => setTimeout(resolve, 300));

		console.log('User logged out');

		// Clear auth data
		localStorage.removeItem('wmsu_auth_token');
		localStorage.removeItem('wmsu_user');
	},

	// Check if user is authenticated
	checkAuth: async (): Promise<User | null> => {
		// Simulate API delay
		await new Promise((resolve) => setTimeout(resolve, 500));

		const token = localStorage.getItem('wmsu_auth_token');
		const userStr = localStorage.getItem('wmsu_user');

		if (!token || !userStr) {
			return null;
		}

		try {
			const user = JSON.parse(userStr);
			console.log('Auth check successful:', user);
			return user;
		} catch (error) {
			console.error('Auth check failed:', error);
			// Clear invalid data
			localStorage.removeItem('wmsu_auth_token');
			localStorage.removeItem('wmsu_user');
			return null;
		}
	}
};