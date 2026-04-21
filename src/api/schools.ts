import { api } from "./client";

export interface School {
  id: string;
  name: string;
  city: string;
  created_at: string;
}

export const getSchools = async () => {
  const { data } = await api.get<School[]>("/schools/");
  return data;
};
