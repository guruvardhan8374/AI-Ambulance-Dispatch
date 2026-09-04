const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    if (window.location.port === "3000") {
      return `${protocol}//${hostname}:8000/api/v1`;
    }
  }
  return "/api/v1";
};

const API_BASE_URL = getApiBaseUrl();


export async function fetchApi(endpoint, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }

  return response.json();
}

// API helper methods
export const api = {
  // Auth
  login: (email, password) => fetchApi("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  getMe: () => fetchApi("/auth/me"),
  register: (userData) => fetchApi("/auth/register", { method: "POST", body: JSON.stringify(userData) }),

  // Emergencies
  createEmergency: (data) => fetchApi("/emergencies/", { method: "POST", body: JSON.stringify(data) }),
  getEmergencies: (status) => fetchApi(`/emergencies/${status ? `?status_filter=${status}` : ""}`),
  getEmergencyDetail: (id) => fetchApi(`/emergencies/${id}`),
  updateEmergencyStatus: (id, statusData) => fetchApi(`/emergencies/${id}/status`, { method: "PATCH", body: JSON.stringify(statusData) }),
  dispatcherOverride: (id, overrideData) => fetchApi(`/emergencies/${id}/override`, { method: "POST", body: JSON.stringify(overrideData) }),

  // Ambulances
  getAmbulances: (status) => fetchApi(`/ambulances/${status ? `?status_filter=${status}` : ""}`),
  updateAmbulanceLocation: (id, location) => fetchApi(`/ambulances/${id}/location`, { method: "PATCH", body: JSON.stringify(location) }),
  updateAmbulanceStatus: (id, statusData) => fetchApi(`/ambulances/${id}/status`, { method: "PATCH", body: JSON.stringify(statusData) }),

  // Hospitals
  getHospitals: () => fetchApi("/hospitals/"),
  updateHospitalCapacity: (id, capacityData) => fetchApi(`/hospitals/${id}`, { method: "PATCH", body: JSON.stringify(capacityData) }),

  // AI Decision Support
  getRecommendedAmbulances: (emergencyId) => fetchApi(`/dispatch/recommend-ambulances/${emergencyId}`),
  getRecommendedHospitals: (emergencyId) => fetchApi(`/dispatch/recommend-hospitals/${emergencyId}`),

  // Analytics & Logs
  getAnalyticsOverview: () => fetchApi("/analytics/overview"),
  getDispatchLogs: () => fetchApi("/emergencies/system/logs"),
};

