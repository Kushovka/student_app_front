export interface BehaviorCreate {
  subject: string;
  reasons: string[];
  comment?: string;
}

export interface BehaviorRecord {
  id: string;
  subject: string;
  reasons: string[];
  comment?: string;
  created_at: string;
}
