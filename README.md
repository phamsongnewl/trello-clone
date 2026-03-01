# Trello Clone

A full-stack Trello-like project management application built with:

- **Frontend** — React 18, MUI v5, @hello-pangea/dnd, TanStack Query
- **Backend** — Node.js 20, Express, Sequelize ORM, PostgreSQL 16
- **Infrastructure** — Docker Compose with healthchecks and automatic restart

---

## Quick Start

> **Prerequisites:** [Docker 24+](https://docs.docker.com/get-docker/) with the Compose plugin (v2).
> No local Node.js or PostgreSQL installation required.

```bash
# 1. Clone the repository
git clone <your-repo-url> trello-clone
cd trello-clone

# 2. Create the backend environment file
cp backend/.env.example backend/.env
#    Edit backend/.env if you want to change any defaults (optional for local dev)

# 3. Build images and start all services
docker compose up --build

# 4. Open the app
#    → http://localhost:3000
```

The first build takes ~2 minutes. Subsequent starts (without `--build`) are instant.

---

## Port Reference

| Service  | Host port | Container port | Description                      |
| -------- | --------- | -------------- | -------------------------------- |
| frontend | 3000      | 80             | React app (nginx)                |
| backend  | 5000      | 5000           | REST API (Express)               |
| db       | —         | 5432           | PostgreSQL (not exposed to host) |

---

## Project Structure

```
trello-clone/
├── backend/
│   ├── src/
│   │   ├── config/          # Sequelize DB config
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Auth, error handling
│   │   ├── models/          # Sequelize models
│   │   └── routes/          # Express routers
│   ├── .env.example         # Environment variable template
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios API client
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Page-level components
│   │   └── store/           # Auth context
│   ├── nginx.conf           # Nginx config (used in Docker)
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Environment Variables

All backend configuration lives in `backend/.env`.

| Variable      | Default                                         | Description                          |
| ------------- | ----------------------------------------------- | ------------------------------------ |
| `DB_HOST`     | `db`                                            | Postgres service name (Docker DNS)   |
| `DB_PORT`     | `5432`                                          | Postgres port                        |
| `DB_NAME`     | `trellodb`                                      | Database name                        |
| `DB_USER`     | `postgres`                                      | Database user                        |
| `DB_PASSWORD` | `postgres123`                                   | Database password — **change this!** |
| `PORT`        | `5000`                                          | Backend HTTP port                    |
| `NODE_ENV`    | `production`                                    | Node environment                     |
| `JWT_SECRET`  | `your-very-secret-jwt-key-change-in-production` | JWT signing secret — **change this!**|
| `CORS_ORIGIN` | `http://localhost:3000`                         | Allowed CORS origin                  |

---

## Development Workflow

### Watch logs from all services

```bash
docker compose logs -f
```

### Watch logs from a specific service

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

### Rebuild a single service after code changes

```bash
docker compose up --build backend
```

### Open a shell inside a running container

```bash
docker compose exec backend sh
docker compose exec db psql -U postgres -d trellodb
```

---

## Stopping & Cleanup

| Command                         | Effect                                               |
| ------------------------------- | ---------------------------------------------------- |
| `docker compose stop`           | Stop containers, preserve data volume                |
| `docker compose down`           | Stop and remove containers, preserve data volume     |
| `docker compose down -v`        | Stop, remove containers **and** the data volume      |
| `docker compose down --rmi all` | Also remove built images (full clean)                |

### Full reset (start from zero)

```bash
docker compose down -v
docker compose up --build
```

---

## API Health Check

The backend exposes a health endpoint used by Docker's internal healthcheck:

```
GET http://localhost:5000/api/health
→ 200 { "status": "ok" }
```

---

## Production Deployment

The Trello service is deployed as part of the main `docker-compose.prod.yml` stack and served at `https://trello.hireaptitude.co.uk`.

### Required Environment Variables

Add these variables to `main_project/.env.prod` before running the production stack:

| Variable | Example value | Description |
|---|---|---|
| `TRELLO_DB_NAME` | `trello_db` | Name of the Trello PostgreSQL database (must be created first — see below) |
| `TRELLO_JWT_SECRET` | *(strong random string)* | Secret key used to sign JWT authentication tokens |

The following variables are **already defined** in `.env.prod` and are reused by the `trello-backend` service:

| Variable | Notes |
|---|---|
| `POSTGRES_USERNAME` | Mapped to `DB_USER` inside the container |
| `POSTGRES_PASSWORD` | Mapped to `DB_PASSWORD` inside the container |

The backend resolves the variables as follows (see `src/config/database.js` and `src/index.js`):

| Container env var | Source in `.env.prod` |
|---|---|
| `DB_HOST` | hardcoded as `postgres` (Docker service name) |
| `DB_PORT` | hardcoded as `5432` |
| `DB_NAME` | `${TRELLO_DB_NAME}` |
| `DB_USER` | `${POSTGRES_USERNAME}` |
| `DB_PASSWORD` | `${POSTGRES_PASSWORD}` |
| `JWT_SECRET` | `${TRELLO_JWT_SECRET}` |
| `CORS_ORIGIN` | hardcoded as `https://trello.hireaptitude.co.uk` |
| `NODE_ENV` | hardcoded as `production` |
| `PORT` | hardcoded as `5000` |

---

## License

MIT
