# aquarium-app

A web app for fishkeepers. You log your tanks, water tests, maintenance and photos in one
place, and see how things change over time.

I keep a freshwater tank myself. My records were split between a notebook, my phone's notes and its photo
gallery, and I could not see measurements, maintenance and photos together over time. This project is my attempt to fix
that, and a way to build a full web app from database to deploy.

The interface is in English and Brazilian Portuguese.

## Status

Phase 1 is built: accounts, tanks, measurements with charts, a maintenance log, tank photos and a demo
tank. The next step is putting it online. There is no public instance yet.

## Plan

The project grows in phases. Each one should be usable on its own.

1. **Tank manager**: accounts, tanks, measurements (temperature, pH, GH/KH, ammonia, nitrite, nitrate
   and more), charts, maintenance log, tank photos, and a public demo tank you can open without an
   account.
2. **Library and rules**: species, plants and materials, plus deterministic checks for parameter
   ranges, compatibility and stocking. A public checker that needs no login.
3. **Biotope mode**: pick a river or lake on a map and see which species live there, the water
   parameters, plants and substrate.
4. **Assistant**: the rules decide, a language model explains, and every answer cites its source. If
   there is no source, it says it does not know.
5. **Simple 3D planner**: lay out a tank in low-poly 3D, checked against the library and the rules.

Focus on freshwater. The reasons are in [ADR 0001](docs/adr/0001-freshwater-only.md).

## Stack

- **Backend**: Java 21, Spring Boot 4, a modular monolith. PostgreSQL with Flyway migrations.
- **Frontend**: React, TypeScript, Vite, Tailwind, i18next.
- **Pipeline**: Python, offline only (data ingestion and preparation). Nothing in `pipeline/` runs in
  production.
- **Tests**: JUnit 5 with Testcontainers against a real PostgreSQL, Vitest, Playwright.

## Repository layout

```
backend/    Spring Boot API
frontend/   React single-page app
pipeline/   offline data work in Python
deploy/     Docker Compose file and settings template for the server
docs/adr/   architecture decision records
GLOSSARY.md the words this project uses, and what they mean
```

## Running it locally

You need JDK 21, Node 22.12 or newer, and Docker.

Backend, with a throwaway PostgreSQL started by Testcontainers:

```bash
cd backend
./mvnw spring-boot:test-run
```

Or start the database with Docker Compose and run the app against it:

```bash
docker compose up -d
cd backend
./mvnw spring-boot:run
```

Frontend (calls to `/api` go to the backend on port 8080):

```bash
cd frontend
npm install
npm run dev
```

## Tests

```bash
cd backend && ./mvnw test
cd frontend && npm test
cd frontend && npx playwright install chromium && npm run test:e2e
```

The backend tests start the whole app on a random port with a real PostgreSQL. Only the clock and the
email sender are replaced, so time-based behaviour can be tested without waiting.

## Data and credits

Later phases will use data from FishBase, which is licensed CC BY-NC. Because of that, the site will
stay free and without ads, and the credits page in the app lists every source.
