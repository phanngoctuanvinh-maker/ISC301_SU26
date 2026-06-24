# Frontend Guide

Frontend code lives in `frontend/`.

## Layout

- `frontend/src/pages/`: route-level screens.
- `frontend/src/components/`: reusable UI components.
- `frontend/src/services/`: API client code.
- `frontend/src/assets/`: frontend-only static assets.
- `backend/public/`: production build output served by the backend.

## Commands

```bash
cd frontend
npm install
npm run dev
npm run build
```

The root command `npm run build:fe` builds the frontend into `backend/public/`.
