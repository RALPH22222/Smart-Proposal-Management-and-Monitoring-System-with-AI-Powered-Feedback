export interface User {
  id: string;
  name: string;
  email: string;
  roles: Role[];
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
    roles: Role[];
  };
  session_id: string;
};

export enum Role {
  CO_LEAD = "co_lead",
  EVALUATOR = "evaluator",
  RND = "rnd",
  RDEC = "rdec",
  PROPONENT = "proponent",
  ADMIN = "admin",
}
