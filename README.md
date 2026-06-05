# NoteMind AI — Smart AI Notes & Online Class Companion

> An AI-native productivity and learning ecosystem powered by Groq AI

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)](https://postgresql.org)
[![Groq](https://img.shields.io/badge/Groq-Llama%203.3-F55036?logo=groq)](https://groq.com)

---

## 🌟 Features

| Feature | Description |
|---------|-------------|
| 🎙️ **AI Lecture Summarizer** | Upload audio/video/PDF lectures → instant smart summaries |
| 📝 **Smart Notes** | AI-enhanced note-taking with auto-insights and formatting |
| 🌍 **AI Translator** | Translate notes into 100+ languages with language detection |
| 💬 **Chat with Notes** | Ask questions about your notes using AI context |
| 🃏 **Flashcard Generator** | Auto-generate spaced-repetition decks |
| ❓ **Quiz Generator** | AI-created MCQ/T-F quizzes with explanations |
| 🗺️ **Mind Map Generator** | Visual concept maps from any content |
| 📊 **Study Dashboard** | Analytics, streaks, and learning insights |
| 📁 **File Management** | Upload PDF, DOCX, audio, video with text extraction |
| 🔐 **JWT Auth** | Secure signup, login, token refresh |

---

## 🏗️ Tech Stack

### Frontend
- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS v4** + **Framer Motion**
- **Zustand** (state management)
- **React Markdown** + syntax highlighting

### Backend
- **FastAPI** + **Python 3.11**
- **PostgreSQL** + **SQLAlchemy ORM**
- **Alembic** (migrations)
- **bcrypt** + **JWT** auth

### AI
- **Groq** (`llama-3.3-70b-versatile`)
- Whisper-compatible audio transcription
- PyPDF2 + python-docx text extraction
- Tesseract OCR for images

### Deployment
- **Railway** (backend + database)
- **Vercel** (frontend)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- PostgreSQL 16+
- Groq API key ([get one free](https://console.groq.com))

### 1. Clone & Setup

```bash
git clone https://github.com/your-username/p10_note_mind_ai.git
cd p10_note_mind_ai
cp .env.example .env
# Edit .env with your credentials
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env      # Fill in your credentials

# Start the backend
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local  # Set NEXT_PUBLIC_API_URL

npm run dev
```

### 4. Docker (All-in-one)

```bash
cp .env.example .env
# Edit .env with GROQ_API_KEY and SECRET_KEY

docker-compose up -d
```

Then open http://localhost:3000

---

## 📡 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/signup` | Create account |
| POST | `/api/v1/auth/login` | Get JWT tokens |
| GET | `/api/v1/auth/me` | Current user |
| GET/POST | `/api/v1/notes` | Note CRUD |
| POST | `/api/v1/ai/summarize` | Summarize content |
| POST | `/api/v1/ai/translate` | Translate text |
| POST | `/api/v1/ai/chat` | Chat with AI |
| POST | `/api/v1/ai/flashcards/generate` | Generate flashcards |
| POST | `/api/v1/ai/quiz/generate` | Generate quiz |
| POST | `/api/v1/ai/mind-map/generate` | Generate mind map |
| POST | `/api/v1/ai/upload-and-summarize` | Upload + AI summary |
| GET | `/api/v1/dashboard/stats` | Dashboard analytics |

---

## 🗄️ Database Schema

```
users ─── notes ─── summaries
      ├── folders   ├── translations
      ├── tags      ├── flashcard_decks ─── flashcards
      ├── files     ├── quizzes ─── questions ─── attempts
      ├── chats ─── messages
      ├── mind_maps
      ├── study_sessions
      └── bookmarks
```

---

## 🌐 Deployment

### Railway (Backend)

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
railway init
railway add postgresql
railway deploy
```

Set environment variables in Railway dashboard.

### Vercel (Frontend)

```bash
cd frontend
vercel deploy
```

Set `NEXT_PUBLIC_API_URL` to your Railway backend URL.

---

## 🔑 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `SECRET_KEY` | JWT signing key (32+ chars) | ✅ |
| `GROQ_API_KEY` | Groq API key (console.groq.com) | ✅ |
| `REDIS_URL` | Task queue (optional) | ❌ |

---

## 🎨 Design System

- **Colors**: Violet/Purple gradient palette on dark background
- **Glass morphism**: Semi-transparent blurred panels
- **Animations**: Framer Motion transitions throughout
- **Typography**: Inter font with gradient text accents

---

## 📁 Project Structure

```
p10_note_mind_ai/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── routers/         # FastAPI route handlers
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Business logic + AI
│   │   ├── utils/           # Auth helpers + prompts
│   │   ├── config.py        # App configuration
│   │   ├── database.py      # DB connection
│   │   └── main.py          # FastAPI app
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router pages
│   │   │   ├── (auth)/      # Login, signup, forgot password
│   │   │   └── (dashboard)/ # All dashboard pages
│   │   ├── components/      # Reusable components
│   │   ├── lib/             # API client, utils
│   │   ├── store/           # Zustand state
│   │   └── types/           # TypeScript types
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
  <strong>Built with ❤️ using Next.js, FastAPI & Groq AI</strong>
</div>
