import { request } from "./client.js";

export interface Application {
  _id: string;
  job: string | { _id: string; title: string; company: string; location: string; salary?: string; type: string };
  seeker: string | { _id: string; fullName: string; email: string; skills?: string[]; jobTitle?: string; location: string };
  recruiter: string;
  status: 'applied' | 'reviewing' | 'interview' | 'offer' | 'rejected';
  timeline: Array<{ label: string; date: string; done: boolean }>;
  note?: string;
  jobTitle: string;
  company: string;
  location: string;
  jobType: string;
  salary?: string;
  createdAt: string;
  updatedAt: string;
}

export const applicationsApi = {
  getMyApplications: () => request<Application[]>('/applications'),
  applyToJob: (jobId: string) => request<Application>('/applications', { method: 'POST', body: JSON.stringify({ jobId }) }),
  getJobApplications: (jobId: string) => request<Application[]>(`/applications/job/${jobId}`),
  updateStatus: (id: string, status: Application['status'], note?: string) =>
    request<Application>(`/applications/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, note }) }),
};
