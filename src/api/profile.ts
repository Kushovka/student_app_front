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
  role?: "superadmin" | "admin" | "teacher" | "parent";
  max_connected?: boolean;
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

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export const changePassword = async (payload: ChangePasswordPayload) => {
  await api.patch("/profile/me/password", payload);
};

export interface MaxLinkCodeResponse {
  code: string;
  bot_username?: string | null;
  connected: boolean;
}

export const getMaxLinkCode = async () => {
  const { data } = await api.get<MaxLinkCodeResponse>("/max/link-code");
  return data;
};
