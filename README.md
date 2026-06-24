# Shoes Store

Shoes Store is a Node.js/Express backend with a React frontend and MySQL database.

## Quick Start

```bash
npm install --prefix backend
npm run dev
```

Docker:

```bash
docker compose up -d --build
```

API docs are available at `http://localhost:8080/swagger` when the backend is running.

## Project Map

| Path | Purpose |
| --- | --- |
| `backend/` | Backend package, server entrypoint, source code, tests, and built public assets. |
| `frontend/` | React/Vite frontend source. |
| `docs/` | Architecture, setup, API, and deployment documentation. |
| `infra/` | Infrastructure assets such as MySQL bootstrap SQL. |
| `tools/` | Developer utilities and one-off maintenance scripts. |
| `backend/tests/` | Node backend test suite. |
| `backend/public/` | Built frontend assets served by Express in production. |

## Main Docs

- [Documentation index](docs/README.md)
- [Architecture](docs/architecture.md)
- [Setup guide](docs/setup.md)
- [API docs](docs/api/README.md)
- [Infrastructure docs](docs/infra/README.md)
- [Backend guide](docs/backend/README.md)
- [Frontend guide](docs/frontend/README.md)

## Common Commands

```bash
npm test
npm run openapi:json
npm run db:seed
docker compose ps
docker compose logs -f app
```
