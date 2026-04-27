import { api } from "./client";
import type { AuthUser } from "./profile";

export interface AuthUserPayload {
  first_name: string;
  last_name: string;
  middle_name: string;
  email: string;
  password: string;
  school_id: string;
  role?: "admin" | "teacher";
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: "bearer";
}

export interface UpdateMePayload {
  first_name: string;
  last_name: string;
  middle_name: string;
  email: string;
}

export const registerUser = async (payload: AuthUserPayload) => {
  const { data } = await api.post<AuthUser>("/auth/register", payload);
  return data;
};

export const loginUser = async (payload: LoginPayload) => {
  const { data } = await api.post<LoginResponse>("/auth/login", payload);
  return data;
};
