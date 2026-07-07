# Deployment Guide

## Architecture Overview

The production deployment uses Docker with two containers on a Windows server in the barangay office:

```
                         ┌──────────────────────────────┐
                         │       Cloudflare Network      │
                         │  CDN - WAF - DDoS Protection  │
                         └──────┬───────────────────────┘
                                │
                     ┌──────────┴──────────┐
                     │  cloudflared tunnel  │
                     └──────────┬──────────┘
                                │
                     ┌──────────┴──────────┐
                     │   nginx (port 8080)  │
                     │   SPA + API proxy    │
                     └──────────┬──────────┘
                                │ /api/*
                     ┌──────────┴──────────┐
                     │ PocketBase (port 8090)│
                     │   pb_data/ (volume)   │
                     └─────────────────────┘

LAN Users: http://192.168.x.x:8080 (through nginx, zero latency)
Remote:    https://app.yourdomain.com (via Cloudflare Tunnel → nginx, HTTPS)
Direct:    http://192.168.x.x:8090 (PocketBase admin UI, LAN only)
```

## Prerequisites

### Accounts

- **Cloudflare** account (free) — manages DNS and tunnel
- **GitHub** account (free) — hosts code and optional auto-deploy

### Server Hardware

- A Windows PC in the barangay office that stays on 24/7
- Router must assign a **static LAN IP** to the server (DHCP reservation)

### Software to Install

