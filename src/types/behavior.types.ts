export interface BehaviorCreate {
  subject: string;
  reasons: string[];
  comment?: string;
  photo?: File | null;
}

export interface BehaviorRecord {
  id: string;
  subject: string;
  reasons: string[];
  comment?: string;
  photo_url?: string | null;
  created_at: string;
}
