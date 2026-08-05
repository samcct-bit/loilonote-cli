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
  course_id: number;
  name: string;
  subject_id: number;
  course_root_document_group_id: number;
  subject_root_document_group_id: number;
  in_charge: boolean;
  course_start_at: string;
  course_finish_at: string;
  is_private: boolean;
  is_authorized: boolean;
}

export interface UserProfile {
  id: number;
  username: string;
  sort_key: string | null;
  first_name: string;
  last_name: string;
  display_name: string;
  lang: string;
  is_teacher: boolean;
  is_admin: boolean;
  is_graduated: boolean;
  graduated_at: string | null;
}

export interface CourseDetail {
  name: string;
  user_group_id: number;
  user_group_name: string;
  user_group_code: string;
  user_group_start_at: string | null;
  user_group_finish_at: string | null;
  subject_id: number;
  course_start_at: string;
  course_finish_at: string;
  academic_year: number;
  teachers: UserProfile[];
  students: UserProfile[];
  submission_message: string;
  current_submission_number: number;
  document_groups: {
    common_group_id: number;
    common_group_has_contents: boolean;
    class_group_ids: { id: number; name: string }[];
  };
  is_tunnel_enabled: boolean;
  autolock_tunnel_at: string | null;
  default_tunnel_duration: number;
  is_screen_locked: boolean;
  screen_sharing_id: string | null;
  shared_note_unlock_start_at: string;
  shared_note_unlock_finish_at: string | null;
  is_shared_note_unlocked: boolean;
}

export interface CourseGroup {
  user_group_id: number;
  user_group_name: string;
  user_group_start_at: string | null;
  user_group_finish_at: string | null;
  courses: Course[];
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

export interface OgpResponse {
  url?: string;
  title?: string;
  description?: string;
  image?: string;
}

export interface CreateAssetRequest {
  generic_file_id: number;
  page_count: number;
  metadata?: string; // e.g. '[{"width":1024,"height":768}]'
  thumbnails?: string; // e.g. '[{"index":0,"small":...}]'
}

export interface AssetResponse {
  id: string; // This is the remote_id
  description?: string;
  extension?: string;
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

// --- Note ZIP internal format ---

export interface NoteHeader {
  format: string;
  format_version: string;
  updater: {
    id: number;
    device_id: string;
  };
}

export interface NoteFrame {
  id: string;
  type: string;
  content: {
    margins?: { left: number; top: number; bottom: number; right: number };
    backcolor?: string;
    size: { width: number; height: number };
  };
  metadata: {
    position: { left: number; top: number };
    author: { id: number; name: string };
    duration: number;
    layout_size: { width: number; height: number };
    unlimited_recording_time?: boolean;
    playback_rate?: number;
  };
  gadgets: Record<string, unknown>;
}

export interface NoteBody {
  format: string;
  version: string;
  data: {
    metadata: { created_by: string };
    frames: NoteFrame[];
  };
}

export interface ParsedNote {
  version: number;
  header: NoteHeader;
  body: NoteBody;
  frameCount: number;
  frameTypes: string[];
}

export interface AnonymizedUser {
  anonymized_name: string; // e.g. "stu01"
  seat_number: string;     // e.g. "01"
  is_graduated: boolean;
  // NOTE: user_id is intentionally NOT exported to protect privacy
}
