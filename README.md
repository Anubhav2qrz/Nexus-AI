# ⚡ Nexus AI — Full-Stack AI Chat Application

A premium, production-ready AI chat web app built with **Next.js**, **Supabase**, **OpenAI**, **Framer Motion**, and **Tailwind CSS**.

---

## ✨ Features

- 🔐 **Full Authentication** — Email/password + Google OAuth via Supabase Auth
- 💬 **Real-time AI Streaming** — Character-by-character response streaming from OpenAI
- 🗂️ **Persistent Chat History** — All chats & messages stored in Supabase PostgreSQL
- 🎨 **Premium UI/UX** — Dark/light mode, glassmorphism, smooth Framer Motion animations
- 📱 **Separate Mobile & Desktop Layouts** — Optimized experiences per device
- 🤖 **Multiple AI Personalities** — Assistant, Coder, Teacher, Creative modes
- 🧠 **Model Selector** — Switch between GPT-4o, GPT-4o Mini, GPT-3.5 Turbo
- 📋 **Markdown Rendering** — Full markdown + syntax-highlighted code blocks
- 📋 **Copy to Clipboard** — One-click copy for messages and code blocks
- 🔒 **Row-Level Security** — Users can only access their own data (Supabase RLS)

---

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/yourname/nexus-ai.git
cd nexus-ai
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL Editor, run the contents of `supabase-schema.sql` to create all tables, indexes, RLS policies, and triggers
3. (Optional) Enable Google OAuth: Go to **Authentication → Providers → Google** and add your credentials
4. Copy your project URL and anon key from **Settings → API**

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Supabase (safe to expose — protected by RLS)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenAI (server-side only — NEVER prefix with NEXT_PUBLIC_)
OPENAI_API_KEY=sk-your-openai-api-key
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
nexus-ai/
├── components/
│   ├── auth/
│   │   └── ProtectedRoute.js     # Auth guard for pages
│   ├── chat/
│   │   ├── DesktopLayout.js      # Full sidebar + chat area
│   │   ├── MobileLayout.js       # Fullscreen + drawer
│   │   ├── MessageBubble.js      # Individual message with markdown
│   │   └── MessageList.js        # Scrollable message container + welcome
│   ├── input/
│   │   └── ChatInput.js          # Auto-resize textarea + send button
│   ├── sidebar/
│   │   └── Sidebar.js            # Chat history + user profile
│   └── ui/
│       └── TopBar.js             # Model selector + theme toggle
├── hooks/
│   ├── useAuth.js                # Authentication helpers
│   └── useChat.js                # Chat operations (send, load, delete)
├── lib/
│   ├── supabaseClient.js         # Supabase client instance
│   └── db.js                    # Database query helpers
├── pages/
│   ├── api/
│   │   └── chat.js              # OpenAI streaming API route
│   ├── _app.js                  # Global providers
│   ├── _document.js             # HTML document + fonts
│   ├── index.js                 # Main chat page (protected)
│   ├── login.js                 # Login page
│   └── signup.js                # Signup page
├── store/
│   └── useStore.js              # Zustand global state
├── styles/
│   └── globals.css              # CSS variables + global styles
├── utils/
│   └── helpers.js               # Utilities + constants
├── supabase-schema.sql          # Full DB setup SQL
└── .env.example                 # Environment variable template
```

---

## 🗄️ Database Schema

```
profiles
  id (UUID, FK → auth.users)
  full_name, avatar_url
  created_at, updated_at

chats
  id (UUID)
  user_id (UUID, FK → auth.users)
  title, model
  created_at, updated_at

messages
  id (UUID)
  chat_id (UUID, FK → chats)
  role ('user' | 'assistant' | 'system')
  content (TEXT)
  created_at
```

All tables have **Row-Level Security** enabled — users can only read and write their own data.

---

## 🔐 Security

- OpenAI API key is **server-side only** (in `/pages/api/chat.js`) — never exposed to the browser
- Supabase anon key is safe to expose — all data access is controlled by RLS policies
- Protected routes redirect unauthenticated users to `/login`
- Each user's data is isolated by `user_id` with RLS

---

## 🎨 Customization

### Add a New AI Model

Edit `utils/helpers.js`:
```js
export const AI_MODELS = [
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'openai', description: 'Most capable' },
  // Add your model here:
  { id: 'gpt-4-turbo', label: 'GPT-4 Turbo', provider: 'openai', description: 'Fast & smart' },
]
```

### Switch to Gemini API

In `/pages/api/chat.js`, replace the OpenAI client with `@google/generative-ai`:
```js
import { GoogleGenerativeAI } from '@google/generative-ai'
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
```

### Add a New AI Personality

Edit `utils/helpers.js`:
```js
export const AI_PERSONALITIES = [
  // ... existing
  {
    id: 'analyst',
    label: 'Analyst',
    icon: '📊',
    prompt: 'You are a data analyst expert...',
  },
]
```

---

## 📦 Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 14 | React framework + API routes |
| Tailwind CSS | Utility-first styling |
| Framer Motion | Animations & transitions |
| Supabase | Auth + PostgreSQL database |
| OpenAI SDK | AI completions + streaming |
| Zustand | Global state management |
| React Markdown | Markdown rendering |
| React Syntax Highlighter | Code block highlighting |
| React Hot Toast | Toast notifications |
| Lucide React | Icons |

---

## 🚢 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel deploy
```

Set your environment variables in the Vercel dashboard under **Settings → Environment Variables**.

### Other Platforms

Any platform supporting Node.js 18+ works (Railway, Render, Fly.io, etc.).

---

## 📄 License

MIT — free to use and modify.
