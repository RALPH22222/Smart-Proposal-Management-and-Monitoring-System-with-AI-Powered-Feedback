export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
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

export type SupabaseAuthToken = {
  sub: string;
  email: string;
  app_metadata: {
    provider: string;
    providers: string[];
  };
  user_metadata: {
    email_verified: boolean;
    name: string;
    role: Role;
  };
  session_id: string;
};

export enum Role {
  PROPONENT = "proponent",
  EVALUATOR = "evaluator",
  RND = "rnd",
  RDEC = "rdec",
  PROJECT_LEAD = "project_lead",
  ADMIN = "admin",
}
