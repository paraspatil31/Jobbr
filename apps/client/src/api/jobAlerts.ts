import { request } from "./client.js";

export interface JobAlert {
  _id: string;
  seeker: string;
  name: string;
  keywords: string;
  jobTypes: string[];
  radius: number;
  latitude?: number;
  longitude?: number;
  salary?: string;
  frequency: 'instant' | 'daily' | 'weekly';
  paused: boolean;
  lastTriggered?: string;
  createdAt: string;
  updatedAt: string;
}

export const jobAlertsApi = {
  getAll: () => request<JobAlert[]>('/job-alerts'),
  create: (data: Partial<JobAlert>) => request<JobAlert>('/job-alerts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<JobAlert>) => request<JobAlert>(`/job-alerts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<{ message: string }>(`/job-alerts/${id}`, { method: 'DELETE' }),
  togglePause: (id: string) => request<JobAlert>(`/job-alerts/${id}/pause`, { method: 'PUT' }),
};
