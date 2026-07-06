# Deployment Guide

## Architecture Overview

The production deployment uses a single Windows server in the barangay office running:

- **PocketBase** — Backend server (Go binary, no runtime dependencies)
- **cloudflared** — Cloudflare Tunnel client (secure public access)
- **Litestream** (optional) — Database backup to Cloudflare R2

```
                         +------------------------------+
                         |       Cloudflare Network      |
                         |  CDN - WAF - DDoS Protection  |
                         +------+-----------------------+
                                |
                     +----------+----------+
                     |  cloudflared tunnel  |
                     +----------+----------+
                                |
                     +----------+----------+
                     |   localhost:8090     |
                     |   PocketBase         |
                     |   +-- pb_data/       |
                     |   |   +-- data.db <--+-- Litestream --> Cloudflare R2
                     |   +-- pb_public/     |
                     |       +-- index.html |
                     +---------------------+

LAN Users: http://192.168.x.x:8090 (direct, low latency, works offline)
Remote:    https://app.yourdomain.com (via Cloudflare Tunnel, HTTPS)
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
| [PocketBase](https://pocketbase.io) | Backend server |
| [Node.js](https://nodejs.org) 20+ | Building the frontend |
| [Git](https://git-scm.com) | Pulling code updates |
| [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/) | Cloudflare Tunnel client |
| [Litestream](https://github.com/benbjohnson/litestream/releases) (optional) | Database backup |

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
    service: http://localhost:8090
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

Visit `https://records.barangay.gov.ph/_/` — you should see the PocketBase admin login.

---

## Step 2: PocketBase Setup

### 2a. Get PocketBase

