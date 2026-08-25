# Honeydew - Detailed Project Plan

Honeydew is a mobile income and expense tracking app for one school in Ghana. The school owner and accountant use it to record, review, and report on school finances. The app requires an internet connection and displays amounts in Ghanaian cedis.

## 1. Product Scope

### V1 goals

- Give the school owner and accountant one reliable place to record income and expenses.
- Show a quick financial summary on the first screen of the mobile app.
- Provide in-app reports for reviewing transactions and totals.
- Restrict sensitive actions to the school owner.
- Keep a complete audit history of important actions.

### Explicitly out of scope for v1

- Multiple schools or branches.
- Offline support.
- Password reset or self-service account recovery.
- Receipt or file attachments.
- PDF, CSV, or Excel exports.
- Multiple currencies.
- User self-registration.
- User deactivation.

## 2. Locked Decisions

| Area | Decision |
| --- | --- |
| Users | School owner and accountant |
| Roles | `ADMIN` and `ACCOUNTANT` only |
| School scope | One school |
| Currency | Ghanaian cedi (`GHS`, displayed as `GH₵`) |
| Timezone | `Africa/Accra` |
| Mobile | React Native with Expo, Android first |
| Backend | NestJS with TypeScript |
| Database | Neon PostgreSQL |
| ORM | Prisma |
| Authentication | Email and password with JWT |
| Account creation | Admin creates users inside the app |
| Password reset | Not available in v1 |
| Categories | Predefined categories maintained by the developer; users cannot create categories |
| Connectivity | Internet required for all app operations |
| Deployment | Backend on Heroku, database on Neon, app through EAS |
| CI/CD | GitHub Actions |

## 3. Roles And Permissions

| Action | Admin | Accountant |
| --- | --- | --- |
| Sign in | Yes | Yes |
| View dashboard | Yes | Yes |
| View all transactions | Yes | Yes |
| Create transactions | Yes | Yes |
| Edit transactions | Yes | No |
| Delete transactions | Yes | No |
| View reports | Yes | Yes |
| View audit history | Yes | No |
| Create users | Yes | No |
| Create or change categories | No in app; developer-managed | No |

The first admin account is created by the developer during setup. After that, an admin can create additional admin or accountant accounts from the user-management screen.

## 4. Transaction Requirements

Every transaction has:

- Type: income or expense.
- Amount: positive decimal value, stored precisely in the database.
- Category: one of the predefined categories.
- Date: interpreted and displayed in `Africa/Accra`.
- Description: optional free text for additional context.
- Invoice number: optional.
- Payment method: optional, with `CASH` as the first supported method.
- Created by: the user who created it.
- Created timestamp.

Amounts accept decimals, for example `1250.50`. Income and expense values are stored as positive amounts; the transaction type determines how they affect balances.

Only admins can edit or delete transactions. A deleted transaction is excluded from normal lists, dashboard totals, and reports, but its deletion remains permanently visible in the audit history.

Categories are predefined and will initially include a `General` option. The remaining income and expense categories will be added by the developer through seed data or a controlled database update.

## 5. Audit Trail

The system records the following events:

- Successful and failed login attempts.
- User creation.
- Transaction creation.
- Transaction edits, including the changed fields and previous values.
- Transaction deletion, including the deleted transaction details.
- Category changes made through developer-controlled operations.

Each audit record includes the acting user where available, event type, affected record, timestamp, and structured event details. Audit records cannot be edited or deleted through the application.

## 6. Data Model

### User

- `id`
- `email` (unique, normalized to lowercase)
- `passwordHash`
- `role` (`ADMIN` or `ACCOUNTANT`)
- `createdAt`

### Category

- `id`
- `name`
- `type` (`INCOME` or `EXPENSE`)
- `color` (optional)
- `createdAt`

Categories should not be hard-deleted because transactions may reference them. Developer-controlled changes should preserve existing historical data.

### Transaction

- `id`
- `type`
- `amount` (`Decimal`)
- `categoryId`
- `description` (optional)
- `invoiceNumber` (optional)
- `paymentMethod` (optional enum, initially `CASH`)
- `transactionDate`
- `createdById`
- `createdAt`
- `updatedAt`
- `deletedAt` (nullable)

### AuditLog

- `id`
- `actorUserId` (nullable for system events)
- `action`
- `entityType`
- `entityId` (nullable)
- `details` (JSON)
- `createdAt`

Add indexes for transaction date, type, category, deleted status, and audit timestamp.

## 7. API Requirements

All endpoints use the `/api` prefix. JWT authentication is required except for login and health checks.

### Authentication and users

```text
POST /api/auth/login
  body: { email, password }
  response: { accessToken, user }

GET  /api/users/me
POST /api/users                 admin only
GET  /api/users                 admin only
```

The create-user endpoint accepts email, temporary password, and role. Passwords are hashed with bcrypt and never returned in API responses.

### Categories

```text
GET /api/categories
```

There is no category-creation screen or public category write endpoint in v1.

### Transactions

```text
GET    /api/transactions?type&categoryId&from&to&page&limit
POST   /api/transactions                         admin, accountant
GET    /api/transactions/:id
PUT    /api/transactions/:id                     admin only
DELETE /api/transactions/:id                     admin only
```

The delete endpoint records an audit event and soft-deletes the transaction so it disappears from ordinary application views while remaining recoverable for audit purposes.

