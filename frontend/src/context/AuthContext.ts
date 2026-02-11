import { createContext, useContext } from "react";

export type AuthUser = {
  id: string;
  email: string;
  roles: string[];
  first_name?: string;
  last_name?: string;
  profile_photo_url?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  verifyToken: () => Promise<AuthUser | undefined>;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: false,
  isAuthenticated: false,
  verifyToken: async () => undefined,
  logout: async () => { },
  setUser: () => { },
});

export const useAuthContext = () => useContext(AuthContext);

export default AuthContext;
