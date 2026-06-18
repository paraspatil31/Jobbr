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
  error?: string;
  message?: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  const text = await res.text();
  let body: T | ApiError;
  try {
    body = text ? (JSON.parse(text) as T | ApiError) : ({} as T);
  } catch {
    if (!res.ok) throw new Error(`Request failed (${res.status})`);
    return {} as T;
  }
  if (!res.ok) {
    const err = body as ApiError;
    throw new Error(err.message ?? err.error ?? `Request failed (${res.status})`);
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

export function getToken(): string | null {
  return localStorage.getItem("jn_token");
}

export function getUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem("jn_user");
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}
