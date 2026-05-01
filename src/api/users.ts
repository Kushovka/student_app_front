import { api } from "./client";

export interface UserSchoolInfo {
  id: string;
  name: string;
  city: string;
  created_at?: string;
}

export interface UserListItem {
  id: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  email: string;
  role: string;
  is_blocked?: boolean;
  school_id: string;
  school?: UserSchoolInfo;
}

export const getUsers = async (): Promise<UserListItem[]> => {
  const { data } = await api.get<UserListItem[]>("/users/");
  return data;
};

export const getUserById = async (userId: string): Promise<UserListItem> => {
  const { data } = await api.get<UserListItem>(`/users/${userId}`);
  return data;
};

export const updateUserRole = async (
  userId: string,
  role: string,
): Promise<UserListItem> => {
  const { data } = await api.patch<UserListItem>(`/users/${userId}/role`, {
    role,
  });
  return data;
};

export const updateUserBlockStatus = async (
  userId: string,
  is_blocked: boolean,
): Promise<UserListItem> => {
  const { data } = await api.patch<UserListItem>(`/users/${userId}/block`, {
    is_blocked,
  });
  return data;
};

export const deleteUser = async (userId: string): Promise<void> => {
  await api.delete(`/users/${userId}`);
};
