# Vercel Deployment Guide (Fastify + Prisma + Supabase)

Your backend is now ready for Vercel! Follow these steps to complete the deployment.

## 1. Supabase Storage Setup (Critical)
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **Storage** -> **Create New Bucket**.
3. Name it **`assets`**.
4. Set it to **Public** (so the URLs can be shared).
5. (Optional) Set up **Policies** if you want restricted access, but "Public" is recommended for portfolio assets.

## 2. Prepare Environment Variables
When you import your project into Vercel, copy these keys from your local `.env`:

| Key | Value |
| :--- | :--- |
| `DB_TYPE` | `supabase` |
| `SUPABASE_URL` | Your Project URL |
| `SUPABASE_ANON_KEY` | Your anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Service Role key (needed for storage) |
| `SUPABASE_DATABASE_URL` | Your Transaction Pooler URL (Port 6543) |
| `SUPABASE_DIRECT_URL` | Your Direct/Session URL (Port 5432) |
| `JWT_SECRET` | Your secret |
| `GEMINI_API_KEY` | Your key |

## 3. Deploy
1. Push your code to GitHub.
2. In Vercel, click **"Add New"** -> **Project**.
3. Import your `F.L.O-Backend` repo.
4. **Environment Variables**: Add all the keys listed above.
5. **Deploy**: Vercel will run `npm run vercel-build` which generates the Prisma Client automatically.

---

## 🛠️ Local Server Still Works
You can still run your project locally. If you set `DB_TYPE=local`, it will use your local Postgres and the local `uploads/` folder. Setting `DB_TYPE=supabase` will use the cloud database and cloud storage even on your local machine!
