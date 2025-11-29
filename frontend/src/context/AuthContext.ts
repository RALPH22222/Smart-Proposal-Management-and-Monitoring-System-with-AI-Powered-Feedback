import { createContext, useContext } from "react";
import type { SupabaseAuthToken } from "../types/auth";

export type AuthUser = {
  email: string;
} & SupabaseAuthToken["user_metadata"];

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
  logout: async () => {},
  setUser: () => {},
});

export const useAuthContext = () => useContext(AuthContext);

export default AuthContext;
