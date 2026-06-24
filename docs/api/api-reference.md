# API Reference

The canonical API reference is the OpenAPI specification:

- `docs/api/openapi_spec.yaml`
- `docs/api/openapi_spec.json`

Use the JSON file for Apidog import. Use the YAML file as the source of truth when updating endpoint contracts.

## Runtime Documentation

When the backend is running, open:

```text
http://localhost:8080/swagger
```

## Authentication

Protected routes use a bearer token:

```http
Authorization: Bearer <jwt>
```

Admin routes require a JWT whose decoded user role is `admin`.

## Response Envelope

Successful responses use:

```json
{
  "success": true,
  "message": "Vietnamese response message",
  "data": {}
}
```

Error responses use:

```json
{
  "success": false,
  "message": "Vietnamese response message",
  "errors": null
}
```

Server-side `500` errors intentionally do not expose internal error details in `errors`.
