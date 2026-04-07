# Spring LinkIt Mirror

Grade 1 ELA & Math benchmark practice app. Mirrors the structure of Spring LinkIt Form C tests using original AI-generated content grounded in NJ Grade 1 standards.

## Tech Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** — calm blues/greens palette, 64px min tap targets
- **Supabase** — PostgreSQL database
- **Anthropic SDK** — Claude 3.5 Sonnet for question generation
- **Web Speech API** — browser-native TTS (no external audio service)

## Folder Structure

```
spring-linkit-mirror/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page
│   ├── globals.css             # Tailwind imports
│   ├── admin/page.tsx          # Admin dashboard (Stage 2)
│   ├── student/page.tsx        # Student test player (Stage 2)
│   └── api/
│       ├── generate/route.ts   # AI question generation
│       ├── questions/route.ts  # Question CRUD
│       └── sessions/route.ts   # Session sync
├── components/
│   ├── admin/                  # Admin-specific components
│   ├── student/                # Student-specific components
│   └── shared/                 # Shared components
├── lib/
│   ├── supabase.ts             # Typed Supabase client
│   ├── claude.ts               # Typed Anthropic SDK client
│   └── audio.ts                # Web Speech API wrapper
├── types/
│   └── index.ts                # All TypeScript interfaces
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── .env.local.example          # Required environment variables
└── package.json
```

## Setup

### 1. Install dependencies

```bash
cd spring-linkit-mirror
npm install
```

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL` — from Supabase dashboard → Settings → API
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase dashboard → Settings → API
- `ANTHROPIC_API_KEY` — from console.anthropic.com

### 3. Run the Supabase migration

Go to your Supabase dashboard → SQL Editor → New Query.
Paste the contents of `supabase/migrations/001_initial_schema.sql` and run it.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Audio Rules

| Standard Type   | Passage TTS | Stem TTS | Choices TTS |
|-----------------|:-----------:|:--------:|:-----------:|
| READING_DECODE  |      ✗      |    ✓     |      ✓      |
| READING_COMP    |      ✗      |    ✓     |      ✓      |
| LISTENING_COMP  |      ✓      |    ✓     |      ✓      |
| MATH            |      ✓      |    ✓     |      ✓      |

## Content Rules

- All questions are AI-generated from NJ Grade 1 standards
- Every generated question starts as `PENDING_REVIEW`
- Parent must approve before a student sees any question
