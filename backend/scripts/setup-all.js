#!/usr/bin/env node
/**
 * Docker MySQL + .env + API + smoke. Run from backend/: npm run setup
 *
 * FRESH_DB=1  — docker compose down -v before up (clean MySQL volume; re-runs schema+seed)
 * SKIP_DOCKER=1 — skip Docker; use existing MySQL + .env
 */

const { spawn, execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const http = require('http')

const backendRoot = path.join(__dirname, '..')
const envPath = path.join(backendRoot, '.env')
const examplePath = path.join(backendRoot, '.env.example')

function log(...a) {
  console.log('[setup]', ...a)
}

function sh(cmd) {
  execSync(cmd, { cwd: backendRoot, stdio: 'inherit', shell: true })
}

function shOut(cmd) {
  return execSync(cmd, { cwd: backendRoot, encoding: 'utf8', shell: true }).trim()
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function waitForServicesRow() {
  const max = 90
  for (let i = 0; i < max; i++) {
    try {
      const out = shOut(
        'docker compose -f docker-compose.yml exec -T mysql mysql -uroot -pqueuesmart_root -N -e "SELECT COUNT(*) FROM queuesmart.services"'
      )
      const n = parseInt(out, 10)
      if (!Number.isNaN(n) && n >= 1) {
        log('database seeded (services row present)')
        return
      }
    } catch (_) {
      /* still starting or init scripts running */
    }
    await sleep(1000)
  }
  throw new Error(
    'MySQL did not expose seeded data in time. Try: FRESH_DB=1 npm run setup  (wipes Docker volume; re-applies schema+seed)'
  )
}

function waitForHttp200(port, pathname, maxAttempts = 60) {
  return new Promise((resolve, reject) => {
    let n = 0
    const hit = () => {
      n++
      const req = http.get({ hostname: '127.0.0.1', port, path: pathname, timeout: 3000 }, (res) => {
        res.resume()
        if (res.statusCode === 200) return resolve()
        if (n >= maxAttempts) return reject(new Error(`GET ${pathname} not 200 after ${maxAttempts} tries`))
        setTimeout(hit, 500)
      })
      req.on('error', () => {
        if (n >= maxAttempts) return reject(new Error('API not reachable'))
        setTimeout(hit, 500)
      })
      req.on('timeout', () => {
        req.destroy()
        if (n >= maxAttempts) return reject(new Error('timeout'))
        setTimeout(hit, 500)
      })
    }
    hit()
  })
}

async function main() {
  process.chdir(backendRoot)

  if (!process.env.SKIP_DOCKER) {
    try {
      shOut('docker compose version')
    } catch {
      console.error('Install Docker Desktop, or run with SKIP_DOCKER=1 if MySQL is already configured.')
      process.exit(1)
    }

    if (process.env.FRESH_DB === '1') {
      log('FRESH_DB=1: docker compose down -v')
      try {
        sh('docker compose -f docker-compose.yml down -v')
      } catch (_) {
        log('compose down -v skipped (no existing stack or engine still starting)')
      }
    }

    log('docker compose up -d')
    try {
      sh('docker compose -f docker-compose.yml up -d')
    } catch (e) {
      console.error('Docker Compose failed. Start Docker Desktop, then retry: npm run setup')
      throw e
    }

    await waitForServicesRow()
  } else {
    log('SKIP_DOCKER=1 — using existing MySQL (not changing .env unless missing)')
  }

  if (!fs.existsSync(examplePath)) {
    throw new Error('Missing .env.example')
  }
  if (process.env.SKIP_DOCKER !== '1' || !fs.existsSync(envPath)) {
    fs.copyFileSync(examplePath, envPath)
    log(process.env.SKIP_DOCKER === '1' ? 'created .env from .env.example' : 'wrote .env from .env.example (matches docker-compose)')
  }

  log('starting API (background)')
  const logFile = path.join(backendRoot, 'server-setup.log')
  const out = fs.openSync(logFile, 'a')
  const child = spawn(process.execPath, ['listen.js'], {
    cwd: backendRoot,
    detached: true,
    stdio: ['ignore', out, out],
    env: { ...process.env }
  })
  child.unref()

  log('waiting for http://127.0.0.1:3000/api/services …')
  await waitForHttp200(3000, '/api/services')

  log('running npm run smoke')
  sh('npm run smoke')

  log('OK — MySQL (Docker), .env, API on :3000, smoke passed.')
  log('Logs: ' + logFile + ' | Stop MySQL: docker compose -f docker-compose.yml down')
}

main().catch((e) => {
  console.error('[setup] failed:', e.message || e)
  process.exit(1)
})
