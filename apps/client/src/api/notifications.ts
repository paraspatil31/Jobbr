import { request } from "./client.js";

export interface ApiNotification {
  _id: string;
  user: string;
  type: 'new_job' | 'status_change' | 'saved_match' | 'profile_view' | 'interview_reminder';
  title: string;
  body: string;
  jobId?: string;
  distance?: string;
  read: boolean;
  createdAt: string;
}

export const notificationsApi = {
  getAll: () => request<ApiNotification[]>('/notifications'),
  markRead: (id: string) => request<ApiNotification>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () => request<{ updated: number }>('/notifications/read-all', { method: 'PUT' }),
  delete: (id: string) => request<{ message: string }>(`/notifications/${id}`, { method: 'DELETE' }),
};
