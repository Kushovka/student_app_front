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
