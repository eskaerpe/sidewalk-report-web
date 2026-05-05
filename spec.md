# Technical Specifications: UrbanFix

## 1. Application Architecture

UrbanFix operates on a standard Client-Server architecture separated by a RESTful JSON API.

- **Client (Frontend):** A Single Page Application (SPA) built with React and bundled via Vite. Maps are rendered using Leaflet via `react-leaflet`.
- **Server (Backend):** A Node.js/Express REST API handling business logic, validation, and file upload coordination.
- **Database Layer:** MySQL 8.0 accessed strictly through Prisma ORM.

## 2. Component Workflow

### 2.1 The Reporting Flow

1. User interacts with the React Form component.
2. Geolocation is captured via HTML5 Geolocation API or manual Leaflet map pin.
3. Form data is serialized and sent via `POST /api/reports`.
4. Express validates the payload, generates a unique UUID, and creates a Prisma record with `status: PENDING`.

### 2.2 The Validation (Upvote) Flow

1. User clicks "Upvote" on a `PENDING` report component in the UI.
2. App routes to `/upvote/:id`.
3. User confirms categories. React sends `POST /api/reports/:id/upvote` containing user IP.
4. Express checks Prisma `Upvote` table for existing IP on this `reportId`. If unique, it adds the record.
5. Express counts total upvotes for the `reportId`. If `>= 5`, it updates the Report `status` to `REAL`.

## 3. Core Libraries

- **Routing (FE):** `react-router-dom`
- **Mapping:** `leaflet`, `react-leaflet`, `react-leaflet-cluster`
- **HTTP Client:** `axios` or native `fetch`
- **Backend Framework:** `express`, `cors`, `helmet` (for basic security headers)
- **Database:** `@prisma/client`, `prisma`
- **File Upload:** `multer`, plus a cloud SDK (e.g., `cloudinary`)
