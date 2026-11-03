# DEPLOY.md: where it lives and how to update it

No secrets in this file. Variable names only.

## Status

Live since 2026-10-29. HTTPS certificate from Let's Encrypt (renews automatically). Atlas allows the VPS IP.

## Facts

| What | Value |
|---|---|
| Site | https://study.joura.info |
| GitHub repo | https://github.com/abdullahalkafi-dev/study-hub (branch `main`) |
| VPS IP | 72.60.26.180 (Ubuntu 24.04, hostname `srv855297`) |
| SSH | `ssh root@72.60.26.180` (key login from the owner's PC) |
| Server folder | `/opt/study-hub` (git clone of the repo) |
| Docker project name | `silo-study` (containers `silo-study-web-1`, `-api-1`, `-minio-1`) |
| Database | MongoDB Atlas, database named by `MONGODB_DB_NAME` in the server `.env` (external, no DB container) |
| Web port on the server | `127.0.0.1:3010` (localhost only) |
| Reverse proxy | the server's existing **nginx**, site file `/etc/nginx/sites-available/study.joura.info`, HTTPS by certbot (Let's Encrypt) |
| DNS | `A  *  ->  72.60.26.180` (ttl 14400) at the joura.info DNS panel, so `study.joura.info` resolves already |

The same server also runs other projects (the `tarik-*` containers and their nginx sites). Do not touch those. `/opt/study-hub` and the `study.joura.info` nginx site are the only things that belong to this project.

## Server `.env` (`/opt/study-hub/.env`, never committed)

Created by hand on the server. Variable names:

`MONGODB_URI`, `MONGODB_USER`, `MONGODB_PASSWORD`, `MONGODB_DB_NAME`,
`LEARNER_EMAIL`, `LEARNER_PASSWORD`, `JWT_SECRET`, `COOKIE_SECURE=true`,
`MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`,
`PUBLIC_URL=https://study.joura.info`, `WEB_PORT=3010`.

The API refuses to start in production without `LEARNER_EMAIL`, `LEARNER_PASSWORD` and `JWT_SECRET`. The site login comes from `LEARNER_EMAIL` and `LEARNER_PASSWORD` in `/opt/study-hub/.env` (and the same two names in your local `.env`). To change the login, edit those two lines on the server, then run `docker compose up -d --force-recreate api`; the account is created or updated when the API starts. Old accounts are not deleted automatically.

## Update the site (normal routine)

On your PC: commit and `git push`. Then:

```bash
ssh root@72.60.26.180
cd /opt/study-hub
git pull
docker compose up -d --build
```

## Install new weeks (when a lesson zip arrives)

1. Unzip it into a scratch folder (`local/incoming-wNN/`, git-ignored). It holds `content/week-NN/day-N.txt` and `preview/`. Only the `week-NN` folders are needed.
2. Copy each `week-NN` folder to `packages/content/lessons/week-NN`.
3. Raise the default in `packages/content/scripts/build.mjs` (`CONTENT_MAX_WEEK`, currently 23) if the new weeks are above it.
4. `npm run content:build` (watch for parser warnings), then `npm run seed` (idempotent, never touches progress or notes). Check a lab day in the browser.
5. Secret scan, `git add -A && git commit && git push`, then on the server `cd /opt/study-hub && git pull && docker compose up -d --build` (the API container re-seeds on start).
6. Move the zip into `local/content-zips/` so the repo root stays clean.

## Lesson videos

Videos are not in git. `packages/content/videos/week-NN.json` maps each day to a math and a physics file name (and a poster .jpg). The API route `GET /api/videos/:week/:day/:subject` (and `.../poster`) streams the file with HTTP Range support, so seeking works. It serves the file from `local/videos/week-NN/` on the PC when it exists, otherwise from MinIO under the key `videos/week-NN/<file>`. The day page shows the two video cards only when the manifest lists videos for that day. To use them on the server the files must be in the server's MinIO (bucket from `MINIO_BUCKET`, key `videos/week-NN/<file>`).

Upload steps (additive, nothing is overwritten except the same keys):

1. Copy the folder to the server: `scp -r local/videos/week-01 root@72.60.26.180:/tmp/silo-videos/`
2. Deploy the code first if it changed: `ssh root@72.60.26.180 "cd /opt/study-hub && git pull && docker compose up -d --build"`
3. Put the files into MinIO from inside the api container (it already has the MinIO settings from `.env`, so no keys are typed anywhere): copy the folder in with `docker cp /tmp/silo-videos silo-study-api-1:/tmp/silo-videos`, then run a small script there that calls `mc().putObject(bucket, "videos/week-01/<file>", stream, size)` for every file (see `apps/api/src/modules/uploads/upload.service.ts` for `mc()`).
4. Remove the temp copies (`/tmp/silo-videos` on the server and in the container).
5. Check: `GET /api/videos/1/1` lists both videos, a request with `Range: bytes=0-99` returns 206, and a Week 2 page shows no video cards.

## Logs and status

```bash
cd /opt/study-hub
docker compose ps
docker compose logs -f api web
docker compose logs --tail 100 api
```

## Re-seed the lessons

The API container re-seeds the lessons from `packages/content/lessons` into Atlas every time it starts, so `docker compose up -d --build` after a `git pull` is enough. By hand:

```bash
docker compose exec api npm run seed -w @silo/api
```

The seed only adds or updates lessons. It never touches progress or notes.

## nginx and HTTPS

Site file (HTTP part; certbot adds the HTTPS part and the redirect):

```nginx
server {
    server_name study.joura.info;
    client_max_body_size 55M;           # uploads up to 50 MB
    location / {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    listen 80;
}
```

Enable and certify:

```bash
ln -s /etc/nginx/sites-available/study.joura.info /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d study.joura.info
```

Certbot renews automatically. Check with `certbot certificates`.

## Gotchas

- A too-broad `.gitignore` line (`uploads/`) once hid `apps/api/src/modules/uploads` from git, so the first server build failed with "Cannot find module upload.service.ts". Ignore rules for root folders must start with `/` (for example `/uploads/`). After editing `.gitignore`, check with `git status --ignored`.
- The server also hosts other projects. Their nginx sites and `tarik-*` containers must not be touched. Check `docker ps` and `ls /etc/nginx/sites-enabled` before changing anything.

- **Atlas Network Access** must allow the VPS IP `72.60.26.180`. If `/api/health` shows `"db": false` or the api container keeps restarting with a connection error, add the IP in Atlas (Security, Network Access).
- **`COOKIE_SECURE=true`** only works over HTTPS. If you test over plain http the login will not stick.
- `docker-compose.dev.yml` is for your PC only. Never use it on the server (it publishes ports).
- Only ports 80, 443 and 22 should be reachable from outside for this project. The api and MinIO have no public ports.
- The official `minio/minio` image is gone from Docker Hub, so compose uses `bitnamilegacy/minio`.
- The Next.js proxy address (`API_URL`) is baked in at build time (`http://api:4000`). If you change the service name, rebuild.
- Do not run `docker compose down -v`: it deletes the MinIO uploads volume.

## Auto-deploy (optional, not enabled)

`.github/workflows/deploy.yml` can run the update commands over SSH from GitHub. To enable it: create a dedicated SSH key pair, add its public key to `/root/.ssh/authorized_keys` on the server, and add the repository secrets `VPS_HOST` (72.60.26.180), `VPS_USER` (root) and `VPS_SSH_KEY` (the private key). Then start it from the Actions tab ("Run workflow"), or add a `push` trigger for `main`. Prefer a non-root deploy user if you set this up for real.
