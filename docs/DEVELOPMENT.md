# Development Guide

## Prerequisites

- **Node.js** 20+ (required for Vite 8)
- **npm** 10+
- **PocketBase** binary (download from [pocketbase.io](https://pocketbase.io))
- **Git**

## Initial Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USER/barangayos.git
cd barangayos

# Install JavaScript dependencies
cd frontend && npm install

# Set up environment variables
cp .env.local.example frontend/.env.local
```

The default `frontend/.env.local` should look like:

```env
VITE_API_URL=http://localhost:8090
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

## Running Locally

### Terminal 1: Start PocketBase

```bash
# From the project root
.\backend\pocketbase-service.exe serve --http=127.0.0.1:8090 --dir=pb_data --migrationsDir=backend/pb_migrations
```

This starts PocketBase on port 8090 with:
- SQLite database in `pb_data/`
- All schema migrations applied automatically
- Admin UI at `http://127.0.0.1:8090/_/`
- REST API at `http://127.0.0.1:8090/api/`

### Terminal 2: Start Vite dev server

```bash
cd frontend && npm run dev
```

The Vite dev server runs on port **8080** and the app is available at `http://localhost:8080`.

### Setting up the admin account

1. Visit `http://localhost:8090/_/`
2. Create the initial admin account
3. Create user accounts in the **Users** collection with appropriate roles (admin/staff/viewer)

## Running with Docker (Production simulation)

```bash
# From the project root
cd frontend && npm run build
cd backend

# Set encryption key (generate with: openssl rand -hex 16)
$env:PB_ENCRYPTION_KEY = "your-32-char-key-here"

# Start the stack
docker compose up -d --build

# Frontend: http://localhost:8080
# PocketBase admin: http://localhost:8090/_/
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server on port 8080 |
| `npm run build` | TypeScript check + production build to `frontend/dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run test` | Run all tests once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Run oxlint on the codebase |

## Project Structure

```
frontend/
  src/               React app source code
    api/             API client modules (one per collection)
    auth/            Authentication and authorization
    components/      Shared UI components
    features/        Domain feature modules
    lib/             Shared utilities
    offline/         Offline support
    pages/           Page-level components
    routes/          Route definitions
  nginx.conf         Nginx config for production container
  Dockerfile         Multi-stage Docker build
backend/
  pb_migrations/     Database schema + RBAC migrations
  Dockerfile         Alpine + PocketBase Linux binary
  docker-compose.yml Production stack configuration
  pocketbase-service.exe  Windows binary for local testing
scripts/             Utility scripts
  deploy.ps1         Build frontend
  deploy-prod.ps1    Production deploy from GitHub artifact
docs/                Documentation
```

## Coding Standards

### TypeScript

- Strict mode enabled (`strict: true` in tsconfig)
- `noUnusedLocals` and `noUnusedParameters` are enabled
- Prefer explicit return types on function declarations
- Use `import type` for type-only imports

### React

- Functional components with hooks (no class components)
- Props interfaces defined with `interface`, not `type`
- File naming: PascalCase for components, camelCase for utilities
- One component per file (except small related utilities)

### CSS / Tailwind

- Tailwind CSS v4 with `@import "tailwindcss"` syntax
- Custom theme colors defined in `src/index.css` via `@theme` directive
- Motion utilities (`motion-fade-in`, `motion-slide-up`, etc.) for animations
- Dark mode via `.dark` class on `<html>` element (handled by `ThemeProvider`)

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Files (utilities) | camelCase | `apiConfig.ts`, `utils.ts` |
| Files (components) | PascalCase | `LoginPage.tsx`, `Sidebar.tsx` |
| Functions | camelCase | `getApiUrl()`, `formatDate()` |
| Components | PascalCase | `ThemeProvider`, `ProtectedRoute` |
| Types/Interfaces | PascalCase | `AuthUser`, `HealthStatus` |
| Environment variables | UPPER_SNAKE | `VITE_API_URL`, `VITE_LOCAL_API_URL` |

## Testing

Tests use Vitest with jsdom environment. Test files should be placed alongside the code they test with `.test.ts` or `.test.tsx` extension.

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Writing tests

```typescript
// Example: src/lib/__tests__/utils.test.ts
describe('formatDate', () => {
  it('returns formatted date string', () => {
    expect(formatDate('2024-01-15 10:00:00')).toContain('Jan')
  })
})
```

> Note: Vitest is configured with `globals: true` — `describe`, `it`, `expect` are globally available without imports.

## Linting

```bash
npm run lint
```

Uses oxlint with React and TypeScript plugins. Configuration is in `.oxlintrc.json`.

## Building for Production

```bash
# Build frontend
cd frontend && npm run build

# Deploy with Docker
cd backend && docker compose up -d --build
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for full deployment instructions.
