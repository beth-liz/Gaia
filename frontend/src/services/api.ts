const API_BASE = "http://127.0.0.1:8000";

const getHeaders = (includeAuth = true) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (includeAuth) {
    const token = localStorage.getItem("gaia_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMsg = "An error occurred";
    try {
      const data = await response.json();
      errorMsg = data.detail || data.message || errorMsg;
    } catch {
      errorMsg = `Server error (${response.status})`;
    }
    throw new Error(errorMsg);
  }
  if (response.status === 204) {
    return {} as T;
  }
  return response.json();
}

export const api = {
  // --- AUTH & USER ---
  login: async (credentials: any) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: getHeaders(false),
      body: JSON.stringify(credentials),
    });
    return handleResponse<any>(res);
  },

  registerVillager: async (data: any) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: getHeaders(false),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(true),
    });
    return handleResponse<any>(res);
  },

  getProfile: async () => {
    const res = await fetch(`${API_BASE}/api/users/profile`, {
      headers: getHeaders(true),
    });
    return handleResponse<any>(res);
  },

  updateProfile: async (data: any) => {
    const res = await fetch(`${API_BASE}/api/users/profile`, {
      method: "PUT",
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  uploadProfileImage: async (formData: FormData) => {
    const token = localStorage.getItem("gaia_token");
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}/api/users/profile-image`, {
      method: "POST",
      headers,
      body: formData,
    });
    return handleResponse<any>(res);
  },

  // --- VILLAGES & DESIGNATIONS ---
  getVillages: async () => {
    const res = await fetch(`${API_BASE}/api/villages`, {
      headers: getHeaders(false),
    });
    return handleResponse<any[]>(res);
  },

  createVillage: async (data: any) => {
    const res = await fetch(`${API_BASE}/api/villages`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  getDesignations: async () => {
    const res = await fetch(`${API_BASE}/api/designations`, {
      headers: getHeaders(true),
    });
    return handleResponse<any[]>(res);
  },

  createDesignation: async (data: any) => {
    const res = await fetch(`${API_BASE}/api/designations`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  updateDesignation: async (id: number, data: any) => {
    const res = await fetch(`${API_BASE}/api/designations/${id}`, {
      method: "PUT",
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  deleteDesignation: async (id: number) => {
    const res = await fetch(`${API_BASE}/api/designations/${id}`, {
      method: "DELETE",
      headers: getHeaders(true),
    });
    return handleResponse<any>(res);
  },

  // --- STATES & DISTRICTS & MONITORING STATIONS ---
  getStates: async () => {
    const res = await fetch(`${API_BASE}/api/states`, {
      headers: getHeaders(true),
    });
    return handleResponse<any[]>(res);
  },

  createState: async (data: any) => {
    const res = await fetch(`${API_BASE}/api/states`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  updateState: async (id: number, data: any) => {
    const res = await fetch(`${API_BASE}/api/states/${id}`, {
      method: "PUT",
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  deleteState: async (id: number) => {
    const res = await fetch(`${API_BASE}/api/states/${id}`, {
      method: "DELETE",
      headers: getHeaders(true),
    });
    return handleResponse<any>(res);
  },

  getDistricts: async (stateId?: number) => {
    const query = stateId ? `?state_id=${stateId}` : "";
    const res = await fetch(`${API_BASE}/api/districts${query}`, {
      headers: getHeaders(true),
    });
    return handleResponse<any[]>(res);
  },

  createDistrict: async (data: any) => {
    const res = await fetch(`${API_BASE}/api/districts`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  updateDistrict: async (id: number, data: any) => {
    const res = await fetch(`${API_BASE}/api/districts/${id}`, {
      method: "PUT",
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  deleteDistrict: async (id: number) => {
    const res = await fetch(`${API_BASE}/api/districts/${id}`, {
      method: "DELETE",
      headers: getHeaders(true),
    });
    return handleResponse<any>(res);
  },

  getMonitoringStations: async (districtId?: number) => {
    const query = districtId ? `?district_id=${districtId}` : "";
    const res = await fetch(`${API_BASE}/api/monitoring-stations${query}`, {
      headers: getHeaders(true),
    });
    return handleResponse<any[]>(res);
  },

  createMonitoringStation: async (data: any) => {
    const res = await fetch(`${API_BASE}/api/monitoring-stations`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  updateMonitoringStation: async (id: number, data: any) => {
    const res = await fetch(`${API_BASE}/api/monitoring-stations/${id}`, {
      method: "PUT",
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  deleteMonitoringStation: async (id: number) => {
    const res = await fetch(`${API_BASE}/api/monitoring-stations/${id}`, {
      method: "DELETE",
      headers: getHeaders(true),
    });
    return handleResponse<any>(res);
  },

  // --- VILLAGERS & OFFICERS MANAGEMENT ---
  getVillagers: async (status?: string) => {
    const query = status ? `?status=${status}` : "";
    const res = await fetch(`${API_BASE}/api/users/villagers${query}`, {
      headers: getHeaders(true),
    });
    return handleResponse<any[]>(res);
  },

  approveVillager: async (id: number) => {
    const res = await fetch(`${API_BASE}/api/users/villagers/${id}/approve`, {
      method: "PUT",
      headers: getHeaders(true),
    });
    return handleResponse<any>(res);
  },

  rejectVillager: async (id: number) => {
    const res = await fetch(`${API_BASE}/api/users/villagers/${id}/reject`, {
      method: "PUT",
      headers: getHeaders(true),
    });
    return handleResponse<any>(res);
  },

  getOfficers: async (role?: string) => {
    const query = role ? `?role=${encodeURIComponent(role)}` : "";
    const res = await fetch(`${API_BASE}/api/users/officers${query}`, {
      headers: getHeaders(true),
    });
    return handleResponse<any[]>(res);
  },

  createOfficer: async (data: any) => {
    const res = await fetch(`${API_BASE}/api/users/officers`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  updateOfficer: async (id: number, data: any) => {
    const res = await fetch(`${API_BASE}/api/users/officers/${id}`, {
      method: "PUT",
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  toggleOfficerStatus: async (id: number) => {
    const res = await fetch(`${API_BASE}/api/users/officers/${id}/toggle-status`, {
      method: "PUT",
      headers: getHeaders(true),
    });
    return handleResponse<any>(res);
  },

  deleteOfficer: async (id: number) => {
    const res = await fetch(`${API_BASE}/api/users/officers/${id}`, {
      method: "DELETE",
      headers: getHeaders(true),
    });
    return handleResponse<any>(res);
  },

  getAvailableGuards: async (stationId?: number) => {
    const query = stationId ? `?station_id=${stationId}` : "";
    const res = await fetch(`${API_BASE}/api/users/guards/available${query}`, {
      headers: getHeaders(true),
    });
    return handleResponse<any[]>(res);
  },

  // --- ANIMAL SPECIES ---
  getAnimalSpecies: async (activeOnly?: boolean) => {
    const query = activeOnly ? "?active_only=true" : "";
    const res = await fetch(`${API_BASE}/api/animal-species${query}`, {
      headers: getHeaders(false),
    });
    return handleResponse<any[]>(res);
  },

  getAnimalSpeciesById: async (id: number) => {
    const res = await fetch(`${API_BASE}/api/animal-species/${id}`, {
      headers: getHeaders(false),
    });
    return handleResponse<any>(res);
  },

  createAnimalSpecies: async (data: any) => {
    const res = await fetch(`${API_BASE}/api/animal-species`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  updateAnimalSpecies: async (id: number, data: any) => {
    const res = await fetch(`${API_BASE}/api/animal-species/${id}`, {
      method: "PUT",
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  uploadSpeciesImage: async (id: number, formData: FormData) => {
    const token = localStorage.getItem("gaia_token");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/api/animal-species/${id}/upload-image`, {
      method: "POST",
      headers,
      body: formData,
    });
    return handleResponse<any>(res);
  },

  deleteAnimalSpecies: async (id: number) => {
    const res = await fetch(`${API_BASE}/api/animal-species/${id}`, {
      method: "DELETE",
      headers: getHeaders(true),
    });
    return handleResponse<any>(res);
  },

  // --- INCIDENTS ---
  uploadIncidentImages: async (formData: FormData) => {
    const token = localStorage.getItem("gaia_token");
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/api/incidents/upload-images`, {
      method: "POST",
      headers,
      body: formData,
    });
    return handleResponse<string[]>(res);
  },

  createIncident: async (data: any) => {
    const res = await fetch(`${API_BASE}/api/incidents`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  getIncidents: async (params?: {
    status?: string;
    station_id?: number;
    district_id?: number;
    species_id?: number;
    severity?: string;
    date?: string;
    search?: string;
    my_reports_only?: boolean;
    assigned_to_me?: boolean;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append("status", params.status);
    if (params?.station_id) searchParams.append("station_id", String(params.station_id));
    if (params?.district_id) searchParams.append("district_id", String(params.district_id));
    if (params?.species_id) searchParams.append("species_id", String(params.species_id));
    if (params?.severity) searchParams.append("severity", params.severity);
    if (params?.date) searchParams.append("date", params.date);
    if (params?.search) searchParams.append("search", params.search);
    if (params?.my_reports_only) searchParams.append("my_reports_only", "true");
    if (params?.assigned_to_me) searchParams.append("assigned_to_me", "true");

    const res = await fetch(`${API_BASE}/api/incidents?${searchParams.toString()}`, {
      headers: getHeaders(true),
    });
    return handleResponse<any[]>(res);
  },

  getIncidentById: async (id: number) => {
    const res = await fetch(`${API_BASE}/api/incidents/${id}`, {
      headers: getHeaders(true),
    });
    return handleResponse<any>(res);
  },

  updateIncident: async (id: number, data: any) => {
    const res = await fetch(`${API_BASE}/api/incidents/${id}`, {
      method: "PUT",
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  deleteIncident: async (id: number) => {
    const res = await fetch(`${API_BASE}/api/incidents/${id}`, {
      method: "DELETE",
      headers: getHeaders(true),
    });
    return handleResponse<any>(res);
  },

  // --- OFFICER TRANSFER & WORKFLOW ---
  transferOfficer: async (id: number, data: { new_station_id: number; reason?: string; effective_date?: string }) => {
    const res = await fetch(`${API_BASE}/api/users/officers/${id}/transfer`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  getOfficerTransferHistory: async (id: number) => {
    const res = await fetch(`${API_BASE}/api/users/officers/${id}/transfer-history`, {
      headers: getHeaders(true),
    });
    return handleResponse<any[]>(res);
  },

  getStationGuardsWorkflow: async () => {
    const res = await fetch(`${API_BASE}/api/officers/guards`, {
      headers: getHeaders(true),
    });
    return handleResponse<any[]>(res);
  },

  getStationOverviewMetrics: async () => {
    const res = await fetch(`${API_BASE}/api/officers/station-overview`, {
      headers: getHeaders(true),
    });
    return handleResponse<any>(res);
  },

  getIncidentQueue: async () => {
    const res = await fetch(`${API_BASE}/api/incidents/queue`, {
      headers: getHeaders(true),
    });
    return handleResponse<any[]>(res);
  },

  getRFOAssignments: async () => {
    const res = await fetch(`${API_BASE}/api/incidents/rfo/assignments`, {
      headers: getHeaders(true),
    });
    return handleResponse<any[]>(res);
  },

  // --- INCIDENT WORKFLOW & TIMELINE ---
  getIncidentActivities: async (id: number) => {
    const res = await fetch(`${API_BASE}/api/incidents/${id}/activities`, {
      headers: getHeaders(true),
    });
    return handleResponse<any[]>(res);
  },

  rejectIncident: async (id: number, payload: { reason: string }) => {
    const res = await fetch(`${API_BASE}/api/incidents/${id}/reject`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  },

  requestInfoIncident: async (id: number, payload: { message: string }) => {
    const res = await fetch(`${API_BASE}/api/incidents/${id}/request-info`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  },

  verifyCloseIncident: async (id: number, payload: { remarks?: string }) => {
    const res = await fetch(`${API_BASE}/api/incidents/${id}/verify-close`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  },

  assignGuardIncident: async (id: number, payload: { assigned_to_id: number; notes?: string; priority?: string; estimated_response_time?: string; remarks?: string }) => {
    const res = await fetch(`${API_BASE}/api/incidents/${id}/assign`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  },

  fieldUpdateIncident: async (id: number, payload: { step_name: string; remarks?: string }) => {
    const res = await fetch(`${API_BASE}/api/incidents/${id}/field-update`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  },

  submitFinalReport: async (id: number, payload: { actions_taken: string; animal_observed: string; damage_assessment: string; recommendations: string; remarks?: string }) => {
    const res = await fetch(`${API_BASE}/api/incidents/${id}/submit-report`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  },

  approveCloseIncident: async (id: number, payload: { remarks?: string }) => {
    const res = await fetch(`${API_BASE}/api/incidents/${id}/approve-close`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  },

  returnCorrectionIncident: async (id: number, payload: { correction_notes: string }) => {
    const res = await fetch(`${API_BASE}/api/incidents/${id}/return-correction`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(payload),
    });
    return handleResponse<any>(res);
  },

  // --- NOTIFICATIONS ---
  getNotifications: async () => {
    const res = await fetch(`${API_BASE}/api/notifications`, {
      headers: getHeaders(true),
    });
    return handleResponse<any[]>(res);
  },

  markNotificationRead: async (id: number) => {
    const res = await fetch(`${API_BASE}/api/notifications/${id}/read`, {
      method: "PUT",
      headers: getHeaders(true),
    });
    return handleResponse<any>(res);
  },

  deleteNotification: async (id: number) => {
    const res = await fetch(`${API_BASE}/api/notifications/${id}`, {
      method: "DELETE",
      headers: getHeaders(true),
    });
    return handleResponse<any>(res);
  },

  // --- DASHBOARD STATS ---
  getDashboardStats: async () => {
    const res = await fetch(`${API_BASE}/api/dashboard/stats`, {
      headers: getHeaders(true),
    });
    return handleResponse<any>(res);
  },
};
