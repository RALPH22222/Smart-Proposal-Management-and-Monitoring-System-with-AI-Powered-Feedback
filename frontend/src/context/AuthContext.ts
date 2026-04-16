import { createContext, useContext } from "react";

export type AccountType = "internal" | "external";

export type AuthUser = {
  id: string;
  email: string;
  roles: string[];
  // External-collaborator flag. 'external' users are outsiders who were invited as
  // co-leads to a project; the UI gates them to the monitoring page only. 'internal'
  // users are WMSU employees/students with a @wmsu.edu.ph email and see the full
  // proponent UI. The authorizer auto-upgrades external → internal on login if the
  // user has switched to a WMSU email.
  account_type?: AccountType;
  first_name?: string;
  last_name?: string;
  profile_photo_url?: string;
  department_id?: number | null;
  department_name?: string | null;
};

// Helper: is this user an external collaborator (co-lead only)? Treats missing flag as
// internal (legacy grandfathering) so existing accounts keep working.
export const isExternalAccount = (user: AuthUser | null | undefined): boolean =>
  user?.account_type === "external";

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
