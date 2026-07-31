export interface User {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  role: string;
  is_verified: boolean;
  is_active: boolean;
  village_id?: number;
  designation_id?: number;
  station_id?: number;
  station?: string;
  station_name?: string;
  district_name?: string;
  state_name?: string;
  work_status?: string;
  avatar_url?: string;
  profile_image?: string;
  village_name?: string;
  designation_name?: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
