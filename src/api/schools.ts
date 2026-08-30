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

export interface SchoolPayload {
  name: string;
  city: string;
}

export const createSchool = async (payload: SchoolPayload) => {
  const { data } = await api.post<School>("/schools/", payload);
  return data;
};

export const updateSchool = async (schoolId: string, payload: SchoolPayload) => {
  const { data } = await api.patch<School>(`/schools/${schoolId}`, payload);
  return data;
};

export const deleteSchool = async (schoolId: string) => {
  await api.delete(`/schools/${schoolId}`);
};
