import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, null, {
            params: { refresh_token: refreshToken },
          });
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          error.config.headers.Authorization = `Bearer ${data.access_token}`;
          return api.request(error.config);
        } catch {
          localStorage.clear();
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  signup: (data: { email: string; username: string; full_name?: string; password: string }) =>
    api.post("/auth/signup", data),
  login: (data: { email: string; password: string }) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
};

// Notes
export const notesAPI = {
  list: (params?: Record<string, unknown>) => api.get("/notes", { params }),
  create: (data: Record<string, unknown>) => api.post("/notes", data),
  get: (id: number) => api.get(`/notes/${id}`),
  update: (id: number, data: Record<string, unknown>) => api.put(`/notes/${id}`, data),
  delete: (id: number) => api.delete(`/notes/${id}`),
  generateInsights: (id: number) => api.post(`/notes/${id}/generate-insights`),
};

// Folders
export const foldersAPI = {
  list: () => api.get("/folders"),
  create: (data: Record<string, unknown>) => api.post("/folders", data),
  delete: (id: number) => api.delete(`/folders/${id}`),
};

// Tags
export const tagsAPI = {
  list: () => api.get("/tags"),
  create: (data: { name: string; color?: string }) => api.post("/tags", data),
  delete: (id: number) => api.delete(`/tags/${id}`),
};

// Files
export const filesAPI = {
  list: () => api.get("/files"),
  upload: (formData: FormData) =>
    api.post("/files/upload", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  delete: (id: number) => api.delete(`/files/${id}`),
};

// AI
export const aiAPI = {
  summarize: (data: Record<string, unknown>) => api.post("/ai/summarize", data),
  translate: (data: Record<string, unknown>) => api.post("/ai/translate", data),
  chat: (data: Record<string, unknown>) => api.post("/ai/chat", data),
  generateFlashcards: (data: Record<string, unknown>) => api.post("/ai/flashcards/generate", data),
  generateQuiz: (data: Record<string, unknown>) => api.post("/ai/quiz/generate", data),
  generateMindMap: (data: Record<string, unknown>) => api.post("/ai/mind-map/generate", data),
  uploadAndSummarize: (formData: FormData) =>
    api.post("/ai/upload-and-summarize", formData, { headers: { "Content-Type": "multipart/form-data" } }),
};

// Dashboard
export const dashboardAPI = {
  stats: () => api.get("/dashboard/stats"),
};

// Chat
export const chatAPI = {
  sessions: () => api.get("/chat/sessions"),
  messages: (sessionId: number) => api.get(`/chat/sessions/${sessionId}/messages`),
  deleteSession: (id: number) => api.delete(`/chat/sessions/${id}`),
};

// Flashcards
export const flashcardsAPI = {
  decks: () => api.get("/flashcards/decks"),
  cards: (deckId: number) => api.get(`/flashcards/decks/${deckId}/cards`),
  review: (data: { card_id: number; is_correct: boolean }) => api.post("/flashcards/review", data),
};

// Quizzes
export const quizzesAPI = {
  list: () => api.get("/quizzes"),
  get: (id: number) => api.get(`/quizzes/${id}`),
  submit: (id: number, data: Record<string, unknown>) => api.post(`/quizzes/${id}/submit`, data),
  delete: (id: number) => api.delete(`/quizzes/${id}`),
};

// Mind Maps
export const mindMapsAPI = {
  list: () => api.get("/mind-maps"),
  get: (id: number) => api.get(`/mind-maps/${id}`),
  delete: (id: number) => api.delete(`/mind-maps/${id}`),
};
