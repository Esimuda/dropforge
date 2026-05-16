# Dropforge

A two-sided Web3 quest and airdrop management platform.

- **Project teams** create campaigns with tasks (Twitter follow, Discord join, token/NFT hold, screenshot, manual review), then export the list of eligible participants and their wallet addresses for off-platform airdrops or whitelists.
- **Participants** complete tasks to earn points, submit a wallet address, and track their eligibility on a leaderboard.

The platform itself **does not distribute tokens** — it collects wallets and tracks eligibility. The project team takes the export and runs the actual airdrop or whitelist seeding.

## Repository layout

```
/                  Next.js 14 frontend (App Router, Tailwind, wagmi v2, RainbowKit)
/backend           NestJS REST API (Prisma, Postgres, Bull/Redis, JWT)
/backend/prisma    Schema, raw SQL migration, RLS policies, seed
/docker-compose.yml  Local Postgres + Redis + API for end-to-end dev
```

## Tech stack

**Frontend:** Next.js 14 · TypeScript · Tailwind CSS · wagmi v2 + RainbowKit · NextAuth.js · TanStack Query · Zustand · React Hook Form + Zod · Radix UI (shadcn) · Lucide.

**Backend:** NestJS · TypeScript · Prisma · PostgreSQL · Bull + Redis · JWT (access 15m + refresh 7d, httpOnly cookies) · class-validator · Cloudinary · Resend · ethers (EVM verification).

## Running locally

### Option A: Docker (fastest)

```bash
docker compose up --build
```

This brings up Postgres, Redis, and the API on `http://localhost:3000`. Apply the schema and seed:

```bash
docker compose exec api npx prisma migrate deploy
docker compose exec api npx prisma db seed
```

Run the frontend separately:

```bash
npm install
npm run dev    # http://localhost:8080
```

### Option B: Bare metal

```bash
# Postgres + Redis must be running
cp backend/.env.example backend/.env   # then edit values

cd backend
npm install
npx prisma generate
npx prisma migrate dev      # OR: psql < prisma/migrations/0001_init.sql
npx prisma db seed
npm run start:dev

# in another terminal
cd ..
cp .env.example .env.local  # then edit values
npm install
npm run dev
```

## Database

Prisma is the source of truth (`backend/prisma/schema.prisma`). For environments where `prisma migrate` is not used (e.g. Supabase managed via the SQL editor), apply the equivalent raw SQL:

- `backend/prisma/migrations/0001_init.sql` — schema, indexes, `pg_trgm`, `pg_cron` auto-end job.
- `backend/prisma/policies.sql` — Supabase Row-Level Security policies (run after the schema).

Key invariants:

- Wallet addresses are AES-256-GCM encrypted at rest. `iv` is stored alongside the ciphertext column so external decryption tools can read it.
- `CampaignParticipant.isEligible` is `true` only when every `Task.isRequired` task in that campaign has an `APPROVED` `Submission` for that user. Recomputed on every approval.
- `Campaign.totalPoints` is the sum of `Task.points` for that campaign, maintained on create and on publish.
- Whitelist grants live in a dedicated `WhitelistSlot` table with `GRANTED` / `REVOKED` status and audit fields (`grantedBy`, `grantedAt`).

## Chain values

Chains are free-form strings using these canonical values across all layers (frontend, backend DTOs, DB rows):

```
ETH · BASE · ARB · MATIC · BNB · AVAX · SOL · OTHER
```

On-chain verification (`TOKEN_HOLD` / `NFT_HOLD`) routes EVM chains through the per-chain RPCs configured in `backend/.env`. `SOL` is recognized but the EVM-based verifier returns a "handled server-side" message until a Solana RPC client is wired in.

## Auth flow

`/auth/twitter`, `/auth/discord`, and `/auth/wallet` exchange an OAuth token or a signed message for an access/refresh JWT pair. Tokens land in httpOnly cookies (`access_token`, `refresh_token`). The frontend `/login` route is the redirect target for unauthenticated access to protected pages.

## Deployment

- **Frontend:** static export to GitHub Pages via `.github/workflows/pages.yml` (`output: 'export'` when `GITHUB_PAGES=true`). For a full app with live API calls, deploy to Vercel instead and omit the `GITHUB_PAGES` env var.
- **Backend:** `backend/render.yaml` is a Render.com blueprint. The `Dockerfile` is generic and works on Fly, Railway, Cloud Run, etc.
- Both Postgres and Redis are required in production. Supabase is the assumed Postgres host (`policies.sql` targets its `auth.uid()`).

## What's not in scope

- Token distribution / on-chain airdrop execution. Use the export CSV with your tool of choice (Disperse, Sablier, Merkle drops).
- Solana on-chain verification (chain is accepted; verifier is a stub).
- Automated tests — neither spec required them; production-readiness work.
