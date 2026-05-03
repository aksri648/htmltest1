# AI Boardroom (MERN) - Minimal Scaffold

This repository contains a minimal MERN scaffold for an AI-powered Boardroom Decision System.

Quick start

1. Install server deps:

```bash
npm install
```

2. (Optional) Install client deps:

```bash
npm run install-client
```

3. Create `.env` from `.env.example` and set `MONGO_URI` if you want DB persistence.

4. Run server in dev:

```bash
npm run dev
```

5. Run client (inside `/client`):

```bash
cd client
npm run dev
```

API

- `POST /api/proposals/generate` — body `{ role, proposal, context }` returns three agents and chairman report.

Notes

- This is a minimal scaffold. The agent logic in `utils/generate.js` is deterministic and uses only provided inputs.
