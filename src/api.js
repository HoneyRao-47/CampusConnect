const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8787";

async function request(path, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${path}`, options);

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "Request failed.");
    }

    return response.json();
  } catch (error) {
    console.warn("API failed, using mock data");

    // 🔥 MOCK DATA FALLBACK

    // Overview
    if (path.includes("/overview")) {
      return {
        points: 1200,
        tasks: 5,
        rank: 1,
        streak: 12
      };
    }

    // Leaderboard
    if (path.includes("/leaderboard")) {
      return [
        { name: "You", points: 1200, rank: 1 },
        { name: "Rahul", points: 950, rank: 2 },
        { name: "Anjali", points: 870, rank: 3 }
      ];
    }

    // Tasks
    if (path.includes("/tasks") && options.method !== "POST") {
      return [
        { id: 1, title: "Share Instagram Post", points: 100 },
        { id: 2, title: "Refer a Friend", points: 200 },
        { id: 3, title: "Attend Event", points: 300 }
      ];
    }

    // Ambassadors
    if (path.includes("/ambassadors")) {
      return [
        { name: "You", points: 1200 },
        { name: "Rahul", points: 950 }
      ];
    }

    // Submit Task
    if (path.includes("/submit")) {
      return {
        success: true,
        awardedPoints: 100,
        message: "Task submitted successfully (mock)"
      };
    }

    throw error;
  }
}

// ✅ KEEP THIS SAME
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