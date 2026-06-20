# Clerk CLI Setup

Use the Clerk CLI to link this project to your Clerk application and write API keys into `.env` automatically.

> **Note:** Clerk is already integrated in code (`@clerk/nextjs`, middleware, sign-in/sign-up routes). The CLI step mainly connects your local `.env` to a Clerk app.

---

## What the CLI will do

1. Install or update the Clerk CLI
2. Sign you in to Clerk
3. Initialize Clerk for this Next.js project
4. Verify the setup with `clerk doctor`

---

## Step 1 — Install Clerk CLI

```bash
npm install -g clerk
```

Verify:

```bash
clerk --version
```

If already installed, update:

```bash
clerk update --yes
```

---

## Step 2 — Sign in to Clerk

From the project root (`notion-lite/`):

```bash
clerk auth login
```

Complete the browser login when prompted. If you are already signed in, continue to the next step.

---

## Step 3 — Initialize Clerk in this project

```bash
clerk init --framework next --pm npm
```

This will:

- Confirm `@clerk/nextjs` is installed (already present)
- Write `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to `.env`
- Align middleware and auth routes with Clerk defaults

### Link to an existing Clerk app (optional)

Only if you already have a Clerk application and want to use it:

```bash
clerk init --framework next --pm npm --app <application_id>
```

To list your apps first:

```bash
clerk apps list --json
```

---

## Step 4 — Verify

```bash
clerk doctor
```

Then start the app:

```bash
npm run dev 
```

Open [http://localhost:3000](http://localhost:3000).

---

## What to keep as-is after `clerk init`

If the CLI does not set these, keep them exactly like this (they match routes in `src/app/`):

```env
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

Do **not** expose `CLERK_SECRET_KEY` in client code.

---

## Auth UI in this project

Clear auth controls are wired in:

| Location | Components |
|---|---|
| Landing page header | `SignInButton`, `SignUpButton`, `UserButton` via `AuthControls` |
| Dashboard / workspace / page nav | `AuthControls` in `TopNavbar` |
| Dedicated routes | `/sign-in`, `/sign-up` with Clerk `<SignIn />` / `<SignUp />` |

Source: `src/components/layout/auth-controls.tsx`

---

## Test your first account

1. Run `npm run dev`
2. Click **Sign up** in the top-right (or **Get started free**)
3. Create a test user
4. After signup, you should land on `/dashboard` and see your profile icon

If Clerk shows a **Configure your application** callout in the dashboard, click it to finish app setup.

---

## Troubleshooting

| Issue | Fix |
|---|---|
| `clerk` command not found | Run `npm install -g clerk`, then reopen the terminal |
| CLI hangs on Windows | Run commands in a regular PowerShell/CMD window outside the IDE |
| Sign-in page blank | Check publishable key in `.env`; restart dev server |
| Redirect loop | Keep Clerk URL env vars as `/sign-in`, `/sign-up`, `/dashboard` |

Manual key setup (without CLI): see [ENV_SETUP.md](./ENV_SETUP.md).

---

## Learn more

- [Clerk CLI docs](https://clerk.com/docs/cli)
- [Next.js quickstart](https://clerk.com/docs/nextjs/getting-started/quickstart)
- [Clerk Dashboard](https://dashboard.clerk.com/)
- [Organizations](https://clerk.com/docs/guides/organizations/overview)
- [Components reference](https://clerk.com/docs/reference/components/overview)
