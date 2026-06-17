# Backend Guide

Backend code lives in `backend/`.

## Layout

- `backend/server.js`: process entrypoint, cron startup, and seed check.
- `backend/src/app.js`: Express app factory and route registration.
- `backend/src/config/`: database, mail, and OAuth configuration.
- `backend/src/middlewares/`: authentication, authorization, validation, and upload middleware.
- `backend/src/modules/`: feature modules.
- `backend/src/jobs/`: scheduled jobs.
- `backend/src/utils/`: shared utilities.
- `backend/src/scripts/`: backend scripts that depend on app internals.
- `backend/tests/`: backend test suite.
- `backend/public/`: built frontend assets served by Express.

## Module Convention

Feature modules use:

- `*.routes.js` for route definitions.
- `*.controller.js` for request/response handling.
- `*.service.js` for business logic and database access.
- `*.validation.js` for Joi request schemas.

Keep new business features under `backend/src/modules/<feature>/` unless the code is a cross-cutting utility or middleware.
