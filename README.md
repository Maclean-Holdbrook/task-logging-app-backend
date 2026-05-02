# Taskk Backend

Backend API and MCP service for the Taskk frontend.

## Responsibilities

- Serve the HTTP API under `/api`
- Persist tasks in Supabase
- Expose MCP tools for task operations

## Scripts

- `npm run dev`
- `npm start`
- `npm run mcp`

## Environment

Copy `.env.example` to `.env` and fill in:

- `PORT`
- `FRONTEND_ORIGIN`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

`FRONTEND_ORIGIN` can be a comma-separated list of allowed frontend origins.

## Initial API

- `GET /api/health`
- `GET /api/tasks`
- `GET /api/tasks/:id`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `PATCH /api/tasks/:id/status`
- `DELETE /api/tasks/:id`