### Reports and dashboard

```text
GET /api/dashboard/summary?from&to
GET /api/reports/summary?from&to
GET /api/reports/monthly?year
GET /api/reports/by-category?from&to
```

Report responses must exclude deleted transactions and return amounts as strings or a clearly documented decimal format to avoid floating-point errors.

## 8. Mobile App

The app uses Expo Router with protected authenticated routes.

### Screens

1. **Login** - email and password form.
2. **Dashboard** - first screen after login; shows summary only, including current-month income, expenses, balance, and recent transactions.
3. **Transactions** - searchable and filterable list, with create form for both roles and edit/delete controls for admins only.
4. **Transaction form** - type, amount, category, date, description, invoice number, and payment method.
5. **Reports** - date filters, totals, monthly income versus expenses, and category breakdowns in-app.
6. **Users** - admin-only user creation screen.
7. **Settings/Profile** - signed-in email, role, and logout.
8. **Audit history** - admin-only chronological audit list.

Every data screen needs loading, empty, error, and retry states. The app must show a clear network error when the backend cannot be reached. Forms must validate values before submission and display backend validation errors.

## 9. Security And Validation

- Hash passwords with bcrypt; never store plaintext passwords.
- Use JWT guards on authenticated endpoints.
- Use role guards for admin-only actions.
- Validate all request bodies with `class-validator`.
- Reject zero, negative, malformed, or excessively precise amounts.
- Normalize email addresses and enforce uniqueness.
- Never trust role or user identifiers supplied by the client.
- Keep JWT and database secrets in environment variables.
- Do not commit real credentials or production data.

## 10. Testing Strategy

### Backend

- Unit tests for authentication, role guards, transaction calculations, validation, and report aggregation.
- Integration tests for login, user creation, transaction creation, admin-only edits/deletes, filters, and audit records.
- Tests confirming deleted transactions are excluded from reports but retained in audit history.

### Mobile

- Login and protected-route tests.
- Transaction form validation tests.
- Permission-based rendering tests.
- Dashboard and report loading/error/empty-state tests.

### Manual acceptance tests

- Admin creates an accountant account.
- Accountant logs in and creates an income and expense transaction.
- Accountant can view reports but cannot edit or delete transactions.
- Admin edits and deletes a transaction.
- Deleted transaction disappears from normal views and reports.
- Audit history shows creation, edit, and deletion details.
- Cedi amounts and Ghana timestamps display correctly.

## 11. Repository Layout

```text
honeydew/
├── PLAN.md
├── README.md
├── .github/workflows/
│   ├── backend-ci.yml
│   ├── backend-deploy.yml
│   └── app-eas.yml
├── backend/
│   ├── prisma/schema.prisma
│   ├── prisma/migrations/
│   ├── prisma/seed.ts
│   └── src/
│       ├── auth/
│       ├── users/
│       ├── categories/
│       ├── transactions/
│       ├── reports/
│       └── audit/
└── app/
    ├── app/
    │   ├── (auth)/login.tsx
    │   └── (tabs)/
    │       ├── index.tsx
    │       ├── transactions.tsx
    │       ├── reports.tsx
    │       └── settings.tsx
    └── src/
        ├── api/
        ├── components/
        └── context/
```

## 12. Environments And Deployment

Required environment variables:

```text
DATABASE_URL
JWT_SECRET
PORT
APP_TIMEZONE=Africa/Accra
```

The backend runs migrations through the Heroku release phase. The production database uses Neon PostgreSQL. EAS produces Android builds for internal distribution. Real secrets remain in Heroku, GitHub Actions, and EAS secret storage rather than the repository.

## 13. Implementation Milestones

### 1. Project scaffold

- Create monorepo, Expo app, NestJS app, shared conventions, and environment examples.
- Add health endpoint and confirm local backend startup.
- Connect Prisma to Neon and run the first migration.

### 2. Database and seed data

- Implement User, Category, Transaction, and AuditLog models.
- Add admin seed flow and initial `General` category.
- Add Ghana currency and timezone handling.

### 3. Authentication and user management

- Implement login, JWT guard, bcrypt password hashing, and role guard.
- Implement admin-only user creation.
- Add mobile login, token persistence, logout, and protected routes.

### 4. Transactions

- Implement category retrieval and transaction CRUD permissions.
- Add filtering, pagination, validation, soft deletion, and audit events.
- Build mobile transaction list and transaction form.

### 5. Dashboard and reports

- Implement dashboard summary and report endpoints.
- Build current-month dashboard cards and recent transactions.
- Build monthly and category reports with date filters.

### 6. Audit history and polish

- Implement admin-only audit history screen.
- Add all loading, empty, error, retry, and permission states.
- Test Android keyboard, date input, network failures, and long lists.

### 7. CI/CD and production deployment

- Add backend lint, test, Prisma generate, and build workflows.
- Deploy backend to Heroku with Neon configuration and release migrations.
- Add EAS Android build workflow for release tags.
- Document local setup, seed process, deployment, and operational procedures.

## 14. Definition Of Done For V1

V1 is complete when an admin can create an accountant, the accountant can record transactions, both users can review accurate summaries and reports, only the admin can edit/delete, and all important actions are auditable. The backend tests, mobile checks, CI workflows, database migrations, and Android internal build must all pass.
