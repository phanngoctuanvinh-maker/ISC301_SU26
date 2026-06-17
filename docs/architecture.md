# Shoes Store Backend Architecture

This document describes the backend structure, major runtime components, and business flows for the Shoes Store API.

## Technology Stack

- **Runtime:** Node.js with Express.
- **Database:** MySQL through `mysql2/promise`.
- **Authentication:** JWT, bcrypt password hashing, and optional Google OAuth login.
- **Validation:** Joi schemas at request boundaries.
- **Uploads:** Multer for avatar, brand logo, category image, and product image uploads.
- **Background jobs:** `node-cron` for expired OTP cleanup.
- **API documentation:** OpenAPI 3.0 served through `/swagger`.

## Repository Layout

```text
ISC301_SU26/
+-- README.md                  # Project entrypoint and documentation index
+-- Dockerfile                 # Backend image definition
+-- docker-compose.yml         # Local app + MySQL stack
+-- backend/                   # Backend package, server, source, tests, and built assets
|   +-- server.js              # Backend process entrypoint
|   +-- src/                   # Runtime source code
|   +-- tests/                 # Backend test suite
|   +-- public/                # Frontend production build served by Express
+-- frontend/                  # React/Vite frontend source
+-- docs/                      # Project documentation
+-- infra/mysql/init.sql       # MySQL schema and seed data
+-- tools/                     # Developer utilities and scratch scripts
```

## Backend Layout

Backend source code is module-based:

- `backend/src/app.js`: Express app factory, middleware setup, route registration, and static asset serving.
- `backend/src/config/`: database, mail, OAuth, and environment loading.
- `backend/src/modules/`: feature modules grouped by domain.
- `backend/src/middlewares/`: authentication, authorization, validation, and upload handling.
- `backend/src/jobs/`: scheduled jobs.
- `backend/src/utils/`: shared helpers.
- `backend/src/scripts/`: backend scripts such as database seed.

Feature modules follow the same convention:

- `*.routes.js`: Express route definitions.
- `*.controller.js`: request/response handling.
- `*.service.js`: business logic and database access.
- `*.validation.js`: Joi validation schemas.

## Main Business Flows

### Authentication

Users can register with email/password, verify registration through OTP, request OTP resend, log in with email/password, or log in with Google. Passwords are hashed with bcrypt, and successful authentication returns a JWT.

### Profiles and Addresses

Authenticated users can update profile data, change passwords, upload avatars, and manage shipping addresses. Address logic keeps at most one default address per user.

### Catalog

Public catalog endpoints expose active products, categories, and brands. Admin endpoints manage products, categories, and brands behind JWT role checks.

### Admin Catalog Management

Admin category management supports a two-level tree. Admin brand and product management support image uploads and active/inactive toggles.

## Database

The MySQL schema and seed data live in `infra/mysql/init.sql`. Docker imports this file when the MySQL volume is created for the first time.

Core tables:

- `users`
- `otp_pending`
- `addresses`
- `categories`
- `brands`
- `products`

## Runtime Notes

- The backend reads `.env` from the project root and optionally from `backend/.env`.
- In local development, built frontend assets are served from `backend/public`.
- In Docker, the image copies `backend/` into `/app` and copies `docs/` into `/app/docs` so Swagger can serve the OpenAPI file.
