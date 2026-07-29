export interface LoilonoteSession {
  user_id: number;
  username: string;
  is_teacher: boolean;
  display_name: string;
  app_id: string;
  app_token: string;
  device_id: string | null;
  issued_at: string;
  expired_at: string;
  refresh_token: string | null;
  refresh_token_expired_at: string | null;
  school_id: number;
  school_name: string;
  school_code: string;
  school_country: string;
  district_id: number;
  district_code: string;
  district_name: string;
}

export interface Course {
  id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
}

export interface Submission {
  submission_number: number;
  message: string;
  timestamp: string;
  hide_author: boolean;
  reveal_answer: number;
  submitted: boolean;
  submit_date: string | null;
  open_at: string;
  expiry: string;
  preparation: boolean;
  real_time_feedback: boolean;
  document_edit_method: string;
}

export interface NoteThumbnail {
  url: string;
  expires: string;
  version: number;
}

export interface Note {
  id: number;
  user_id: number;
  name: string;
  version: number;
  last_device_id: string | null;
  is_deleted: boolean;
  is_shared: boolean;
  updated_at: string;
  created_at: string;
  metadata_updated_at: string;
  viewer_permission: 'manage' | 'view';
  raw_viewer_permission: string;
  thumbnail: {
    small: NoteThumbnail;
    medium: NoteThumbnail;
  } | null;
}

export interface NotesListResponse {
  notes: Note[];
}

export interface SubmissionsResponse {
  submissions: Submission[];
}

export interface LoilonoteConfig {
  version: number;
  auth: {
    token: string | null;
    tokenFile: string | null;
  };
  server: {
    baseUrl: string;
    timeout: number;
  };
  cli: {
    outputFormat: 'table' | 'json';
    colorEnabled: boolean;
  };
}

export interface TokenStorage {
  token: string;
  session: LoilonoteSession;
  storedAt: string;
}
