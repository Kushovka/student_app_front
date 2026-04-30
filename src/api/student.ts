import type { BehaviorCreate } from "../types/behavior.types";
import type { StudentResponce } from "../types/student.type";
import { api } from "./client";

interface CreateStudent {
  first_name: string;
  last_name: string;
  middle_name: string;
  email: string;
  grade: number;
  class_letter: string;
}

export interface StudentsListResponse {
  items: StudentResponce[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const getStudents = async (
  grade?: number,
  class_letter?: string,
  search?: string,
  page?: number,
  limit?: number,
): Promise<StudentsListResponse> => {
  const { data } = await api.get<StudentsListResponse>("/student/", {
    params: { grade, class_letter, search, page, limit },
  });
  return data;
};

export const createStudents = async (payload: CreateStudent) => {
  const { data } = await api.post("/student/", payload);
  return data;
};

export const getStudentById = async (
  studentId: string,
): Promise<StudentResponce> => {
  const { data } = await api.get(`/student/${studentId}`);

  return data;
};

export const addBehavior = async (
  studentId: string,
  payload: BehaviorCreate,
) => {
  const { data } = await api.post(`/behavior/${studentId}`, payload);
  return data;
};

export const getBehaviorHistory = async (studentId: string) => {
  const { data } = await api.get(`/behavior/${studentId}`);
  return data;
};
