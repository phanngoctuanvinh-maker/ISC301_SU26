# API Documentation

## Files

- `openapi_spec.yaml`: canonical OpenAPI 3.0 source.
- `openapi_spec.json`: generated JSON version for Apidog import.
- `api-reference.md`: human-readable API notes and examples.

## Generate JSON

```bash
npm run openapi:json
```

## Import Into Apidog

In Apidog, choose `Import` -> `OpenAPI/Swagger`, then select:

```text
docs/api/openapi_spec.json
```

## Runtime Swagger

When the backend is running, open:

```text
http://localhost:8080/swagger
```
