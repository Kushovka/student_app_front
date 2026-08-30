import { api } from "./client";

export type ReportFormat = "json" | "xlsx" | "docx" | "pdf";

export interface ExportBehaviorReportPayload {
  grade: number;
  class_letter: string;
  date_from: string; // YYYY-MM-DD
  date_to: string; // YYYY-MM-DD
}

export interface BehaviorReportItem {
  full_name: string;
  class_name: string;
  subject: string;
  date: string; // YYYY-MM-DD
  violation: string;
}

export interface ExportBehaviorReportResponse {
  school_id: string;
  grade: number;
  class_letter: string;
  date_from: string;
  date_to: string;
  total: number;
  items: BehaviorReportItem[];
}

export interface DashboardResponse {
  total_7_days: number;
  total_30_days: number;
  top_classes: Array<{ class_name: string; total: number }>;
  top_reasons: Array<{ reason: string; total: number }>;
  severity: Record<"green" | "yellow" | "red", number>;
}

export interface PlatformSchoolStats {
  school_id: string;
  school_name: string;
  city: string | null;
  students: number;
  admins: number;
  teachers: number;
  parents: number;
  records_total: number;
  records_7_days: number;
  records_30_days: number;
  severity: Record<"green" | "yellow" | "red", number>;
}

export interface PlatformDashboardResponse {
  total_schools: number;
  total_users: number;
  total_students: number;
  total_records: number;
  total_7_days: number;
  total_30_days: number;
  severity: Record<"green" | "yellow" | "red", number>;
  top_reasons: Array<{ reason: string; total: number }>;
  schools: PlatformSchoolStats[];
}

export interface PlatformSchoolDashboardResponse {
  school: {
    id: string;
    name: string;
    city: string | null;
  };
  students: number;
  admins: number;
  teachers: number;
  parents: number;
  records_total: number;
  total_7_days: number;
  total_30_days: number;
  severity: Record<"green" | "yellow" | "red", number>;
  top_classes: Array<{ class_name: string; total: number }>;
  top_reasons: Array<{ reason: string; total: number }>;
}

export const exportBehaviorReport = async (
  payload: ExportBehaviorReportPayload,
  format: ReportFormat = "json",
): Promise<ExportBehaviorReportResponse | Blob> => {
  if (format === "xlsx" || format === "docx" || format === "pdf") {
    const { data } = await api.post<Blob>("/reports/behavior/export", payload, {
      params: { format },
      responseType: "blob",
    });
    return data;
  }

  const { data } = await api.post<ExportBehaviorReportResponse>(
    "/reports/behavior/export",
    payload,
    {
      params: { format },
    },
  );
  return data;
};

export const getDashboard = async () => {
  const { data } = await api.get<DashboardResponse>("/reports/dashboard");
  return data;
};

export const getPlatformDashboard = async () => {
  const { data } = await api.get<PlatformDashboardResponse>(
    "/reports/platform-dashboard",
  );
  return data;
};

export const getPlatformSchoolDashboard = async (schoolId: string) => {
  const { data } = await api.get<PlatformSchoolDashboardResponse>(
    `/reports/platform-dashboard/schools/${schoolId}`,
  );
  return data;
};
