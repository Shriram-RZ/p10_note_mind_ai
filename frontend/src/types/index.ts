export interface Note {
  id: number;
  title: string;
  content?: string;
  summary?: string;
  is_pinned: boolean;
  is_archived: boolean;
  is_favorite: boolean;
  color: string;
  word_count: number;
  reading_time_minutes: number;
  language: string;
  folder_id?: number;
  ai_insights?: Record<string, unknown>;
  tags: Tag[];
  created_at: string;
  updated_at?: string;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface Folder {
  id: number;
  name: string;
  description?: string;
  color: string;
  icon: string;
  is_pinned: boolean;
  note_count: number;
  children?: Folder[];
}

export interface UploadedFile {
  id: number;
  filename: string;
  file_type: string;
  file_size: number;
  is_processed: boolean;
  processing_status: string;
  created_at: string;
}

export interface FlashcardDeck {
  id: number;
  title: string;
  subject?: string;
  total_cards: number;
  mastered_cards: number;
  progress: number;
  created_at: string;
}

export interface Flashcard {
  id: number;
  front: string;
  back: string;
  hint?: string;
  difficulty: string;
  is_mastered: boolean;
  review_count: number;
}

export interface Quiz {
  id: number;
  title: string;
  difficulty: string;
  total_questions: number;
  attempt_count: number;
  created_at: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  type: string;
  options?: string[];
  points: number;
}

export interface MindMap {
  id: number;
  title: string;
  node_count: number;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ChatSession {
  id: number;
  title?: string;
  context_type: string;
  message_count: number;
  created_at: string;
  updated_at?: string;
}

export interface DashboardStats {
  total_notes: number;
  notes_this_week: number;
  total_files: number;
  total_summaries: number;
  total_flashcard_decks: number;
  study_streak: number;
  total_study_minutes: number;
}
