# Lightsail Deployment Troubleshooting Log

This document records the specific issues encountered during the initial Docker deployment to AWS Lightsail and the solutions applied. Use this as a reference if similar issues arise.

## 1. Monorepo Dependency Build Failure
**Error:** `Cannot find module '@vibepos/shared-types'` or `Error: Cannot find module '/app/apps/server/dist/main'`
**Context:** The Docker build initially failed to recognize the shared package or couldn't find the entry point.
**Root Cause:** 
1. The `Dockerfile` was missing the build step for `@vibepos/shared-types`.
2. The `tsconfig.build.json` in `apps/server` was including root `.ts` scripts (like `debug-sales.ts`), causing `tsc` to modify the output structure (nesting execution files in `dist/src` instead of `dist`).

**Fix:**
- Updated `Dockerfile` to explicitly run `pnpm --filter @vibepos/shared-types build`.
- Updated `apps/server/tsconfig.build.json` to `exclude: ["*.ts"]` (root files), ensuring `dist/main.js` is generated at the correct root.

## 2. Architecture Mismatch (Mac vs Linux)
**Error:** `no matching manifest for linux/amd64 in the manifest list entries`
**Context:** The server refused to pull the Docker image.
**Root Cause:** The image was built on an M1/M2 Mac (ARM64) without specifying the target platform, making it incompatible with the Lightsail VPS (AMD64/x86).

**Fix:**
- Updated the **Build Command** to force the platform:
  ```bash
  docker build --platform linux/amd64 -f apps/server/Dockerfile -t yourusername/vibepos-server:latest .
  ```
- *Note:* Do not put `platform: linux/amd64` in `docker-compose.yml` if you want to run it locally on Mac for testing. Use the build flag instead.

## 3. Database Connection String (Invalid Port)
**Error:** `Connect to localhost:5432 failed: Connection refused` or `invalid port number in database URL`
**Context:** The application crashed immediately upon starting.
**Root Cause:**
1. The default password `Password?101` contained a `?`, which broke the Prisma connection string parsing.
2. The app was trying to connect to `localhost` (from the local `.env`), which refers to the *container itself*, not the database container.

**Fix:**
- Changed default password to `Password101` (removed special char).
- Updated `docker-compose.prod.yml` to use a dynamic `DATABASE_URL` that points to the internal service name `db`:
  ```yaml
  environment:
    - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/${DB_NAME}?schema=public
  ```

## 4. Database Not Initialized (Missing Tables)
**Error:** `Invalid prisma.user.findUnique() invocation: The table public.User does not exist`
**Context:** The app started but crashed when trying to login.
**Root Cause:** The PostgreSQL volume was fresh and empty. The schema migration had not been run.

**Fix:**
- Ran `prisma db push` to create tables.
- Ran `prisma db seed` to create the admin user.

## 5. "Service Not Running" during Initialization
**Error:** `service "oragon-kaha-server" is not running` when running `docker compose exec ...`
**Context:** We tried to run the migrations using `exec`, but the server container kept crashing (restarting) because of the missing tables (Catch-22). `exec` requires a running container.

**Fix:**
- Switched to `docker compose run --rm`:
  ```bash
  docker compose run --rm api npx prisma ...
  ```
  This spins up a *new, temporary* container to run the command, bypassing the crash loop of the main service.

## 6. Prisma Schema Path Error
**Error:** `Could not load --schema from provided path packages/database/prisma/schema.prisma: file or directory not found`
**Context:** When running the command above, it failed to find the schema.
**Root Cause:** The `WORKDIR` inside the container is `/app/apps/server`, so relative paths to `packages/` failed.

**Fix:**
- Used the **Absolute Path** in the command:
  ```bash
  --schema=/app/packages/database/prisma/schema.prisma
  ```

---

## Final Valid Deployment Commands

### 1. Build (Local)
```bash
docker build --platform linux/amd64 -f apps/server/Dockerfile -t chrisn0tdev/oragon-kaha-server:latest .
docker push chrisn0tdev/oragon-kaha-server:latest
```

### 2. Deploy (Server)
```bash
# Update images
docker compose pull

# Start services (Server might restart if DB is empty, that's fine)
docker compose up -d
```

### 3. Initialize DB (Only if fresh)
```bash
# Push Schema
docker compose run --rm api npx prisma db push --schema=/app/packages/database/prisma/schema.prisma

# Seed Admin
docker compose run --rm api pnpm --filter @vibepos/database prisma db seed

# Restart API to ensure it reconnects cleanly
docker compose restart api
```

