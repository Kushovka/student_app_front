import { api } from "./client";

export interface SystemUpdate {
  id: string;
  title: string;
  description: string;
  published_at: string;
}

export interface SystemUpdatesResponse {
  items: SystemUpdate[];
  unread_count: number;
}

export const getSystemUpdates = async (): Promise<SystemUpdatesResponse> => {
  const { data } = await api.get<SystemUpdatesResponse>("/system-updates");
  return data;
};

export const markSystemUpdatesRead = async (): Promise<SystemUpdatesResponse> => {
  const { data } = await api.patch<SystemUpdatesResponse>("/system-updates/read");
  return data;
};
