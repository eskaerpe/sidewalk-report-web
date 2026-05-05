# UrbanFix

UrbanFix is a civic reporting web app for submitting, validating, and resolving city infrastructure issues. It includes a React + Vite frontend, an Express API backend, and a MySQL database accessed via Prisma.

## Tech Stack

- Frontend: React 18, Vite, Tailwind CSS, Leaflet
- Backend: Node.js, Express, Prisma
- Database: MySQL / MariaDB

## Core Features

- Submit reports with categories, location, and optional image URL
- Validate reports through upvotes (auto-promote to REAL at 5 unique upvotes)
- City map view with clustered report markers
- Admin dashboard for completing reports with resolution image URL
- Admin login with a single credential pair stored in .env

## Project Structure

- src/ - React app
- server/ - Express API
- prisma/ - Prisma schema and migrations

## Requirements

- Node.js 20 (see .nvmrc)
- MySQL 8.x or MariaDB

## Environment Setup

Copy .env.example to .env and adjust values:

```
# Backend runtime
API_PORT=3001
CORS_ORIGIN=http://localhost:5173

# Frontend runtime
VITE_API_BASE_URL=http://localhost:3001

# Single admin credential
ADMIN_USERNAME=admin
ADMIN_PASSWORD=replace-with-a-long-random-password
ADMIN_TOKEN=replace-with-a-long-random-token

# MySQL connection
# Example: mysql://user:password@localhost:3306/urbanfix
DATABASE_URL=mysql://root:password@localhost:3306/urbanfix
```

## Install Dependencies

```
npm install
```

## Database Setup (Prisma)

Generate Prisma client:

```
npm run prisma:generate
```

Run migrations:

```
npm run prisma:migrate
```

Check migration status:

```
npm run prisma:status
```

## Run the App

You will run the frontend and backend in separate terminals.

### 1) Start the Express API

```
npm run dev:server
```

This starts the API on http://localhost:3001 by default.

### 2) Start the React + Vite app

```
npm run dev
```

This starts the frontend on http://localhost:5173 by default.

### 3) Production Preview

Build the frontend:

```
npm run build
```

Preview the built frontend:

```
npm run preview
```

### 4) Start API in Production Mode

```
npm run start:server
```

## Admin Login

The API exposes a login endpoint that validates the admin username and password from .env.

```
POST /api/admin/login
Body: { "username": "...", "password": "..." }
```

The response includes a bearer token that is used to access admin endpoints.

## API Endpoints (Summary)

Public:

- GET /health
- POST /api/reports
- GET /api/reports
- GET /api/reports/:id
- POST /api/reports/:id/upvote

Admin:

- POST /api/admin/login
- GET /api/admin/reports
- PATCH /api/admin/reports/:id/complete

## Notes

- Admin completion requires a resolutionImageUrl.
- Categories are stored as JSON due to MySQL limitations on scalar lists.
- The map picker supports selecting locations visually and from existing report pinpoints.

## Troubleshooting

- Ensure DATABASE_URL is reachable and valid.
- If CORS errors occur, confirm CORS_ORIGIN matches your frontend URL.
- If admin login fails, verify ADMIN_USERNAME, ADMIN_PASSWORD, and ADMIN_TOKEN in .env.
