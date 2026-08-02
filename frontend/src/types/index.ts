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

export interface AnimalSpecies {
  id: number;
  animal_name: string;
  scientific_name?: string;
  category: string;
  danger_level: "Low" | "Medium" | "High" | "Critical" | string;
  conservation_status: "Least Concern" | "Near Threatened" | "Vulnerable" | "Endangered" | "Critically Endangered" | string;
  description?: string;
  image?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MonitoringStation {
  id: number;
  station_name: string;
  district_id?: number;
  district_name?: string;
  head_officer_id?: number;
  head_officer_name?: string;
  status?: string;
  address?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  is_active?: boolean;
}

export interface District {
  id: number;
  district_name: string;
  state_id?: number;
  state_name?: string;
}

export interface Incident {
  id: number;
  reference_id?: string;
  incident_title?: string;
  incident_category?: string;
  animal_species_id?: number;
  animal_species_name?: string;
  animal_type: string;
  animal: string;
  severity: "Low" | "Medium" | "High" | "Critical" | string;
  description?: string;
  latitude?: number;
  longitude?: number;
  location?: string;
  address?: string;
  village_id?: number;
  village_name?: string;
  station_id?: number;
  station_name?: string;
  district_id?: number;
  district_name?: string;
  state_id?: number;
  state_name?: string;
  weather?: string;
  people_injured: boolean;
  livestock_damage: boolean;
  property_damage: boolean;
  crop_damage: boolean;
  status: string;
  incident_status?: string;
  reported_by?: number;
  reporter_name?: string;
  reporter_role?: string;
  photo_url?: string;
  images: string[];
  contact_number?: string;
  date_reported?: string;
  time_reported?: string;
  assigned_guard_id?: number;
  assigned_guard_name?: string;
  assignment_notes?: string;
  created_at: string;
}

export interface OfficerPostingHistory {
  id: number;
  officer_id: number;
  officer_name?: string;
  old_station_id?: number;
  old_station_name?: string;
  new_station_id: number;
  new_station_name?: string;
  transfer_date: string;
  reason?: string;
  created_by_name?: string;
}

export interface IncidentActivity {
  id: number;
  incident_id: number;
  user_id?: number;
  user_name?: string;
  user_role?: string;
  action: string;
  remarks?: string;
  created_at: string;
}
