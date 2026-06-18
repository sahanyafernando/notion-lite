# Environment Variables Setup

This guide explains how to create your local `.env` file, where to get each credential, and **which values you should keep exactly as shown**.

---

## Quick start

1. Copy the template:

   ```bash
   cp .env.example .env
   ```

2. Fill in only the **secret / account-specific** values (marked below).
3. Leave the **route URLs** unchanged unless you rename app routes.
4. Never commit `.env` — it is already in `.gitignore`.

---

## Full `.env` example

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/notion_lite?schema=public"

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# OpenAI
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## What to change vs. what to keep as-is

| Variable | Change? | Notes |
|---|---|---|
| `DATABASE_URL` | **Yes** | Your Postgres connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | **Yes** | From Clerk dashboard |
| `CLERK_SECRET_KEY` | **Yes** | From Clerk dashboard (server-only) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | **Keep as-is** | Must match route: `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | **Keep as-is** | Must match route: `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | **Keep as-is** | Redirect after login: `/dashboard` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | **Keep as-is** | Redirect after signup: `/dashboard` |
| `OPENAI_API_KEY` | **Yes** | Required only for AI Summarize |

**Keep as-is** means: do not rename these paths unless you also change the matching folders under `src/app/`.

---

## 1. `DATABASE_URL` (PostgreSQL)

**What it does:** Connects Prisma to your database for users, workspaces, pages, tags, and permissions.

**Format:**

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

**Examples:**

Local Postgres:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/notion_lite?schema=public"
```

Neon (with SSL):

```env
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

Supabase (connection pooler):

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?schema=public"
```

### How to get it

**Option A — Neon (free, easy for internships)**

1. Go to [https://neon.tech](https://neon.tech) and create an account.
2. Create a project (e.g. `notion-lite`).
3. Open **Dashboard → Connection details**.
4. Copy the **PostgreSQL** connection string (not HTTP/API).
5. Paste it as `DATABASE_URL` in `.env`.

**Option B — Supabase**

1. Go to [https://supabase.com](https://supabase.com) and create a project.
2. Open **Project Settings → Database**.
3. Copy the **URI** connection string.
4. Replace `[YOUR-PASSWORD]` with your database password.

**Option C — Local Postgres**

1. Install PostgreSQL.
2. Create a database: `createdb notion_lite`
3. Use: `postgresql://postgres:YOUR_PASSWORD@localhost:5432/notion_lite?schema=public`

### Important

- Use a normal `postgresql://...` URL.
- **Do not** use `prisma+postgres://...` URLs — this app uses the `pg` adapter and expects a standard Postgres URL.

### After setting `DATABASE_URL`

```bash
npm run db:migrate
# or, for quick prototyping:
npm run db:push
```

---

## 2. Clerk keys (authentication)

**What they do:** Handle sign up, sign in, sign out, and protect `/dashboard`, `/workspace/*`, and `/page/*`.

| Variable | Public? | Where used |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes (browser) | Clerk UI components |
| `CLERK_SECRET_KEY` | No (server only) | Middleware + server auth |

### How to get them

1. Go to [https://clerk.com](https://clerk.com) and create a free account.
2. Click **Create application** (e.g. name it `NotionLite`).
3. Choose sign-in methods (Email is enough for this project).
4. Open **Configure → API Keys**.
5. Copy:
   - **Publishable key** → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret key** → `CLERK_SECRET_KEY`

Example:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890
CLERK_SECRET_KEY=sk_test_aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890
```

### Clerk URLs — keep these as-is

```env
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

These match the routes in this repo:

- `src/app/sign-in/[[...sign-in]]/page.tsx`
- `src/app/sign-up/[[...sign-up]]/page.tsx`
- `src/app/dashboard/page.tsx`

### Optional (production / Vercel)

In Clerk dashboard → **Configure → Domains**, add:

- Development: `http://localhost:3000`
- Production: `https://your-app.vercel.app`

---

## 3. `OPENAI_API_KEY` (AI Summarize)

**What it does:** Powers the **Summarize** button on each page (`POST /api/pages/[id]/summarize`).

**Required?** Only if you use AI summary. The rest of the app works without it.

### How to get it

1. Go to [https://platform.openai.com](https://platform.openai.com).
2. Sign in or create an account.
3. Open **API keys** (or **Settings → Billing** first to add payment/credits).
4. Click **Create new secret key**.
5. Copy once and paste into `.env`:

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Note:** Keys usually start with `sk-proj-` or `sk-`. Never share or commit this key.

---

## Checklist before `npm run dev`

- [ ] `.env` exists (copied from `.env.example`)
- [ ] `DATABASE_URL` is set and migrations ran (`npm run db:migrate`)
- [ ] Clerk publishable + secret keys are set
- [ ] Clerk URL variables are unchanged (`/sign-in`, `/sign-up`, `/dashboard`)
- [ ] `OPENAI_API_KEY` is set (optional, for Summarize only)

Then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Security — do not commit

| File | Commit to Git? |
|---|---|
| `.env.example` | **Yes** (placeholders only) |
| `.env` | **Never** |
| Real API keys / DB passwords | **Never** |

If you accidentally commit secrets:

1. Rotate/regenerate keys in Clerk, OpenAI, and your database provider.
2. Remove the secret from git history if needed.

---

## Troubleshooting

| Problem | Likely cause | Fix |
|---|---|---|
| `DATABASE_URL is not set` | Missing or empty `DATABASE_URL` | Add a valid Postgres URL to `.env` |
| Clerk sign-in page broken | Wrong publishable key or URL paths | Re-copy keys; keep URL paths as-is |
| `Forbidden` on pages | User not in workspace | Invite user by email (they must sign up first) |
| Summarize returns 500 | Missing `OPENAI_API_KEY` | Add OpenAI key or skip that feature |
| DB connection fails | Wrong URL or DB not running | Verify URL; run migrations |

---

## Related files

- `.env.example` — template with placeholders (safe to commit)
- `prisma/schema.prisma` — database models
- `src/middleware.ts` — Clerk route protection
- `README.md` — project overview
