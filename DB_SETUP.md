# F.L.O Database Setup Guide

This project supports both **Local PostgreSQL** and **Supabase (Cloud)** databases. You can switch between them easily using the `DB_TYPE` variable in your `.env` file.

## ⚙️ How to Switch Databases

Open your `.env` file and look for the `DB_TYPE` variable:

### 1. Local Development (Default)
```bash
DB_TYPE=local
LOCAL_DATABASE_URL=postgresql://postgres:password@localhost:5432/flo_db
```

### 2. Supabase Integration
```bash
DB_TYPE=supabase
# Transactional URL (Port 6543) - Used by the server for stability
SUPABASE_DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
# Direct URL (Port 5432) - Used for migrations and db push
SUPABASE_DIRECT_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[REF-ID].supabase.co:5432/postgres
```

---

## 🚀 Running Migrations

Depending on which `DB_TYPE` is active, the following commands will apply to that database:

| Command | Action |
| :--- | :--- |
| `npm run prisma:generate` | Updates the Prisma Client types |
| `npm run prisma:push` | Pushes schema changes directly (Recommended for Supabase dev) |
| `npm run prisma:migrate` | Creates and runs a formal migration |
| `npm run prisma:studio` | Opens a GUI to view/edit your data |

---

## 🛡️ Prisma v7 & Supabase Notes

- **Connection Pooling**: We use Port `6543` for the application to prevent "Too many connections" errors on Supabase's free tier.
- **pgbouncer=true**: This flag is required in the `SUPABASE_DATABASE_URL` to work with the Transaction pooler.
- **Direct Access**: For `prisma db push` or `prisma migrate`, the system will use the connection defined in `prisma.config.ts`. 

> [!TIP]
> If you encounter timeout errors on Supabase during `npm run dev`, verify that your IP address is allowed in the **Supabase Dashboard -> Settings -> Database -> Network Restrictions**.
