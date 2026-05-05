# UrbanFix Development Backlog

## Phase 1: Setup & Infrastructure

- [x] Initialize Node/Express backend with standard middleware (CORS, body-parser).
- [x] Initialize Vite/React frontend.
- [x] Configure `.nvmrc` to Node v20.
- [x] Setup MySQL database and connect Prisma.
- [x] Draft Prisma `schema.prisma` (Report, Upvote, Status Enum) and run initial migration.

## Phase 2: Core API & Backend Features

- [x] Create central error-handling middleware in Express.
- [x] Implement `POST /api/reports` (Create report).
- [x] Implement `GET /api/reports` and `GET /api/reports/:id` (Fetch reports).
- [x] Implement `POST /api/reports/:id/upvote` (Upvote logic & status threshold).
- [x] Implement `PATCH /api/admin/reports/:id/complete` (Admin completion logic).
- [x] Protect `/api/admin/*` routes with auth middleware (static bearer token for milestone 1).

## Phase 3: Frontend UI & Maps

- [x] Initialize Vite/React frontend scaffold with app shell, routing, and mock data.
- [x] Build global navigation and layout wrapper.
- [x] Build `Home/Forum` page (List view of reports).
- [x] Build `Submission Form` with Leaflet map picker.
- [x] Integrate Leaflet map view (`City Map View`) with `react-leaflet-cluster`.
- [x] Build `Upvote Verification` page.

## Phase 4: Admin & Integrations

- [ ] Set up Multer and Cloudinary (or AWS S3) for image uploads.
- [x] Build `Admin Dashboard` UI.
- [ ] Implement image upload flow on the Admin "Complete" action.

## Phase 5: Frontend-Backend Integration

- [x] Add public admin login endpoint backed by single `.env` credential pair.
- [x] Normalize report response shape for public and admin endpoints.
- [x] Wire `Home/Forum`, `Submission Form`, `Upvote Verification`, `City Map View`, and `Admin Dashboard` to backend API calls.
- [x] Persist admin bearer token on the client for protected admin actions.

## Phase 6: Map Picker & UX Polish

- [x] Implement interactive Leaflet map picker with click-to-select.
- [x] Add draggable marker for coordinate fine-tuning.
- [x] Add geolocation support ("Use my current location" button).
- [x] Add crosshair overlay to show map center.
- [x] Improve coordinate display panel for mobile visibility.
- [ ] Add confirmation toast on successful coordinate pick.
- [ ] Add keyboard shortcuts for map picker (arrow keys to nudge marker).

## Milestone Notes

- Frontend is now wired to the backend API for report loading, submission, upvoting, and admin completion.
- Admin login now uses a single credential pair from `.env` and returns the existing bearer token for protected admin routes.
- Interactive Leaflet map picker is now fully functional with visual feedback (crosshair overlay) and mobile-friendly coordinate display.
- Prisma schema and scripts are in place, but migration execution is pending real MySQL credentials.
