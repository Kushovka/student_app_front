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
  school_id: string;
  school?: UserSchoolInfo;
}

export const getUsers = async (): Promise<UserListItem[]> => {
  const { data } = await api.get<UserListItem[]>("/users/");
  return data;
};

