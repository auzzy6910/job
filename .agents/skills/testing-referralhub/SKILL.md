# Testing ReferralHub App

## Overview
ReferralHub is a monorepo with a FastAPI backend (`referral-backend/`) and a React/Vite/TypeScript frontend (`referral-frontend/`). It uses SQLite with WAL mode and JWT auth.

## Local Development Setup

### Backend
```bash
cd referral-backend
poetry install
DATABASE_PATH=/tmp/test_app.db poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000
```
- Health check: `curl http://localhost:8000/healthz` should return `{"status":"ok"}`
- JWT secret is configured via `JWT_SECRET` env var (has a default for dev; change in production)
- Database is auto-created on first startup

### Frontend
```bash
cd referral-frontend
npm install
VITE_API_URL=http://localhost:8000 npm run dev -- --host 0.0.0.0 --port 5173
```
- Build check: `npm run build` (runs `tsc -b && vite build`)
- Lint check: `npm run lint`
- The `VITE_API_URL` env var must be set before starting the dev server

## Testing Workflow

### Signup & Navigation Test
1. Navigate to `http://localhost:5173/signup`
2. Fill in username, email, password (referral code is optional)
3. After signup, you're redirected to `/dashboard` with:
   - Balance: KES 0.00
   - Locked Bonus: KES 200.00 (unlocked after first referral)
   - Referral link generated automatically

### Pages to Verify (sidebar navigation)
- `/dashboard` - Welcome message, stats cards, activate button, referral link
- `/referrals` - Stats grid, referral list, locked bonus info
- `/spin` - SVG wheel, "Spin Now!" button (once per day), spin history
- `/stars` - Daily star collection, gift a star feature
- `/microtasks` - Shows "Account Not Activated" lock if not activated (50 KES fee)
- `/booster` - "How Booster Works" info, deposit 200 KES feature
- `/leaderboard` - Royal Crown prizes, top referrers
- `/gifts` - Daily free credits, sent/received gifts
- `/diamond` - Monthly KES 20,000 draw, past winners
- `/wallet` - Balance, deposit/withdraw forms, transaction history

### Error Handling Test
- Click "Activate (50 KES)" on dashboard with insufficient balance
  - Expected: Red error text "Insufficient balance. You need 50 KES to activate."
- Spin the wheel, then try spinning again
  - Expected: Button changes to "Already Spun Today" (disabled)

### Key Things to Watch For
- **Booster page**: Has null-safety guards around `active_booster` data. If the JSX structure changes, verify both "No Active Booster" and "Active Booster" states render correctly.
- **Console errors**: Check browser DevTools console. Expected 403s for `/api/microtasks/` (unactivated account) and 400s for failed actions are normal. Watch for unexpected React/JS runtime errors.
- **Type interfaces**: TypeScript interfaces are defined inside component function bodies. They match the backend API response shapes but are trust-based casts (no runtime validation). If API responses change, the frontend might silently break.

## No CI Configured
This repo has no CI pipelines. Rely on local `npm run build` and `npm run lint` for verification.

## Devin Secrets Needed
None required for local testing. The backend uses a default JWT secret for development.
