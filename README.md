# Makeup System

## Prisma with Supabase

1. Copy `.env.example` to `.env` and replace the placeholders with the pooled
   and direct connection strings from your Supabase project's database settings.
2. Install dependencies with `npm install`.
3. Generate the Prisma Client with `npm run prisma:generate`.
4. After adding models to `prisma/schema.prisma`, create and apply a development
   migration with `npm run db:migrate`.

Use `npm run db:deploy` to apply committed migrations in a deployed environment,
and `npm run db:studio` to open Prisma Studio. The application connects through
`DATABASE_URL`; Prisma CLI database operations use `DIRECT_URL`.