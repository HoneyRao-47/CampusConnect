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

    // Overview
    if (path.includes("/overview")) {
      return {
        points: 1240,
        tasks: 6,
        rank: 2,
        streak: 10
      };
    }

    // Leaderboard (professional names)
    if (path.includes("/leaderboard")) {
      return [
        { name: "Aarav Sharma", points: 1500, rank: 1 },
        { name: "Meera Nair", points: 1240, rank: 2 },
        { name: "Rohan Verma", points: 1100, rank: 3 }
      ];
    }

    // Tasks
    if (path.includes("/tasks") && options.method !== "POST") {
      return [
        { id: 1, title: "Promote CampusConnect on Instagram", points: 100 },
        { id: 2, title: "Refer 5 Students", points: 200 },
        { id: 3, title: "Write Blog Post", points: 300 }
      ];
    }

    // Ambassadors
    if (path.includes("/ambassadors")) {
      return [
        { name: "Aarav Sharma", points: 1500 },
        { name: "Meera Nair", points: 1240 },
        { name: "Rohan Verma", points: 1100 }
      ];
    }

    // Submit Task
    if (path.includes("/submit")) {
      return {
        success: true,
        awardedPoints: 100,
        message: "Task submitted successfully"
      };
    }

    throw error;
  }
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