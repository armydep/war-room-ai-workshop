# WarRoom — Capstone Exercise Template

## Quick Start

Dependencies are already installed. Just run:

```bash
npm run dev
```

Open http://localhost:3001 — you should see the placeholder page.

## Your Task

Build a real-time incident command center in 30 minutes using AI + the skills pack.

### What to build

- **Backend:** 8 API endpoints, WebSocket, SQLite database, seed data
- **Frontend:** React dashboard with charts, live feed, filterable incident table

### How to build it

1. Open the 6 skills pack files (you'll receive these separately)
2. Feed them to your AI tool along with a simple prompt like:
   *"Build the WarRoom incident command center backend based on these context files"*
3. Paste the generated code into `src/index.ts` and `src/seed.ts`
4. Generate the frontend into `public/index.html`
5. Run `npm run seed` then `npm run dev`

## Available Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start the server (auto-restarts on changes) |
| `npm run seed` | Generate seed data into SQLite |

## Project Structure

```
├── src/
│   ├── index.ts    ← Your backend goes here
│   └── seed.ts     ← Your seed script goes here
├── public/
│   └── index.html  ← Your frontend goes here
├── package.json
└── tsconfig.json
```

## Tech Stack (pre-configured)

- **Runtime:** Node.js + TypeScript (strict mode)
- **Server:** Express + Socket.io
- **Database:** SQLite via better-sqlite3
- **Frontend:** React + Recharts (loaded from CDN, no build step)
