import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 2. Check for saved user on App Start
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user_session');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error("Failed to load user session", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  // 3. Login Function (Saves to State & Storage)
  const login = async (userData: User) => {
    try {
      setUser(userData);
      await AsyncStorage.setItem('user_session', JSON.stringify(userData));
    } catch (e) {
      console.error("Failed to save login session", e);
    }
  };

  // 4. Logout Function (Clears State & Storage)
  const logout = async () => {
    try {
      setUser(null);
      await AsyncStorage.removeItem('user_session');
      router.replace('/' as any);
    } catch (e) {
      console.error("Failed to logout", e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
