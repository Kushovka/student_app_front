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

export const getStudents = async (
  grade?: number,
  class_letter?: string,
): Promise<StudentResponce[]> => {
  const { data } = await api.get("/student/", {
    params: { grade, class_letter },
  });
  console.log(data);
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
