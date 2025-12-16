export type DecodedToken = {
  aud: string;
  email: string;
  exp: number;
  iat: number;
  role: string;
  session_id: string;
  sub: string;
  phone: string;
  user_metadata: {
    email: string;
    email_verified: boolean;
    name: string;
    phone_verified: boolean;
    role: string;
    sub: string;
  };
};
