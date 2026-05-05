# GitHub Copilot Instructions for UrbanFix

## 1. Architectural Constraints (CRITICAL)

- **Map Clustering:** NEVER use `react-leaflet-markercluster`. You MUST use `react-leaflet-cluster` to maintain React 18 compatibility.
- **Database Schema:** We are using MySQL with Prisma. Prisma does NOT support string arrays (`String[]`) in MySQL. You must map categories using the `JSON` data type or a relational table.
- **Image Handling:** Admins must provide a `resolutionImageUrl` to close a ticket. Do not overwrite the user's original `imageUrl`.

## 2. Tech Stack & Versioning

- **Frontend:** React 18, Vite, React-Leaflet v4.
- **Backend:** Express.js, Prisma ORM v6, Node.js v20.
- **Database:** MySQL 8.0.

## 3. Code Style & Conventions

- Use functional React components with Hooks.
- Use early returns to prevent deep nesting.
- Ensure all Express routes use `try/catch` blocks and pass errors to a centralized Express error-handling middleware.
- Do not trust client input: validate all `POST` and `PATCH` request bodies before interacting with Prisma.

## 4. Security Standards

- IPs (`userIp`) must be anonymized or hashed if stored long-term.
- Admin routes (`/api/admin/*`) must be protected by an authentication middleware (e.g., JWT). Do not generate unprotected admin endpoints.
