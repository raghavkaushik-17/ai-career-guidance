# SkillForge AI — Your AI Career Platform

> Find real jobs, close skill gaps, and accelerate your career with AI.

---

## Features

| Feature | Description |
|---|---|
| 💬 **AI Career Advisor** | Chat with an AI trained on career data — resumes, interviews, salary, pivots |
| 💼 **Job Matches** | Real job listings from LinkedIn, Indeed & Glassdoor via JSearch API |
| 📊 **Skill Gap Analysis** | AI analysis of your skills vs. target role with a personalised roadmap |
| 🎓 **1-on-1 Mentorship** | Book a session with a senior mentor for ₹500 via Razorpay |
| 👤 **Profile** | Persistent profile with skills, experience, education, and transaction history |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, Vanilla JS |
| Backend | Node.js + Express |
| Database + Auth | Supabase (PostgreSQL + RLS) |
| AI | Groq — llama-3.3-70b-versatile |
| Job Search | JSearch API (RapidAPI) — real jobs from LinkedIn/Indeed/Glassdoor |
| Payments | Razorpay (INR ₹500) |

---

## Quick Start

### 1. Clone & install backend

```bash
cd backend
cp .env.example .env
npm install
```

### 2. Fill in your `.env`

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GROQ_API_KEY=gsk_your_key
PORT=3001
FRONTEND_URL=http://localhost:5500
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxx

# Optional — enables real job listings (200 free requests/month)
# Sign up at: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
JSEARCH_API_KEY=YOUR_JSEARCH_KEY_HERE
```

### 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the full contents of `db/schema.sql`
3. Copy your **Project URL**, **anon key**, and **service_role key** into `.env`

### 4. Configure the frontend

Open `frontend/js/app.js` and update the top two lines:

```js
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

Also search for `RAZORPAY_KEY_ID_HERE` and replace it with your `rzp_live_` key for production.

### 5. Run

```bash
# Backend (port 3001)
cd backend && npm run dev

# Frontend — use VS Code Live Server (port 5500) or:
cd frontend && npx serve -p 5500
```

Open `http://127.0.0.1:5500/frontend/index.html`

---

## Project Structure

```
skillforge-ai/
├── db/
│   └── schema.sql                  # Full Supabase schema — run this first
│
├── backend/
│   ├── server.js                   # Express entry point
│   ├── supabase.js                 # Supabase service client
│   ├── .env.example                # Environment variables template
│   ├── middleware/
│   │   └── auth.js                 # JWT verification for protected routes
│   └── routes/
│       ├── chat.js                 # AI chat — sessions + streaming messages
│       ├── jobs.js                 # Real job search + scoring + save/unsave
│       ├── skills.js               # Skill gap analysis + past analyses
│       ├── profile.js              # User profile CRUD
│       └── mentor.js               # Razorpay order + payment verification
│
└── frontend/
    ├── index.html                  # Full app — landing + dashboard
    ├── skillforge-logo.svg         # Full wordmark logo
    ├── skillforge-icon.svg         # Icon mark
    ├── css/
    │   └── main.css                # All styles
    └── js/
        ├── api.js                  # API client (all fetch calls)
        └── app.js                  # App state, routing, UI logic
```

---

## API Routes

| Method | Route | Description |
|---|---|---|
| POST | `/api/chat/sessions` | Create new chat session |
| GET | `/api/chat/sessions` | List all sessions |
| POST | `/api/chat/sessions/:id/messages` | Send message, get AI reply |
| GET | `/api/jobs` | Search real jobs (JSearch) |
| POST | `/api/jobs/:id/save` | Save a job |
| DELETE | `/api/jobs/:id/save` | Unsave a job |
| GET | `/api/jobs/saved` | List saved jobs |
| GET | `/api/skills/mine` | Get user's skills |
| POST | `/api/skills/gap-analysis` | Run AI skill gap analysis |
| GET | `/api/skills/gap-analyses` | List past analyses |
| DELETE | `/api/skills/gap-analyses/:id` | Delete an analysis |
| GET | `/api/profile` | Get user profile |
| PUT | `/api/profile` | Update user profile |
| POST | `/api/mentor/order` | Create Razorpay payment order |
| POST | `/api/mentor/verify` | Verify payment + save session |
| GET | `/api/mentor/sessions` | Get transaction history |

---

## Real Job Search Setup

Jobs are fetched from **JSearch** (aggregates LinkedIn, Indeed, Glassdoor).

1. Sign up free at [rapidapi.com → JSearch](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch)
2. Subscribe to the **Basic** plan — **200 requests/month free**
3. Copy your RapidAPI key into `.env` as `JSEARCH_API_KEY`
4. Restart the backend

> If `JSEARCH_API_KEY` is missing or blank, job search returns empty results (no fake AI jobs).

---

## Payments (Razorpay)

- Uses **test mode** by default (`rzp_test_` key)
- Demo mode: if no Razorpay key is set, a demo modal bypasses payment for testing
- For production: complete KYC at [dashboard.razorpay.com](https://dashboard.razorpay.com) and switch to `rzp_live_` keys

---

## Database Schema (key tables)

| Table | Purpose |
|---|---|
| `profiles` | User profile — name, role, experience, education, location |
| `skills` | Master skills list |
| `user_skills` | User ↔ skill mapping with proficiency level |
| `chat_sessions` | Chat conversation sessions |
| `chat_messages` | Individual messages per session |
| `job_listings` | Saved job data |
| `saved_jobs` | User's saved jobs with status |
| `skill_gap_analyses` | Past AI skill gap analysis results |
| `mentor_sessions` | Booked mentorship sessions + payment records |

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_URL` | ✅ | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | ✅ | Supabase public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key (backend only) |
| `GROQ_API_KEY` | ✅ | Groq API key for AI features |
| `PORT` | ✅ | Backend port (default 3001) |
| `FRONTEND_URL` | ✅ | Frontend URL for CORS |
| `RAZORPAY_KEY_ID` | ⚡ | Razorpay key ID (demo mode if missing) |
| `RAZORPAY_KEY_SECRET` | ⚡ | Razorpay key secret |
| `JSEARCH_API_KEY` | ⚡ | RapidAPI key for real job listings |

✅ Required &nbsp;&nbsp; ⚡ Optional but recommended

---

## License

MIT © 2026 SkillForge AI