## 7. Login Failure ("Invalid Credentials")
**Error:** `{"message":"Invalid credentials", ...}` (401 Unauthorized)
**Context:** User seed was successful, but logging in with `admin`/`admin123` failed.
**Root Cause:**
1.  **Seed Script**: Used `bcryptjs` to hash the password (`bcrypt.hash(...)`).
2.  **Auth Service**: Used plain text comparison (`user.password === pass`).
This caused the login to fail because the plaintext password didn't match the hash string.

**Fix:**
- Installed `bcryptjs` in `apps/server`.
- Updated `users.service.ts` / `auth.service.ts` to use `await bcrypt.compare(pass, user.password)`.

## 8. Empty Database / Seed Failure (pnpm Interactive Prompt)
**Error:** `PrismaClientKnownRequestError: Table public.User does not exist` (Code: `P2021`) or 0 rows found.
**Context:** This means the Database Schema has not been pushed, OR the seed failed to run.
**Fix 1 (Missing Tables):**
First, create the tables:
```bash
docker compose run --rm api npx prisma db push --schema=/app/packages/database/prisma/schema.prisma
```

**Fix 2 (Seed Failure):**
If tables exist but are empty, bypass pnpm and run `ts-node` directly:
```bash
docker compose -f docker-compose.prod.yml run --rm --entrypoint="" api /app/apps/server/node_modules/.bin/ts-node --compiler-options '{"module":"commonjs"}' /app/packages/database/prisma/seed.ts
```

> **Note on File Paths:**
> You do **not** need `seed.ts` or `ts-node` on your actual server (Host). These files are baked *inside* the Docker image at `/app/...`. The command above executes them from within the container.

## 9. Common Questions

### Q: Do I need to run `prisma generate` on the server?
**A: No.**
`prisma generate` creates the TypeScript client files (node_modules). We do this **inside the Dockerfile** during the build process.
When you pull the image, it already has the generated client.
You only need to run:
1.  `prisma db push` (Updates the SQL table structure).
2.  `prisma db seed` (Inserts data).

### Q: Do I need `schema.prisma` on the server?
**A: No.**
Like the seed file, `schema.prisma` is copied into the Docker image at `/app/packages/database/prisma/schema.prisma`.
That is why our commands use the absolute path `--schema=/app/packages/...`.

## 10. SSL Challenge Failed (Timeout / Firewall)
**Error:** `challenge failed ... 52.x.x.x: Timeout during connect (likely firewall problem)` in Caddy logs.
**Context:** Caddy tries to get a certificate from Let's Encrypt but the ACME server cannot reach your server to verify ownership.
**Root Cause:** AWS Lightsail Firewall blocks port 80/443 by default.
**Fix:**
-   Go to Lightsail Console > Networking > IPv4 Firewall.
-   Allow **HTTP (TCP 80)**.
-   Allow **HTTPS (TCP 443)**.
-   Restart Caddy: `docker compose restart caddy`.

## 11. "Mixed Content" Error
**Error:** `... was loaded over HTTPS, but requested an insecure resource 'http://ec2-...'`
**Context:** Frontend (Amplify) is HTTPS, but Backend is HTTP. Browsers block this security risk.
**Root Cause:** You cannot "downgrade" frontend security. You must "upgrade" backend to HTTPS.
**Fix:**
-   Set up **Caddy** (as per Phase 6 in Deployment Guide).
-   Use a Custom Domain (A Record) pointing to the IP.
-   Update Frontend `VITE_API_URL` to `https://api.yourdomain.com`.

## 12. CORS Error (Blocked by Policy)
**Error:** `Access to fetch ... has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header`
**Context:** Frontend tries to login, but Backend rejects it.
**Root Cause:** The NestJS server (`main.ts`) only allows `localhost`. It does not trust your Amplify domain.
**Fix:**
-   Update `apps/server/src/main.ts` to include your production domains:
    ```typescript
    app.enableCors({
      origin: [
        'https://your-amplify-app.amplifyapp.com', // Your Frontend
        'https://api.yourdomain.com',               // Your Backend
        /\.amplifyapp\.com$/                        // Regex for preview apps
      ],
      credentials: true,
    });
    ```
-   **Rebuild and Redeploy** the server image.

## 13. DNS Error: "Redirect" vs "A Record"
**Error:** Browser redirects to an insecure IP or connection fails even with domain.
**Context:** You added a "URL Redirect Record" in Namecheap/GoDaddy instead of an "A Record".
**Fix:**
-   **DELETE** the "URL Redirect Record".
-   **ADD** an **"A Record"**:
    -   **Host:** `api`
    -   **Value:** `52.x.x.x` (Your Server IP)
    -   **TTL:** Automatic
