# AWS Lightsail Deployment Guide (Docker Compose)

This guide walks you through deploying the server using **Docker Compose** on an AWS Lightsail instance.

## Prerequisites

1.  **Local Machine**: Docker installed and running.
2.  **Docker Hub**: An account to push your images (e.g., `yourusername`).
3.  **AWS Lightsail**: An active **Ubuntu 22.04** instance ($5/month plan recommended).

---

## Phase 1: Build & Push Image (Local)

Run these commands from the **root** of your monorepo.

1.  **Login to Docker Hub**:
    ```bash
    docker login
    ```

2.  **Build the Image**:
    Replace `yourusername` with your actual Docker Hub username.
    ```bash
    # We use the Dockerfile located in apps/server
    docker build --platform linux/amd64 -f apps/server/Dockerfile -t yourusername/vibepos-server:latest .
    ```

3.  **Push the Image**:
    ```bash
    docker push yourusername/vibepos-server:latest
    ```

    *Take note of the image name (`yourusername/vibepos-server:latest`) for the next step.*

---

## Phase 2: Server Setup (AWS Lightsail)

SSH into your Lightsail instance.

1.  **Install Docker & Compose**:
    ```bash
    # Update and install Docker
    sudo apt-get update
    curl -fsSL https://get.docker.com | sh
    
    # Add your user to docker group
    sudo usermod -aG docker $USER
    newgrp docker
    ```

2.  **Prepare Directory**:
    ```bash
    mkdir -p ~/vibepos
    cd ~/vibepos
    ```

---

## Phase 3: Deploy

1.  **Create `.env` File**:
    Create a file named `.env` with your secrets.
    ```bash
    nano .env
    ```
    
    Paste the following (adjust values):
    ```env
    # The image you pushed in Phase 1
    DOCKER_IMAGE=yourusername/vibepos-server
    
    # Secrets
    JWT_SECRET=super_secret_deployment_key
    DATABASE_URL=postgresql://vibepos:vibepos_password@db:5432/vibepos_db
    
    # Optional DB Settings (if using local DB)
    DB_USER=vibepos
    DB_PASSWORD=vibepos_password
    DB_NAME=vibepos_db
    ```
    *Save: `Ctrl+O`, `Enter`. Exit: `Ctrl+X`.*

2.  **Copy Compose File**:
    You can simply copy the content of `docker-compose.prod.yml` from your repo to a file named `docker-compose.yml` on the server.
    
    ```bash
    nano docker-compose.yml
    ```
    *(Paste the content of `docker-compose.prod.yml` here)*

3.  **Start Services**:
    ```bash
    docker compose up -d
    ```

4.  **Verify**:
    ```bash
    docker compose logs -f
    ```

---

## Phase 4: Initialize Database (First Time Only)

Your database is currently empty (no tables). You need to push the schema and create the admin user.

1.  **Push Schema**:
    ```bash
    # We use absolute path /app/packages/... because WORKDIR is /app/apps/server
    docker compose -f docker-compose.prod.yml run --rm api npx prisma db push --schema=/app/packages/database/prisma/schema.prisma
    ```

2.  **Seed Admin User**:
    ```bash
    docker compose -f docker-compose.prod.yml run --rm api pnpm --filter @vibepos/database prisma db seed
    ```

    *Credentials*: `admin` / `admin123`

---

## Phase 5: Expose & Access

Your Docker container is mapped to **port 80** (`80:3000`), meaning it's ready to receive web traffic. You just need to let the traffic in.

1.  **Open Lightsail Firewall**:
    *   Go to **Lightsail Console** > Select your Instance.
    *   Click the **Networking** tab.
    *   Scroll to **IPv4 Firewall**.
    *   Ensure **HTTP (TCP 80)** and **HTTPS (TCP 443)** are allowed. (Add rule if missing).

2.  **Attach Static IP** (Highly Recommended):
    *   Under **Networking**, click **Create static IP**.
    *   Attach it to your instance. This gives you a permanent address (e.g., `54.x.x.x`).

3.  **Access It**:
    *   Open your browser and visit: `http://<YOUR_STATIC_IP>`
    *   You should see your API response (e.g., `Hello World` or 404 from NestJS).
    *   Health check: `http://<YOUR_STATIC_IP>/api/health`

---

## Phase 6: Automatic SSL (HTTPS) setup

We use **Caddy** to automatically handle SSL certificates.

### 1. Requirements
- A **Domain Name** (e.g., `vibepos.com`, `api.vibepos.com`).
- Access to your Domain's DNS settings (Godaddy, Namecheap, Route53, etc.).

### 2. Configure DNS
1.  Log in to your Domain Registrar.
2.  Add an **A Record**:
    -   **Host**: `api` (or `@` for root domain).
    -   **Value**: Your Lightsail Static IP (e.g., `52.76.154.220`).
    -   **TTL**: Lowest possible (e.g., 1 min or 5 min).

### 3. Configure Server
1.  **Edit Caddyfile**:
    On your server, edit the `Caddyfile` to match your domain.
    ```bash
    nano Caddyfile
    ```
    ```caddyfile
    # Change this line!
    api.yourdomain.com {
        reverse_proxy api:3000
    }
    ```

2.  **Restart**:
    ```bash
    docker compose up -d --force-recreate
    ```
    Caddy will automatically fetch a certificate from Let's Encrypt.

3.  **Update Frontend**:
    Update your AWS Amplify environment variable `VITE_API_URL` to `https://api.yourdomain.com`.
