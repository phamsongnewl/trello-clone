# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

COPY . .

RUN npm run build

# ── Stage 2: Serve ──────────────────────────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the parameterised template (not a final config yet)
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

# Defaults – override with env vars at `docker run` or in docker-compose
ENV BACKEND_HOST=backend
ENV BACKEND_PORT=5000

EXPOSE 80

# Substitute only our two custom variables so nginx's own $uri/$host/etc. are
# left untouched, then start nginx normally.
CMD ["/bin/sh", "-c", \
  "envsubst '${BACKEND_HOST} ${BACKEND_PORT}' \
    < /etc/nginx/conf.d/default.conf.template \
    > /etc/nginx/conf.d/default.conf \
  && nginx -g 'daemon off;'"]