import { request } from "./client.js";

export interface User {
  _id: string;
  fullName: string;
  email: string;
  role: "seeker" | "recruiter";
  location: string;
  companyName?: string;
  jobTitle?: string;
  skills?: string[];
  preferredRadius?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  fullName: string;
  email: string;
  password: string;
  role: "seeker" | "recruiter";
  location: string;
  companyName?: string;
}

export interface UpdateUserInput {
  fullName?: string;
  location?: string;
  companyName?: string;
  jobTitle?: string;
  skills?: string[];
  preferredRadius?: number;
}

export const usersApi = {
  list: () => request<{ users: User[]; total: number }>("/users"),

  get: (id: string) => request<User>(`/users/${id}`),

  create: (data: CreateUserInput) =>
    request<User>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateUserInput) =>
    request<User>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/users/${id}`, {
      method: "DELETE",
    }),
};
