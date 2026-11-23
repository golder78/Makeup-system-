# Makeup System

## Backend setup

1. Install dependencies with `npm install`.
2. Set `DATABASE_URL` (application connection) and `DIRECT_URL` (Prisma CLI
   connection) in `.env`.
3. Generate Prisma Client with `npm run prisma:generate`.
4. Create and apply a development migration with
   `npm run db:migrate -- --name <migration-name>`.

Use `npm run db:deploy` to apply committed migrations in a deployed environment,
and `npm run db:studio` to open Prisma Studio. The app is started with
`npm run dev`.

## Frontend

The dependency-free frontend in `frontend/` is served by the backend. Its
JavaScript is split into `js/app.js` (startup and event wiring), `js/pages.js`
(screen loading and rendering), `js/forms.js` (record forms and submissions),
`js/api.js` (authenticated API requests), and `js/core.js` (shared state and
formatting). Start the app with `npm run dev`, then open
`http://localhost:3000`. Sign in with a user you have created in the database.
The frontend and API share an origin, so authenticated requests use the
existing HTTP-only session cookie.

# Backend progress

## Implemented

The Prisma schema and API currently include:

- **Bookings** (`bookings`): optional client relation, location, price, deposit,
  status, date, and notes.
- **Clients** (`clients`): name, contact, skin type, and bookings.
- **Inventory** (`inventories`): name, brand, quantity, category, and expiry
  date.
- **Income** (`income`): optional booking and client relations, source,
  description, amount, payment method/status, and date.
- **Expenses** (`expenses`): optional inventory relation, category, description,
  amount, payment method, supplier, receipt number, and date.

Each resource has `GET /api/<resource>`, `GET /api/<resource>/:id`,
`POST /api/<resource>`, `PATCH /api/<resource>/:id`, and
`DELETE /api/<resource>/:id` endpoints.

Creation requirements and validation:

- Bookings: accepts the booking fields; status is `pending`, `confirmed`,
  `completed`, or `cancelled`.
- Clients: requires a non-empty name.
- Inventory: requires a non-empty name and non-negative quantity.
- Income: requires source (`booking`, `product_sale`, `tip`, or `other`) and
  non-negative amount.
- Expenses: requires a category (`products`, `rent`, `transport`, `salaries`,
  `marketing`, or `utilities`) and non-negative amount.

# nini ina baki from the database diagram

- Services and booking-services.
- Reports.

# Verification and database status

Prisma schema validation and client generation have been run successfully.
Route validation and JavaScript syntax have been smoke-checked. Database-backed
CRUD has not been verified because the configured database URL was invalid, and
no migration has been confirmed as applied. The `npm test` script is still a
placeholder; an automated API test suite remains to be added.