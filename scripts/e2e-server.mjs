import { spawn } from 'child_process'
import { existsSync, mkdtempSync, rmSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { tmpdir } from 'os'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const isWin = process.platform === 'win32'

async function waitForURL(url, timeoutMs = 30000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) })
      if (res.ok || res.status < 500) return
    } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`Timed out waiting for ${url}`)
}

async function main() {
  const tempDir = mkdtempSync(join(tmpdir(), 'pb-e2e-'))
  console.log(`[e2e-server] PocketBase data: ${tempDir}`)

  const pbBin = isWin ? 'pocketbase.exe' : 'pocketbase'
  const pbCandidates = [join(root, pbBin), join(root, 'pocketbase', pbBin)]
  const pbPath = pbCandidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile())
  if (!pbPath) {
    console.error(`[e2e-server] PocketBase binary not found. Checked: ${pbCandidates.join(', ')}`)
    console.error('Download it from https://github.com/pocketbase/pocketbase/releases/tag/v0.39.5')
    process.exit(1)
  }

  const migrationsDir = join(root, 'pocketbase/pb_migrations')
  const pbArgs = ['serve', `--http=127.0.0.1:8090`, `--dir=${tempDir}`, `--migrationsDir=${migrationsDir}`]

  console.log(`[e2e-server] Starting PocketBase...`)
  const pb = spawn(pbPath, pbArgs, { cwd: root, stdio: 'inherit', shell: isWin })

  const cleanup = () => {
    console.log('[e2e-server] Cleaning up...')
    pb.kill()
    try { rmSync(tempDir, { recursive: true, force: true }) } catch {}
  }
  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)

  try {
    await waitForURL('http://127.0.0.1:8090/api/')
    console.log('[e2e-server] PocketBase ready')

    const adminEmail = process.env.E2E_ADMIN_EMAIL || 'admin@e2e.local'
    const adminPass = process.env.E2E_ADMIN_PASSWORD || 'E2eAdmin123!'

    const adminRes = await fetch('http://127.0.0.1:8090/api/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: adminPass, passwordConfirm: adminPass }),
    })
    if (!adminRes.ok && adminRes.status !== 400) {
      const text = await adminRes.text()
      console.error(`[e2e-server] Failed to create admin: ${text}`)
    } else {
      console.log('[e2e-server] Admin user created')
    }

    const testUserEmail = process.env.E2E_USER_EMAIL || 'test@barangay.gov.ph'
    const testUserPass = process.env.E2E_USER_PASSWORD || 'Test1234!'

    const loginRes = await fetch('http://127.0.0.1:8090/api/admins/auth-with-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: adminEmail, password: adminPass }),
    })
    const { token } = await loginRes.json()

    const userRes = await fetch('http://127.0.0.1:8090/api/collections/users/records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Admin ${token}`,
      },
      body: JSON.stringify({
        email: testUserEmail,
        password: testUserPass,
        passwordConfirm: testUserPass,
        name: 'Test User',
        role: 'admin',
      }),
    })
    if (!userRes.ok && userRes.status !== 400) {
      const text = await userRes.text()
      console.error(`[e2e-server] Failed to create test user: ${text}`)
    } else {
      console.log('[e2e-server] Test user created')
    }

    console.log('[e2e-server] Starting Vite dev server...')
    spawn('npx', ['vite', '--host'], {
      cwd: root,
      stdio: 'inherit',
      shell: isWin,
      env: { ...process.env, VITE_API_URL: 'http://127.0.0.1:8090' },
    })

    await waitForURL('http://localhost:8080')
    console.log('[e2e-server] Vite ready')

    await new Promise(() => {})
  } catch (err) {
    console.error('[e2e-server] Error:', err)
    cleanup()
    process.exit(1)
  }
}

main()
