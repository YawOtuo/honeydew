# Honeydew

Honeydew is a Ghanaian school income and expense tracker. It is a monorepo with an Expo Android app and a NestJS/PostgreSQL backend.

## Repository

- `app/` - Expo mobile application
- `backend/` - NestJS API and Prisma database layer
- `PLAN.md` - product and implementation requirements

## Local Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Set DATABASE_URL, JWT_SECRET, and the seed admin values in .env
npx prisma migrate dev
npm run prisma:seed
npm run start:dev
```

The API runs at `http://localhost:3000/api`. Health check: `GET /api/health`. Swagger documentation is available at `http://localhost:3000/api/docs`.

### Mobile app

```bash
cd app
npm install
npx expo start
```

For the Android emulator, the default API URL is `http://10.0.2.2:3000/api`. For a physical device, set `EXPO_PUBLIC_API_URL` to the backend URL reachable from that device.

## Checks

```bash
cd backend && npm run typecheck && npm run build
cd app && npm run typecheck && npx expo-doctor
```

## Deployment

- Backend deploys from `backend/` to Heroku. The Heroku release phase runs `prisma migrate deploy`.
- Mobile builds run through EAS from `app/`.
- The backend deployment workflow syncs its runtime config from the GitHub `production` environment before deploying.
- Configure `HEROKU_APP_NAME` and `APP_TIMEZONE` as GitHub environment variables.
- Configure `HEROKU_API_KEY`, `HEROKU_EMAIL`, `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SEED_ADMIN_EMAIL`, and `SEED_ADMIN_PASSWORD` as GitHub environment secrets.
- Neon and deployment credentials must never be committed.

### Make commands

Build a local-installable Android APK through EAS:

```bash
make apk-build
```

Run pending Prisma migrations on Heroku:

```bash
make heroku-migrate
```

The EAS command requires an authenticated EAS CLI session or `EXPO_TOKEN`. The Heroku command requires the Heroku CLI and an authenticated session or `HEROKU_API_KEY`.
