const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8787";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Request failed.");
  }
  return response.json();
}

export const api = {
  getOverview: () => request("/api/overview"),
  getTasks: () => request("/api/tasks"),
  getLeaderboard: () => request("/api/leaderboard"),
  getAmbassadors: () => request("/api/ambassadors"),
  submitTask: (taskId, formData) =>
    request(`/api/tasks/${taskId}/submit`, {
      method: "POST",
      body: formData
    })
};
