# Product Requirements Document: UrbanFix

## 1. Project Overview

UrbanFix is a community-driven reporting platform designed to streamline city maintenance by identifying potholes, broken lights, and pavement issues. The platform leverages crowdsourced data and upvote validation to prioritize civic repairs and provide transparency through an admin resolution flow.

## 2. System Roles

- **Reporter:** An anonymous or authenticated user who submits issues.
- **Validator (Upvoter):** A user who verifies that an existing report is accurate.
- **Admin:** A city official or moderator who manages reports and marks them as completed with visual proof.

## 3. Functional Requirements

### 3.1 Front-End (React)

- **Home / Forum:** The landing page showing a feed of recent reports. Key features include a Search/Filter function, an Upvote button, and status badges indicating Pending, Real, or Completed states.
- **Submission Form:** A multi-step or long-form interface for issue reporting. It must feature a Map picker using Leaflet, Category checkboxes, Image upload capabilities, and an Anonymity toggle.
- **Upvote Verification:** A dedicated page for validating a report. It includes a summary of the original report, a "Confirm Issue" button, and Category verification.
- **City Map View:** An interactive map visualization. It requires Marker clustering, tooltips showing report previews, and Status-based filtering.
- **Admin Dashboard:** A protected view for city management. Features include a Priority list sorted by upvotes and a "Complete" action that includes a mandatory file upload.

### 3.2 Back-End API (Express & Prisma)

- **POST `/api/reports` (Public):** Submits a new report and handles optional email and multi-category data.
- **GET `/api/reports` (Public):** Returns a list of all reports for the Forum and Map views.
- **GET `/api/reports/:id` (Public):** Fetches detailed information for a specific report to populate the Upvote page.
- **POST `/api/reports/:id/upvote` (Logic):** Creates a record in the Upvotes table. If total upvotes for the report reach 5, the status automatically updates to "Real".
- **GET `/api/admin/reports` (Protected):** Returns all reports, including filters for "Valid" (Real) issues.
- **PATCH `/api/admin/reports/:id/complete` (Protected):** Updates status to "Completed". Requires an image URL in the request body.

## 4. Technical Specifications & Architecture

### 4.1 Prisma Schema Considerations

- **Categories:** Stored as a `JSON` data type to support MySQL integration without scalar list migration errors.
- **Images:** The `Report` model distinguishes between the initial `imageUrl` and a `resolutionImageUrl` (submitted by the Admin).

### 4.2 Business Logic & Map Implementation

- **Validation Loop:** Users submit reports which start as `PENDING`. Clicking "Upvote" redirects to an UpvotePage. Reaching 5 unique upvotes changes the status to `REAL`.
- **Map Implementation:** Uses `react-leaflet-cluster` to group proximate reports.
- **Admin Proof of Work:** Admins cannot set a status to "Completed" without a `resolutionImageUrl` via a cloud provider.

### 4.3 Stable Tech Stack & Version Matrix

- Node.js: `v20.x LTS`
- Database: `MySQL 8.0.x`
- React & React DOM: `^18.3.0`
- Vite: `^5.2.0`
- Leaflet: `^1.9.4` | React-Leaflet: `^4.2.1` | React-Leaflet-Cluster: `^2.1.0`
- Express: `^4.21.0` | Prisma: `^6.0.0` | Multer: `^1.4.5-lts.1`
