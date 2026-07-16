import type { BehaviorCreate } from "../types/behavior.types";
import type { StudentResponce } from "../types/student.type";
import { api } from "./client";

export interface CreateStudent {
  first_name: string;
  last_name: string;
  middle_name: string;
  email: string;
  grade: number;
  class_letter: string;
}

export type UpdateStudentPayload = Partial<CreateStudent>;

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

export const updateStudent = async (
  studentId: string,
  payload: UpdateStudentPayload,
): Promise<StudentResponce> => {
  const { data } = await api.patch(`/student/${studentId}`, payload);
  return data;
};

export const deleteStudent = async (studentId: string): Promise<void> => {
  await api.delete(`/student/${studentId}`);
};

export const importStudents = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<{
    created: number;
    skipped: number;
    errors: string[];
  }>("/student/import", formData);
  return data;
};

export const exportStudents = async (
  grade?: number,
  class_letter?: string,
  format: "csv" | "xlsx" = "xlsx",
) => {
  const { data } = await api.get<Blob>("/student/export", {
    params: { grade, class_letter, format },
    responseType: "blob",
  });
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

export const sendPendingDigests = async () => {
  const { data } = await api.post<{
    queued: number;
    sent_students: number;
    sent_records: number;
  }>("/behavior/digests/send");
  return data;
};
