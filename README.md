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

## License

MIT