const BASE = "/api";

export interface AuthUser {
  id: string;
  role: "seeker" | "recruiter";
  fullName: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface ApiError {
  error: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  const body = await res.json() as T | ApiError;
  if (!res.ok) {
    throw new Error((body as ApiError).error ?? `Request failed (${res.status})`);
  }
  return body as T;
}

export const auth = {
  register: (payload: {
    role: "seeker" | "recruiter";
    fullName: string;
    email: string;
    password: string;
    location: string;
    companyName?: string;
  }) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export function saveSession(data: AuthResponse) {
  localStorage.setItem("jn_token", data.token);
  localStorage.setItem("jn_user", JSON.stringify(data.user));
}

export function clearSession() {
  localStorage.removeItem("jn_token");
  localStorage.removeItem("jn_user");
}

export function getUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem("jn_user");
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}
