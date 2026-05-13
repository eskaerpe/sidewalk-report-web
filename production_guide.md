# UrbanFix Production Guide

This document lists the steps and checks to make the project production-ready. It focuses on configuration, hosting, security, and operational practices based on the current codebase.

## 1) Environment and Secrets

The app relies on environment variables from .env. For production, do not commit .env. Use your host's secret manager or environment settings.

Required variables (from .env.example):

- API_PORT (or PORT)
- CORS_ORIGIN
- VITE_API_BASE_URL
- ADMIN_USERNAME
- ADMIN_PASSWORD
- ADMIN_TOKEN
- DATABASE_URL

Production guidance:

- Use strong, random values for ADMIN_PASSWORD and ADMIN_TOKEN.
- Set CORS_ORIGIN to your public frontend domain (not localhost).
- Set VITE_API_BASE_URL to your public API base URL.
- Use a production database user with least privileges.

## 2) Frontend Build and Hosting

The frontend is a Vite app. Build it for production, then host the static files via a CDN or a static hosting service.

Build commands:

```bash
npm install
npm run build
```

This outputs static files to dist/.

Hosting options:

- Static host (Netlify, Vercel, Cloudflare Pages)
- Object storage + CDN (S3 + CloudFront)
- Serve dist/ behind a reverse proxy (Nginx, Caddy)

If you use a separate domain for frontend, update CORS_ORIGIN and VITE_API_BASE_URL accordingly.

## 3) API Server Deployment

The backend is an Express app located in server/. It uses API_PORT or PORT.

Production run example:

```bash
npm run start:server
```

Recommendations:

- Run behind a reverse proxy (Nginx, Caddy) with HTTPS.
- Use a process manager (systemd, PM2, or Docker).
- Set NODE_ENV=production.
- Keep API on a private network when possible; only expose the proxy.

## 4) Database and Prisma

The API expects a MySQL or MariaDB database. The database connection string is DATABASE_URL.

Migration steps (run once during deployment or in CI/CD):

```bash
npm run prisma:generate
npm run prisma:migrate
```

Recommendations:

- Use a managed MySQL service in production.
- Enable automated backups.
- Use a dedicated database user for the app.

## 5) CORS and Network Security

Current backend behavior:

- CORS is configured in server/app.js using CORS_ORIGIN.

Production guidance:

- Set CORS_ORIGIN to the exact frontend domain (no wildcards).
- Add a reverse proxy to handle HTTPS and set security headers.

## 6) Admin Authentication

Current behavior:

- Admin login uses ADMIN_USERNAME and ADMIN_PASSWORD from environment.
- Admin access is authenticated by a token (ADMIN_TOKEN).

Production guidance:

- Use a long, random ADMIN_PASSWORD and ADMIN_TOKEN.
- Rotate these values regularly.
- Consider replacing with a real auth system if multiple admins are required.

## 7) File Uploads and User Content

Current behavior:

- The app uses image URLs rather than file uploads.

Production guidance:

- If you later add file uploads, store files in object storage and validate content type.
- Consider malware scanning and size limits.

## 8) Rate Limiting and Abuse Protection

Current behavior:

- Upvotes are limited by unique IP hashing in the database.

Production guidance:

- Add API rate limiting at the proxy level (Nginx/Caddy) or add an Express limiter.
- Consider IP reputation or CAPTCHA on submission if abuse appears.

## 9) Logging and Monitoring

Recommendations:

- Use structured logs (JSON) and centralize logs (e.g., Loki, Datadog).
- Add uptime checks for /health.
- Monitor error rates and database connectivity.

## 10) CI/CD and Versioning

Recommended steps for CI/CD:

- Install dependencies
- Run lint/tests (if added)
- Build frontend
- Run Prisma generate/migrate
- Deploy frontend and backend

Example pipeline commands:

```bash
npm ci
npm run build
npm run prisma:generate
npm run prisma:migrate
```

## 11) Checklist Before Go-Live

- Update .env production values (no localhost entries).
- Confirm CORS_ORIGIN and VITE_API_BASE_URL match public URLs.
- Use HTTPS for both frontend and API.
- Verify /health returns ok in production.
- Run a smoke test: submit report, upvote, admin login, mark completed.
- Confirm database backups are enabled.
