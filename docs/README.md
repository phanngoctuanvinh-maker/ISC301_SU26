# Documentation

This folder is the project documentation hub.

## Index

- [Architecture](architecture.md): system overview, module layout, database, and business flows.
- [Setup](setup.md): local development and environment variables.
- [API](api/README.md): OpenAPI files and Apidog import notes.
- [Backend](backend/README.md): backend folder conventions and module structure.
- [Frontend](frontend/README.md): frontend folder conventions and build output.
- [Infrastructure](infra/README.md): Docker, MySQL bootstrap data, and deployment notes.

## Maintenance Rules

- Keep public API changes reflected in `docs/api/openapi_spec.yaml`.
- Regenerate `docs/api/openapi_spec.json` with `npm run openapi:json`.
- Put operational setup in `docs/setup.md` or `docs/infra/`.
- Keep detailed implementation notes near the subsystem docs, not in the root README.
