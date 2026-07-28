export interface User {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
