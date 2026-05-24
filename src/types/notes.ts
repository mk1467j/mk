export type NoteType = 'text' | 'pdf' | 'image' | 'audio' | 'video' | 'link';

export interface Attachment {
  name: string;
  url: string;
  size?: number;
}

export interface Folder {
  id: string; // Keep as string (supports standard uuid and localStorage string ids)
  name: string;
  user_id?: string;
  created_at?: string;
}

export interface Note {
  id: string; // Supports UUID and Date.now().toString() for local fallback
  title: string;
  content: string; // HTML or Markdown rich-text content
  type: NoteType;
  folder_id: string | null; // null means Inbox / default folder
  file_url: string | null; // For pdf, image, audio, video, or link URI
  user_id?: string;
  created_at: string;
  attachments?: Attachment[];
}