| Software | Purpose |
|----------|---------|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Container runtime |
| [Node.js](https://nodejs.org) 20+ | Building the frontend |
| [Git](https://git-scm.com) | Pulling code updates |
| [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) | Cloudflare Tunnel client |

---

## Step 1: Cloudflare Tunnel Setup

### 1a. Add your domain to Cloudflare

1. Add your domain (e.g., `barangay.gov.ph`) to Cloudflare
2. Update the nameservers to Cloudflare's

### 1b. Create a DNS subdomain

Choose a subdomain (e.g., `records.barangay.gov.ph`). The tunnel will route traffic from this subdomain to your server.

### 1c. Install cloudflared

**Windows:**

```powershell
# Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
# Extract cloudflared.exe to C:\Program Files (x86)\cloudflared\cloudflared.exe
```

**Linux:**

```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared
```

### 1d. Authenticate

```bash
cloudflared tunnel login
```

Opens a browser — log in to Cloudflare and authorize your domain.

### 1e. Create the tunnel

```bash
cloudflared tunnel create barangayos
```

Save the **tunnel UUID** and **credentials file path** printed by this command.

### 1f. Configure ingress

Create `config.yml` in the cloudflared config directory:

**Windows:** `C:\ProgramData\cloudflared\config.yml`
**Linux:** `~/.cloudflared/config.yml`

```yaml
tunnel: <TUNNEL_UUID>
credentials-file: /path/to/<TUNNEL_UUID>.json
ingress:
  - hostname: records.barangay.gov.ph
    service: http://localhost:8080
  - service: http_status:404
```

### 1g. Route DNS

```bash
cloudflared tunnel route dns barangayos records.barangay.gov.ph
```

### 1h. Install as service

**Windows** (admin PowerShell):

```powershell
cloudflared.exe service install <TUNNEL_TOKEN>
Start-Service cloudflared
```

**Linux:**

```bash
sudo cloudflared service install <TUNNEL_TOKEN>
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

> The tunnel token is found in Cloudflare Dashboard > Zero Trust > Access > Tunnels.

### 1i. Verify

Visit `https://records.barangay.gov.ph/` — you should see the app login page.

---

## Step 2: Docker Deployment

### 2a. Build the frontend

```powershell
cd frontend
npm run build
```

This produces static files in `frontend/dist/`.

### 2b. Set the encryption key

```powershell
$env:PB_ENCRYPTION_KEY = "your-32-char-hex-key"
```

Generate a key with: `openssl rand -hex 16`

### 2c. Start the stack

```powershell
cd backend
docker compose up -d --build
```

This starts:
- **nginx** on port `8080` — serves the SPA and proxies API requests
- **PocketBase** on port `8090` — REST API and admin UI

### 2d. Verify

| URL | What to check |
|-----|---------------|
| http://localhost:8080 | App login page loads |
| http://localhost:8090/_/ | PocketBase admin login |

---

## Step 3: Environment Configuration

Create `frontend/.env.production` (gitignored, stays on server):

```env
VITE_API_URL=https://records.barangay.gov.ph
VITE_LOCAL_API_URL=http://192.168.1.100:8080
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

Replace `192.168.1.100` with the server's actual static LAN IP.

### PB_ENCRYPTION_KEY

This environment variable is read by the PocketBase container at runtime. Set it in the environment before running `docker compose up`:

```powershell
$env:PB_ENCRYPTION_KEY = "your-32-char-hex-key"
```

Or set it permanently in Windows: System Properties > Environment Variables > New.

> **Important:** `.env.production` and the encryption key are gitignored and never pushed to GitHub.

---

## Step 4: Auto-Deploy via GitHub Actions

### 4a. Create a GitHub repository

1. Go to [GitHub](https://github.com/new)
2. Create a repository (e.g., `barangayos`)

### 4b. Initialize Git and push

```powershell
cd D:\BARANGAYCC\barangay-system
git init
git add .
git commit -m "Initial commit"
git branch -m main
git remote add origin https://github.com/YOUR_USER/barangayos.git
git push -u origin main
```

### 4c. Install self-hosted GitHub runner

The runner listens for pushes and runs the deploy script automatically.

1. GitHub repo > **Settings** > **Actions** > **Runners** > **New self-hosted runner**
2. Select **Windows** and follow the setup commands:

```powershell
mkdir C:\actions-runner; cd C:\actions-runner
# Download the runner package (use URL from GitHub)
Invoke-WebRequest -Uri https://github.com/actions/runner/releases/download/... -OutFile actions-runner-win-x64-*.zip
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory("$PWD/actions-runner-win-x64-*.zip", "$PWD")
# Configure
.\config.cmd --url https://github.com/YOUR_USER/barangayos --token YOUR_TOKEN
# Install as service
.\run.cmd --startuptype windows_service
```

### 4d. How the CI/CD pipeline works

The CI/CD pipeline (`.github/workflows/ci-cd.yml`) runs on every push to any branch and on pull requests to `main`:

| Stage | What it does |
|-------|-------------|
| **Lint** | oxlint code quality check |
| **TypeCheck** | TypeScript compiler check (`tsc -b`) |
| **Test** | Vitest test suite |
| **Build** | Production build via `npm run build` + upload artifact |
| **Security** | `npm audit` for dependency vulnerabilities |

> **Note:** `.env.production` and the encryption key stay on the server. The build reads `.env.production` from the local filesystem.

---

## Step 5: Database Backup

Backups are configured directly through the PocketBase Admin UI — no separate backup tool needed.

### 5a. Configure backups

1. Visit `http://localhost:8090/_/` and log in as admin
2. Go to **Settings** → **Backups**
3. Enable **Automatic backups**
4. Set interval to **5 minutes**

### 5b. Configure S3-compatible storage

Use Cloudflare R2 (or any S3-compatible provider):

| Setting | Value |
|---------|-------|
| **Bucket** | `barangay-db-backup` |
| **Endpoint** | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| **Region** | `auto` |
| **Access Key ID** | Your R2 API token access key |
| **Secret Access Key** | Your R2 API token secret key |

To get R2 credentials:
1. Cloudflare Dashboard > R2 > Create Bucket (name: `barangay-db-backup`)
2. R2 > Account Details > Manage API Tokens
3. Create API Token > **Object Read & Write**
4. Scope to bucket `barangay-db-backup`
5. Copy the **Access Key ID** and **Secret Access Key**

### 5c. Verify

Wait for the first backup cycle (up to 5 minutes), then check the R2 bucket in Cloudflare Dashboard to confirm backup files appear.

---

## Troubleshooting

### View container logs

```powershell
# All containers
docker compose logs

# Specific service
docker compose logs nginx
docker compose logs pocketbase

# Follow logs in real-time
docker compose logs -f
```

### Restart a container

```powershell
docker compose restart nginx
docker compose restart pocketbase
docker compose restart  # restart all
```

### Rebuild and restart

```powershell
docker compose up -d --build
```

### Check container status

```powershell
docker compose ps
```

### Login shows "Something went wrong"

- Open DevTools > Network tab > see which URL the POST goes to
- If it's the tunnel URL but you're on LAN, the local IP in `.env.production` might be wrong
- Run `ipconfig` on the server, check the correct IPv4 address, and update `.env.production`

### Tunnel returns 503

- Check that cloudflared is running: `Get-Service cloudflared`
- Check the tunnel status in the Cloudflare dashboard
- Verify the `config.yml` has the correct tunnel UUID and hostname, pointing to `localhost:8080`
- Make sure the Docker containers are running: `docker compose ps`

### Build succeeds but changes don't appear

- Hard-refresh the browser (Ctrl+Shift+R or clear cache)
- Verify the new container image was built: `docker compose up -d --build`

---

## Quick Reference

### Build and deploy

```powershell
cd frontend && npm run build
cd backend
$env:PB_ENCRYPTION_KEY = "your-32-char-hex-key"
docker compose up -d --build
```

### Deploy via GitHub

Just push to `main`:

```bash
git add .
git commit -m "feat: add my changes"
git push origin main
```

### Check server health

```powershell
curl.exe http://localhost:8080/api/health
# or remotely:
curl.exe https://records.barangay.gov.ph/api/health
```

### View logs

```powershell
docker compose logs -f
```

### Restart services

```powershell
docker compose restart
```

---

## Verify the build pipeline

Before deploying, always verify:

```bash
npm run lint
npx tsc -b
npm run test
npm run build
```

All four should pass cleanly.
