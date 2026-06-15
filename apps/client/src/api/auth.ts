import { request } from "./client.js";

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

export interface RegisterInput {
  role: "seeker" | "recruiter";
  fullName: string;
  email: string;
  password: string;
  location: string;
  companyName?: string;
}

export const authApi = {
  register: (data: RegisterInput) =>
    request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

export function saveSession(data: AuthResponse): void {
  localStorage.setItem("jn_token", data.token);
  localStorage.setItem("jn_user", JSON.stringify(data.user));
}

export function clearSession(): void {
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
