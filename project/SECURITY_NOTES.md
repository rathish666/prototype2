# Security Fixes — Setup Steps

Code and RLS policies are fixed, but a few things only you can do (they need
access to your Supabase project / Razorpay dashboard / git host). Do these
in order.

## 1. Rotate your Razorpay keys — do this first, regardless of anything else

Your `.env` file (containing `RAZORPAY_KEY_SECRET` and your Supabase project
URL/anon key) is committed in this repo's git history (found in commit
`68a29e1`, "Add files via upload"). Anyone with clone access to this repo —
or who ever will, if it's pushed somewhere shared/public — can read it.

- In the Razorpay dashboard, regenerate your Key Secret and update the
  `RAZORPAY_KEY_SECRET` secret in Supabase (Edge Functions → Secrets).
  Do the same for `RAZORPAY_WEBHOOK_SECRET` if it was ever set from the
  value in that file.
- The Supabase **anon key** is meant to be public (it's safe in a browser
  bundle by design), so it doesn't need rotating on its own — but you should
  still remove `.env` from git history (e.g. `git filter-repo --path .env
  --invert-paths`, or the BFG Repo-Cleaner) and force-push, *especially*
  before making this repo public or adding new collaborators.
- `.env` is already in `.gitignore` going forward, so a fresh `.env` you
  create locally won't get committed again.

## 2. Run the new migration

```
supabase db push
```

This applies `supabase/migrations/20260814090000_security_hardening.sql`,
which locks down RLS on every table (previously most tables allowed any
anonymous visitor to read/write everything — customer PII, all orders,
prices, coupons, etc.) and drops the plaintext `customers.password` column.

## 3. Create your admin account

There's no more hardcoded `admin123` password. Admin access is now a real
Supabase Auth account plus an explicit row in `admin_users` — nobody can
grant themselves admin from the app.

1. Supabase Dashboard → Authentication → Users → **Add user**. Create a user
   with your real admin email + a strong password. (Turn off "Auto Confirm
   User" only if you want to verify email first; for a single admin account
   it's simplest to confirm it immediately.)
2. Copy that user's UUID, then in the SQL editor:
   ```sql
   insert into admin_users (user_id) values ('paste-the-uuid-here');
   ```
3. Go to `/admin` on the storefront and sign in with that email/password.

Repeat step 2 for any additional admins.

## 4. Set the CORS allowlist for the payment Edge Functions

`razorpay-create-order` and `razorpay-verify-payment` now only respond with
CORS headers to origins you explicitly allow (previously they defaulted to
`*`, meaning any website could call your payment-creation endpoint from a
visitor's browser). Set this secret to your real domain(s):

```
supabase secrets set ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

Include `http://localhost:5173` (or whatever port Vite uses) while
developing locally, comma-separated.

## 5. Existing demo/seeded customer accounts

The seed data's demo login (`james.carter@email.com` / `password123`) and
any real customers who signed up under the old system had their passwords
stored in the now-dropped `customers.password` column — they do **not**
exist as Supabase Auth users, so they can't log in anymore under their old
password. This is an unavoidable side effect of moving off plaintext
passwords. Options:
- For a demo/staging project: just re-register those accounts through the
  normal `/register` flow.
- For a project with real customers: you'd need a one-time migration that
  emails each existing customer a password-reset/set-password link (Supabase
  Auth's `inviteUserByEmail` or `resetPasswordForEmail` API) rather than
  silently carrying over old passwords, since you never have the plaintext
  originals to migrate safely anyway — they were readable in the DB, which
  is exactly the bug being fixed.

## 6. Email confirmation setting

`AuthPage.tsx` now checks whether `supabase.auth.signUp` returns a session
immediately. If your Supabase project has **Confirm email** enabled
(Authentication → Providers → Email), new customers will need to click a
confirmation link before their first login, and the storefront now shows a
toast for that case instead of silently failing. If you want the old
instant-login demo UX back, turn "Confirm email" off for this project — but
note that leaving it on is the more secure default for a real store.

---

## What changed, for reference

- **RLS lockdown** — every table's `USING (true) WITH CHECK (true)` policy
  replaced with real ownership/admin checks (`supabase/migrations/20260814090000_security_hardening.sql`).
- **Admin auth** — real Supabase Auth + `admin_users` table + `is_admin()`,
  replacing the hardcoded `admin123` client-side gate (`AdminLayout.tsx`,
  `AdminSettingsPage.tsx`).
- **Customer auth** — real Supabase Auth (bcrypt-hashed passwords) replacing
  a plaintext `customers.password` column compared in the browser
  (`AuthPage.tsx`, `AccountPage.tsx`).
- **Customer identity** — sourced from the verified Supabase session/JWT
  instead of an editable `localStorage` value (`StoreContext.tsx`).
- **CORS** — payment Edge Functions now allowlist origins instead of
  defaulting to `*` (`razorpay-create-order`, `razorpay-verify-payment`).
- **Removed** the unused legacy `place-cod-order` Edge Function (dead
  attack surface — the checkout UI never called it).
- **Order confirmation** no longer needs a public "read all orders" policy —
  the verify-payment function now returns the order directly, and the page
  falls back to an RLS-scoped, owner-only query.
