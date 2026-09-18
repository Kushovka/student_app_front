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
  login: string;
  role: string;
  is_blocked?: boolean;
  school_id: string;
  max_connected?: boolean;
  homeroom_grade?: number | null;
  homeroom_class_letter?: string | null;
  is_class_teacher?: boolean;
  school?: UserSchoolInfo;
}

export const getUsers = async (): Promise<UserListItem[]> => {
  const { data } = await api.get<UserListItem[]>("/users/");
  return data;
};

export interface CreateSchoolAdminPayload {
  first_name: string;
  last_name: string;
  middle_name: string;
  login: string;
  password: string;
  school_id: string;
}

export interface CreateSchoolUserPayload {
  first_name: string;
  last_name: string;
  middle_name: string;
  login: string;
  password: string;
  role: "admin" | "teacher" | "parent";
  homeroom_grade?: number | null;
  homeroom_class_letter?: string | null;
  teacher_assignments?: TeacherAssignmentPayload[];
}

export interface TeacherAssignment {
  id: string;
  teacher_id: string;
  school_id: string;
  grade: number;
  class_letter: string;
  subject: string;
}

export interface TeacherAssignmentPayload {
  grade: number;
  class_letter: string;
  subject: string;
}

export const createSchoolAdmin = async (
  payload: CreateSchoolAdminPayload,
): Promise<UserListItem> => {
  const { data } = await api.post<UserListItem>("/users/school-admin", payload);
  return data;
};

export const createSchoolUser = async (
  payload: CreateSchoolUserPayload,
): Promise<UserListItem> => {
  const { data } = await api.post<UserListItem>("/users/", payload);
  return data;
};

export const getUserById = async (userId: string): Promise<UserListItem> => {
  const { data } = await api.get<UserListItem>(`/users/${userId}`);
  return data;
};

export const getMyTeacherAssignments = async (): Promise<TeacherAssignment[]> => {
  const { data } = await api.get<TeacherAssignment[]>("/users/me/assignments");
  return data;
};

export const getTeacherAssignments = async (
  teacherId: string,
): Promise<TeacherAssignment[]> => {
  const { data } = await api.get<TeacherAssignment[]>(
    `/users/${teacherId}/assignments`,
  );
  return data;
};

export const createTeacherAssignment = async (
  teacherId: string,
  payload: TeacherAssignmentPayload,
): Promise<TeacherAssignment> => {
  const { data } = await api.post<TeacherAssignment>(
    `/users/${teacherId}/assignments`,
    payload,
  );
  return data;
};

export const deleteTeacherAssignment = async (
  teacherId: string,
  assignmentId: string,
): Promise<void> => {
  await api.delete(`/users/${teacherId}/assignments/${assignmentId}`);
};

export const updateUserRole = async (
  userId: string,
  role: string,
): Promise<UserListItem> => {
  const { data } = await api.patch<UserListItem>(`/users/${userId}/role`, {
    role,
  });
  return data;
};

export const updateUserBlockStatus = async (
  userId: string,
  is_blocked: boolean,
): Promise<UserListItem> => {
  const { data } = await api.patch<UserListItem>(`/users/${userId}/block`, {
    is_blocked,
  });
  return data;
};

export const deleteUser = async (userId: string): Promise<void> => {
  await api.delete(`/users/${userId}`);
};
