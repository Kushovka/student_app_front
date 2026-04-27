import { api } from "./client";

export interface SchoolInfo {
  id: string;
  name: string;
  city: string;
  created_at?: string;
}

export interface AuthUser {
  id: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  email: string;
  school_id: string;
  role?: "admin" | "teacher";
  school?: SchoolInfo;
}

export interface UpdateMePayload {
  first_name: string;
  last_name: string;
  middle_name: string;
  email: string;
}

export const getMe = async () => {
  const { data } = await api.get<AuthUser>("/profile/me");
  return data;
};

export const updateMe = async (payload: UpdateMePayload) => {
  const { data } = await api.patch<AuthUser>("/profile/me", payload);
  return data;
};

