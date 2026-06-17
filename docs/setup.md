# Setup Guide

## Local Backend

1. Install dependencies:

```bash
npm install --prefix backend
```

2. Create `.env` from `.env.example` and set database, JWT, mail, and Google OAuth values.

3. Start the backend:

```bash
npm run dev
```

The API runs on `http://localhost:8080` by default.

## Local Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend proxies API and upload requests to the backend during development.

## Database

For local MySQL, create the database named by `DB_NAME` and import:

```text
infra/mysql/init.sql
```

For Docker, Compose creates the database and imports the SQL file automatically on first volume initialization.
