# SkyGrid Endpoint Auto-Drill Matrix

This runner probes the required SkyGrid endpoint routes and emits a CI-attachable health artifact:

```bash
skygrid-endpoint-matrix-west01.json
```

## Required routes

- `POST /api/iot/ingest`
- `POST /ingest/receipt`
- `POST /validators/heartbeat`
- `POST /security/events`
- `GET /route/state`
- `POST /return/access`
- `GET /health`

## Run locally

```bash
cd node-javascript
SKYGRID_BASE_URL="https://your-service.example.com" node skygrid-endpoint-matrix.js
```

Alternative environment variables accepted for the base URL:

```bash
BASE_URL="https://your-service.example.com"
SITE_URL="https://your-service.example.com"
AWS_SERVICE_URL="https://your-service.example.com"
```

Optional:

```bash
SKYGRID_TIMEOUT_MS=8000
SKYGRID_OUTPUT=skygrid-endpoint-matrix-west01.json
SKYGRID_AUTH_TOKEN="Bearer <token>"
```

## Health grading

- Gold: `total_response_ms <= 500`
- Silver: `total_response_ms <= 1500`
- Bronze: `total_response_ms <= 3000`
- Fail: `total_response_ms > 3000`

`404`, network status `0`, `5xx`, and response times above `3000ms` are forced failures.

Protected `401`/`403` routes can pass only when `auth_expected=true`.
