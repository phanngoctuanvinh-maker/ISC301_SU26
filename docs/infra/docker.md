# Docker Deploy

## Files

- `Dockerfile`: builds the backend Node.js image.
- `docker-compose.yml`: starts the API and MySQL together.
- `.env.example`: template for local environment variables.
- `.dockerignore`: keeps the Docker build context small.
- `infra/mysql/init.sql`: schema and seed data imported by MySQL on first volume initialization.

## Run

1. Create `.env` from `.env.example`.
2. Update sensitive values such as `JWT_SECRET`, `MAIL_USER`, `MAIL_PASS`, and `GOOGLE_CLIENT_ID`.
3. Start the stack from the repo root:

```bash
docker compose up -d --build
```

4. View backend logs:

```bash
docker compose logs -f app
```

5. Stop the stack:

```bash
docker compose down
```

## Notes

- The API is published on `PORT`, default `8080`.
- MySQL uses the `mysql_data` volume.
- Uploaded images use the `uploads_data` volume.
- MySQL imports `infra/mysql/init.sql` only when the database volume is created for the first time.