Download PocketBase for Windows from [pocketbase.io](https://pocketbase.io) and place `pocketbase.exe` in the project root.

> **Important:** `pocketbase.exe` is gitignored. Every deployment downloads its own copy.

### 2b. Run as Windows Service

Use **WinSW** (Windows Service Wrapper) so PocketBase starts on boot and can be managed with standard service commands.

1. Download `WinSW-x64.exe` from [WinSW releases](https://github.com/winsw/winsw/releases)
2. Rename to `pocketbase-service.exe` and place in the project root
3. The `pocketbase-service.xml` is already in the project root with this content:

```xml
<service>
  <id>PocketBase</id>
  <name>PocketBase</name>
  <description>PocketBase backend for BarangayOS</description>
  <executable>D:\BARANGAYCC\barangay-system\pocketbase.exe</executable>
  <arguments>serve --http=localhost:8090 --dir="D:\BARANGAYCC\barangay-system\pb_data" --migrationsDir="D:\BARANGAYCC\barangay-system\pocketbase\pb_migrations"</arguments>
  <startmode>Automatic</startmode>
  <stoptimeout>15 sec</stoptimeout>
  <logpath>D:\BARANGAYCC\barangay-system\logs</logpath>
  <logmode>rotate</logmode>
</service>
```

4. Install and start:

```powershell
pocketbase-service.exe install
pocketbase-service.exe start
```

### 2c. Verify PocketBase

```powershell
Get-Service PocketBase
# Should show: Running

curl.exe http://localhost:8090/api/health
# Should return: {"message":"API is healthy.","code":200,"data":{}}
```

### 2d. Set up admin

1. Go to `http://localhost:8090/_/` or `https://records.barangay.gov.ph/_/`
2. Create the initial admin account
3. Create user accounts in the **Users** collection (admins are separate from app users)

---

## Step 3: Environment Configuration

Create `.env.production` in the project root:

```env
VITE_API_URL=https://records.barangay.gov.ph
VITE_LOCAL_API_URL=http://192.168.1.100:8090
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

Replace `192.168.1.100` with the server's actual static LAN IP.

> **Important:** This file is gitignored. It stays on the server and never gets pushed to GitHub.

### How local detection works

The code in `src/lib/apiConfig.ts` handles this automatically in production builds:

1. The app tries to fetch `{LOCAL_API_URL}/api/health` with a 3-second timeout
2. If reachable -> uses local URL (zero latency, works offline)
3. If unreachable -> falls back to the tunnel URL (remote access)

The `VITE_LOCAL_API_URL` env var triggers this logic. If it's empty (like in dev mode), the app just uses `VITE_API_URL` directly.

---

## Step 4: Build & Deploy Frontend

### Manual deploy

```powershell
# Build for production
npm run build -- --mode production

# Copy dist to PocketBase's static directory
Copy-Item -Path "dist\*" -Destination "pb_public\" -Recurse -Force

# Restart PocketBase to pick up changes
Restart-Service PocketBase
```

**Why this works:** PocketBase automatically serves static files from the `pb_public/` directory at the root URL. The SPA is served alongside the API at the same hostname.

Or use the deploy script:

```powershell
.\scripts\deploy.ps1 production
```

### Verify

Visit `https://records.barangay.gov.ph/` — you should see the app login page.

---

## Step 5: Auto-Deploy via GitHub Actions

### 5a. Create a GitHub repository

1. Go to [GitHub](https://github.com/new)
2. Create a repository (e.g., `barangayos`)

### 5b. Initialize Git and push

```powershell
cd D:\BARANGAYCC\barangay-system
git init
git add .
git commit -m "Initial commit"
git branch -m main
git remote add origin https://github.com/YOUR_USER/barangayos.git
git push -u origin main
```

### 5c. Install self-hosted GitHub runner

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

### 5d. How the CI/CD pipeline works

The CI/CD pipeline (`.github/workflows/ci-cd.yml`) runs on every push to any branch and on pull requests to `main`:

| Stage | What it does |
|-------|-------------|
| **Lint** | oxlint code quality check |
| **TypeCheck** | TypeScript compiler check (`tsc -b`) |
| **Test** | Vitest test suite |
| **Build** | Production build via `npm run build` + upload artifact |
| **Security** | `npm audit` for dependency vulnerabilities |

> **Note:** `.env.production` and `pocketbase.exe` are gitignored and stay on the server. The build reads `.env.production` from the local filesystem.

---

## Step 6: Database Backup with Litestream (Optional)

### 6a. Create R2 bucket

1. Cloudflare Dashboard > R2 > Create Bucket
2. Name: `barangay-db-backup`
3. Region: Automatic

### 6b. Create R2 API token

1. R2 > Account Details > Manage API Tokens
2. Create API Token > **Object Read & Write**
3. Scope to bucket `barangay-db-backup`
4. Copy the **Access Key ID** and **Secret Access Key**

### 6c. Edit litestream.yml

```yaml
dbs:
  - path: D:\BARANGAYCC\barangay-system\pb_data\data.db
    replicas:
      - url: s3://barangay-db-backup.r2.cloudflarestorage.com/pocketbase
        access-key-id: <R2_ACCESS_KEY_ID>
        secret-access-key: <R2_SECRET_ACCESS_KEY>
        endpoint: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

Replace `<ACCOUNT_ID>` with your Cloudflare account ID (found in Dashboard > Workers & Pages).

### 6d. Run Litestream

**As a Windows service** (using WinSW):

```powershell
pocketbase-service.exe install Litestream "litestream.exe" "replicate -config litestream.yml"
pocketbase-service.exe start Litestream
```

**As a Linux systemd service:**

```bash
sudo systemctl edit --force --full litestream
```

```ini
[Unit]
Description=Litestream
After=network.target

[Service]
ExecStart=/usr/local/bin/litestream replicate -config /path/to/litestream.yml
Restart=always
User=youruser

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now litestream
```

### 6e. Verify backup

```bash
litestream databases -config litestream.yml
```

### 6f. Restore from backup (disaster recovery)

```bash
# Stop PocketBase first, then:
litestream restore -o pb_data\data.db s3://barangay-db-backup.r2.cloudflarestorage.com/pocketbase
```

Or restore a specific generation:

```bash
litestream restore -o pb_data\data.db --replica s3://<...> --generation <generation-id>
```

---

## Environment Reference

| Env | Build Command | API URL | Local Fallback |
|-----|---------------|---------|----------------|
| Dev | `npm run dev` | `http://localhost:8090` | None (direct only) |
| Prod | `npm run build -- --mode production` | Tunnel URL | LAN IP on same network |

### Adding a staging environment

1. Create `.env.staging`:

```env
VITE_API_URL=https://staging.barangay.yourdomain.com
VITE_LOCAL_API_URL=http://192.168.0.101:8090
```

2. Build with:

```powershell
npm run build -- --mode staging
```

3. Run a second PocketBase instance on a different port:

```powershell
pocketbase.exe serve --http=localhost:8091 --dir=pb_data_staging
```

4. Create a second Cloudflare Tunnel pointing `staging.barangay.yourdomain.com` > `localhost:8091`

---

## Quick Reference

### Deploy manually

```powershell
.\scripts\deploy.ps1 production
```

### Deploy via GitHub

Just push to `main`:

```bash
git add .
git commit -m "feat: add my changes"
git push origin main
```

### Restart PocketBase

```powershell
Restart-Service PocketBase
```

### Check server health

```powershell
curl.exe http://localhost:8090/api/health
# or remotely:
curl.exe https://records.barangay.gov.ph/api/health
```

### View PocketBase logs

```powershell
Get-Content D:\BARANGAYCC\barangay-system\logs\*.log
```

---

## Troubleshooting

### Login shows "Something went wrong"

This is the PocketBase SDK's fallback error. It usually means the app can't reach the server.

**On the same WiFi (desktop):**
- Open DevTools > Network tab > see which URL the POST goes to
- If it's the tunnel URL but you're on LAN, the local IP in `.env.production` might be wrong
- Run `ipconfig` on the server, check the correct IPv4 address, and update `.env.production`

**On the phone (cellular):**
- Make sure you're on HTTPS (the tunnel)
- Hard-refresh the browser (clear cache) after deploying

### Tunnel returns 503

- Check that cloudflared is running: `Get-Service cloudflared`
- Check the tunnel status in the Cloudflare dashboard
- Verify the `config.yml` has the correct tunnel UUID and hostname
- Make sure PocketBase is running on port 8090

### `Restart-Service PocketBase` fails

- PocketBase must be installed as a service via WinSW, not running as a manual process
- Check: `Get-Service PocketBase`
- If stopped: `pocketbase-service.exe start`
- If missing: reinstall with `pocketbase-service.exe install`

### Build succeeds but changes don't appear

- The build copies to `pb_public/` but PocketBase caches static files
- You need to restart PocketBase: `Restart-Service PocketBase`
- Hard-refresh the browser (Ctrl+Shift+R or clear cache)

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
