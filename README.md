# Silo Study Desk

An 8-month math + physics course as a web app: interactive labs with sliders and graphs, quizzes, exit tickets, predict-first boxes, Bangla boxes, dark/light theme, progress and notes saved in MongoDB Atlas, and optional photo/audio/video uploads per day (MinIO).

```
silo-study/
  apps/web            Next.js 15 (App Router, TypeScript): the study app
  apps/api            Node + Express + Mongoose (TypeScript), one folder per module:
                      auth, weeks, progress, notes, uploads, audit
  packages/content    lesson parser + build script
    lessons/week-NN/day-N.txt   the lessons (Weeks 1-19), written in the lesson markup
  deploy/Caddyfile    optional HTTPS reverse proxy config
  docker-compose.yml  web + api + minio (+ caddy with --profile proxy)
  docker-compose.dev.yml  local-only extras (never loaded automatically)
  .github/workflows   ci.yml (build + docker build) and deploy.yml (manual SSH deploy)
  local/              files kept on your PC only (git-ignored): old builds, zips, roadmap
```

The database is **MongoDB Atlas** (external). There is no database container.

## Run it on your PC (Windows)

Needs Node.js 20+, a MongoDB Atlas cluster, and (only for uploads) Docker Desktop.

```powershell
npm install
copy .env.example .env      # then edit .env, see below
npm run seed                # builds the lessons and loads them into Atlas (safe to repeat)
npm run dev                 # web on http://localhost:3000, API on http://localhost:4000
```

In `.env` set at least `MONGODB_URI` (Atlas string, keep `<db_username>:<db_password>` in it), `MONGODB_USER`, `MONGODB_PASSWORD` and `MONGODB_DB_NAME`. In Atlas, allow your IP under Network Access. If `MONGODB_URI` is missing or local, the API and the seed stop with a clear message.

Uploads (optional): set `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY` (any long random values), then

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d minio
```

Login is off by default on your PC (single user). Set `LEARNER_EMAIL`, `LEARNER_PASSWORD` and `JWT_SECRET` to turn it on. The learner is also the admin who can open **Activity log**.

## Deploy on a VPS

1. On the server install Docker with the compose plugin, then clone the repo:
   ```bash
   git clone https://github.com/<you>/<repo>.git /opt/study-hub && cd /opt/study-hub
   ```
2. Create `.env` on the server from `.env.example` (never commit it). **Required in production:** `MONGODB_URI` + user/password/db name, `LEARNER_EMAIL`, `LEARNER_PASSWORD`, `JWT_SECRET`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `PUBLIC_URL`. The API refuses to start in production without a login. In Atlas add the server's IP under Network Access.
3. Start it:
   ```bash
   docker compose up -d --build
   ```
   The web app listens on port 3000. The API and MinIO are only on the internal Docker network.
4. HTTPS (optional): point a DNS A record at the server, set `DOMAIN=your.domain` and `COOKIE_SECURE=true` in `.env`, and run
   ```bash
   docker compose --profile proxy up -d --build
   ```
   Caddy gets a certificate automatically and proxies to the web app (which proxies `/api` to the API). Open ports 80 and 443 in the firewall. Or use your own nginx/Caddy and proxy to `127.0.0.1:3000`.
5. Update later:
   ```bash
   git pull && docker compose up -d --build
   ```
   Logs: `docker compose logs -f api web`. Lessons are re-seeded every time the API container starts; to do it by hand run `docker compose exec api npm run seed -w @silo/api`.

GitHub Actions: `ci.yml` builds everything on every push. `deploy.yml` can update the server over SSH; it needs the repository secrets `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY` (a deploy key you create) and is started by hand from the Actions tab.

## Adding or changing lessons

Put each week's files in `packages/content/lessons/week-NN/day-1.txt` to `day-6.txt`, then `npm run seed`. The number of included weeks is `CONTENT_MAX_WEEK` (default 19).

## API (all under `/api`, JSON)

| Route | What |
|---|---|
| `GET /health` | API and database status |
| `GET /auth/me`, `POST /auth/login`, `POST /auth/logout` | session |
| `GET /weeks`, `/weeks/:w`, `/weeks/:w/:d` | overview, one week, one lesson |
| `GET /progress`, `PUT /progress/:w-:d-:part` | finished parts; body `{ "done": true }`; part is recall, math, physics or notes |
| `GET /notes`, `PUT /notes/:w-:d` | notes; body `{ "text": "..." }` |
| `GET/POST /uploads/:w/:d`, `GET/DELETE /uploads/file/:id` | per-day files (image, audio, video; up to 50 MB) |
| `GET /admin/audit` | activity log (admin only) |

## Secrets

Real values live only in `.env` (git-ignored). `.env.example` has placeholders only. Nothing in `local/` or `.env*` (except the example) is committed.
