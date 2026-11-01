# Build stage: turns the React app into static files.
FROM node:24 AS build
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Run stage: Caddy serves those files, sends /api to the backend and gets the HTTPS certificate by itself.
FROM caddy:2
COPY --from=build /build/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
