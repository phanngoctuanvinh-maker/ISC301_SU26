# Infrastructure Guide

## Docker

The root `docker-compose.yml` starts:

- `mysql`: MySQL 8.4 with bootstrap SQL.
- `app`: Node.js API container.

Run from the repo root:

```bash
docker compose up -d --build
docker compose logs -f app
docker compose down
```

## Files

- `Dockerfile`: backend image definition.
- `docker-compose.yml`: local app + database stack.
- `infra/mysql/init.sql`: schema and seed data imported by MySQL on first startup.
- `docs/infra/docker.md`: original Docker usage notes.

## Volumes

- `mysql_data`: MySQL database files.
- `uploads_data`: uploaded images mounted at `/app/uploads`.
