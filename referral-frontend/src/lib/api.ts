const API_URL = import.meta.env.VITE_API_URL || "";

function getToken(): string | null {
  return localStorage.getItem("token");
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["X-Auth-Token"] = token;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Request failed");
  }
  return data;
}

export const api = {
  signup: (username: string, email: string, password: string, referral_code?: string) =>
    request("/api/users/signup", {
      method: "POST",
      body: JSON.stringify({ username, email, password, referral_code }),
    }),
  login: (email: string, password: string) =>
    request("/api/users/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  getProfile: () => request("/api/users/me"),
  getTransactions: () => request("/api/users/transactions"),
  activate: () => request("/api/users/activate", { method: "POST" }),
  deposit: (amount: number) =>
    request(`/api/users/deposit?amount=${amount}`, { method: "POST" }),
  withdraw: (amount: number) =>
    request(`/api/users/withdraw?amount=${amount}`, { method: "POST" }),

  getReferrals: () => request("/api/referrals/my-referrals"),

  spinWheel: () => request("/api/spin/wheel", { method: "POST" }),
  spinStatus: () => request("/api/spin/status"),

  collectStar: () => request("/api/stars/collect", { method: "POST" }),
  claimStars: () => request("/api/stars/claim", { method: "POST" }),
  starStatus: () => request("/api/stars/status"),
  giftStar: (receiver_username: string, star_value: number) =>
    request("/api/stars/gift", {
      method: "POST",
      body: JSON.stringify({ receiver_username, star_value }),
    }),
  getGiftDashboard: () => request("/api/stars/gifts"),

  getMicrotasks: () => request("/api/microtasks/"),
  completeTask: (taskId: number) =>
    request(`/api/microtasks/${taskId}/complete`, { method: "POST" }),

  boosterDeposit: () => request("/api/booster/deposit", { method: "POST" }),
  boosterWithdraw: () => request("/api/booster/withdraw", { method: "POST" }),
  boosterStatus: () => request("/api/booster/status"),

  getLeaderboard: () => request("/api/leaderboard"),
  getDailyCredits: () => request("/api/daily-credits"),
  claimDailyCredits: () => request("/api/daily-credits/claim", { method: "POST" }),
  getDiamondDraw: () => request("/api/diamond-draw"),
  enterDiamondDraw: () => request("/api/diamond-draw/enter", { method: "POST" }),
};
