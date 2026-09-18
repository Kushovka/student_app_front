import type { BehaviorCreate } from "../types/behavior.types";
import type { HomeroomTeacher, StudentResponce } from "../types/student.type";
import type { UserListItem } from "./users";
import { api } from "./client";

export interface CreateStudent {
  first_name: string;
  last_name: string;
  middle_name: string;
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

export interface ClassOption {
  grade: number;
  class_letter: string;
}

export interface ClassOptionsResponse {
  grades: number[];
  letters: string[];
  classes: ClassOption[];
}

export interface ParentStudentLink {
  id: string;
  parent_id: string;
  student_id: string;
  relationship?: string | null;
  parent: UserListItem;
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

export const getClassOptions = async (): Promise<ClassOptionsResponse> => {
  const { data } = await api.get<ClassOptionsResponse>("/student/class-options");
  return data;
};

export const createClassroom = async (
  payload: ClassOption,
): Promise<ClassOption> => {
  const { data } = await api.post<ClassOption>("/student/classes", payload);
  return data;
};

export const deleteClassroom = async (
  grade: number,
  classLetter: string,
): Promise<void> => {
  await api.delete(`/student/classes/${grade}/${encodeURIComponent(classLetter)}`);
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

export const importStudents = async (
  file: File,
  grade?: number,
  classLetter?: string,
) => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<{
    created: number;
    skipped: number;
    errors: string[];
  }>("/student/import", formData, {
    params: { grade, class_letter: classLetter },
  });
  return data;
};

export interface ImportClassListsResponse {
  created_classes: string[];
  created_students: number;
  skipped_students: number;
}

export const importWordClassLists = async (
  file: File,
  grade: number,
): Promise<ImportClassListsResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<ImportClassListsResponse>(
    "/student/import-class-lists",
    formData,
    { params: { grade } },
  );
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

export const getStudentClassTeacher = async (
  studentId: string,
): Promise<HomeroomTeacher | null> => {
  const { data } = await api.get<HomeroomTeacher | null>(
    `/student/${studentId}/class-teacher`,
  );
  return data;
};

export const getStudentParents = async (
  studentId: string,
): Promise<ParentStudentLink[]> => {
  const { data } = await api.get<ParentStudentLink[]>(
    `/student/${studentId}/parents`,
  );
  return data;
};

export const getAvailableParents = async (
  studentId: string,
  search?: string,
): Promise<UserListItem[]> => {
  const { data } = await api.get<UserListItem[]>(
    `/student/${studentId}/parents/available`,
    { params: { search } },
  );
  return data;
};

export const attachParentToStudent = async (
  studentId: string,
  parentId: string,
  relationship?: string,
): Promise<ParentStudentLink> => {
  const { data } = await api.post<ParentStudentLink>(
    `/student/${studentId}/parents`,
    {
      parent_id: parentId,
      relationship,
    },
  );
  return data;
};

export const detachParentFromStudent = async (
  studentId: string,
  parentId: string,
): Promise<void> => {
  await api.delete(`/student/${studentId}/parents/${parentId}`);
};

export const addBehavior = async (
  studentId: string,
  payload: BehaviorCreate,
) => {
  if (payload.photo) {
    const formData = new FormData();
    formData.append("subject", payload.subject);
    formData.append("reasons", JSON.stringify(payload.reasons));
    if (payload.comment) formData.append("comment", payload.comment);
    formData.append("photo", payload.photo);
    const { data } = await api.post(`/behavior/${studentId}`, formData);
    return data;
  }

  const { data } = await api.post(`/behavior/${studentId}`, payload);
  return data;
};

export const getBehaviorHistory = async (studentId: string) => {
  const { data } = await api.get(`/behavior/${studentId}`);
  return data;
};
