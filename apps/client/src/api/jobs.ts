import { request } from "./client.js";

export interface Job {
  _id: string;
  title: string;
  company: string;
  type: "full-time" | "part-time" | "contract" | "freelance";
  location: string;
  salary?: string;
  description: string;
  skills: string[];
  recruiter: string;
  radiusKm?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JobsListResponse {
  jobs: Job[];
  total: number;
  page: number;
  pages: number;
}

export interface CreateJobInput {
  title: string;
  company: string;
  type: string;
  location: string;
  description: string;
  salary?: string;
  skills?: string[];
  radiusKm?: number;
}

export const jobsApi = {
  list: (params?: { type?: string; search?: string; page?: number }) => {
    const qs = new URLSearchParams();
    if (params?.type) qs.set("type", params.type);
    if (params?.search) qs.set("search", params.search);
    if (params?.page) qs.set("page", String(params.page));
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return request<JobsListResponse>(`/jobs${query}`);
  },

  get: (id: string) => request<Job>(`/jobs/${id}`),

  create: (data: CreateJobInput) =>
    request<Job>("/jobs", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<CreateJobInput>) =>
    request<Job>(`/jobs/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/jobs/${id}`, {
      method: "DELETE",
    }),
};
