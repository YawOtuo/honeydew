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
- Neon and deployment credentials must be configured as hosting or GitHub secrets and never committed.
