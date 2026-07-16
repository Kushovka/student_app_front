export type BehaviorSeverity = "green" | "yellow" | "red";

export interface BehaviorCreate {
  severity: BehaviorSeverity;
  subject: string;
  reasons: string[];
  comment?: string;
}

export interface BehaviorRecord {
  id: string;
  severity: BehaviorSeverity;
  subject: string;
  reasons: string[];
  comment?: string;
  created_at: string;
}
