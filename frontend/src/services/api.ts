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

  getAvailableGuards: async () => {
    const res = await fetch(`${API_BASE}/api/users/guards/available`, {
      headers: getHeaders(true),
    });
    return handleResponse<any[]>(res);
  },

  // --- INCIDENTS ---
  createIncident: async (data: any) => {
    const res = await fetch(`${API_BASE}/api/incidents`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  getIncidents: async (params?: { status?: string; my_reports_only?: boolean; assigned_to_me?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append("status", params.status);
    if (params?.my_reports_only) searchParams.append("my_reports_only", "true");
    if (params?.assigned_to_me) searchParams.append("assigned_to_me", "true");
    const res = await fetch(`${API_BASE}/api/incidents?${searchParams.toString()}`, {
      headers: getHeaders(true),
    });
    return handleResponse<any[]>(res);
  },

  assignIncident: async (incidentId: number, data: { assigned_to_id: number; notes?: string }) => {
    const res = await fetch(`${API_BASE}/api/incidents/${incidentId}/assign`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  updateIncidentStatus: async (incidentId: number, data: { status: string; notes?: string; report_url?: string }) => {
    const res = await fetch(`${API_BASE}/api/incidents/${incidentId}/update-status`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(data),
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
