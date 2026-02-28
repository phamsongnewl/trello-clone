# Trello Clone

A full-stack Trello-inspired project management application built with:

- **Backend:** Node.js · Express · Sequelize · PostgreSQL
- **Frontend:** React 18 · Vite · Material UI · TanStack Query · @hello-pangea/dnd
- **Infrastructure:** Docker · Docker Compose · nginx

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose v2)

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd trello
```

### 2. Configure environment variables

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and update the values — especially `DB_PASSWORD` and `JWT_SECRET`.

### 3. Build and start all services

```bash
docker compose up --build
```

This starts three containers:

| Container        | Service  | Exposed Port |
|------------------|----------|--------------|
| trello_db        | postgres | 5432         |
| trello_backend   | express  | 5000         |
| trello_frontend  | nginx    | 3000         |

### 4. Open the app

Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

The frontend proxies all `/api/*` requests to the backend automatically via nginx.

---

## Useful Commands

| Command                          | Description                        |
|----------------------------------|------------------------------------|
| `docker compose up --build`      | Build images and start services    |
| `docker compose up -d`           | Start services in detached mode    |
| `docker compose down`            | Stop and remove containers         |
| `docker compose down -v`         | Stop containers and delete volumes |
| `docker compose logs -f backend` | Tail backend logs                  |

---

## Project Structure

```
trello/
├── backend/          # Express REST API
│   ├── src/          # Application source code
│   ├── .env.example  # Environment variable template
│   ├── Dockerfile
│   └── package.json
├── frontend/         # React SPA
│   ├── src/          # Application source code
│   ├── nginx.conf    # nginx reverse-proxy config
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```