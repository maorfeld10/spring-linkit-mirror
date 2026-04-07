# Deployment Guide — Spring LinkIt Mirror

## Prerequisites

- GitHub account
- Vercel account (free tier works)
- Supabase account (free tier works)
- Anthropic API key from console.anthropic.com

---

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Choose a region close to your users (e.g., US East).
3. Set a database password (save it somewhere secure).
4. Wait for the project to finish provisioning.

### Run the SQL migrations

1. In your Supabase dashboard, go to **SQL Editor** > **New Query**.
2. Paste the contents of `supabase/migrations/001_initial_schema.sql` and click **Run**.
3. Paste the contents of `supabase/migrations/002_add_session_status.sql` and click **Run**.
4. Verify: go to **Table Editor** and confirm `questions` and `sessions` tables exist.

### Get your Supabase credentials

1. Go to **Settings** > **API**.
2. Copy:
   - **Project URL** (looks like `https://abc123.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

---

## 2. Get an Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com).
2. Create an API key.
3. Copy the key (starts with `sk-ant-`).

---

## 3. Push to GitHub

```bash
cd spring-linkit-mirror
git init
git add .
git commit -m "Initial commit: Spring LinkIt Mirror"
git remote add origin https://github.com/YOUR_USERNAME/spring-linkit-mirror.git
git push -u origin main
```

---

## 4. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and click **Add New Project**.
2. Import your GitHub repository.
3. Framework Preset: **Next.js** (should auto-detect).
4. **Environment Variables** — add these three:

| Variable                       | Value                                   |
|--------------------------------|-----------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`     | `https://your-project.supabase.co`      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| `eyJ...your-anon-key`                   |
| `ANTHROPIC_API_KEY`            | `sk-ant-...your-key`                    |

5. Click **Deploy**.
6. Once deployed, verify by visiting `https://your-app.vercel.app/api/health`.
   You should see `{ "status": "ok" }`.

---

## 5. Verify the Full Flow

1. Go to `/admin`.
2. Click "Generate 10 Questions" — questions should appear as PENDING_REVIEW.
3. Approve a few questions.
4. Go to `/student`.
5. Click "Practice Reading" — you should see approved questions.
6. Complete the session — results should appear at `/student/results`.

---

## Environment Variables Reference

| Variable                       | Where Used   | Required |
|--------------------------------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL`     | Client + Server | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| Client + Server | Yes |
| `ANTHROPIC_API_KEY`            | Server only     | Yes |
| `NEXT_PUBLIC_APP_URL`          | Server only     | No (auto-detected on Vercel) |

---

## Troubleshooting

**"Failed to fetch questions"**: Check Supabase URL and anon key. Verify RLS policies exist (the migration creates permissive policies).

**"Claude returned invalid JSON"**: The Anthropic API key may be invalid or the model may be rate-limited. Check the Anthropic dashboard.

**Health check returns 503**: Supabase is unreachable. Verify the project URL and that the project isn't paused (free tier pauses after inactivity).

**Blank student page**: No approved questions exist. Go to `/admin` and approve some first.
