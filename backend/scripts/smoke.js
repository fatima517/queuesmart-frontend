#!/usr/bin/env node
/**
 * Lightweight API smoke check against a running server + MySQL.
 * Run from backend/: npm run smoke
 * (Start the API in another terminal: npm start)
 *
 * Env: SMOKE_HOST (default 127.0.0.1), SMOKE_PORT (default 3000)
 */

const http = require('http')

const host = process.env.SMOKE_HOST || '127.0.0.1'
const port = parseInt(process.env.SMOKE_PORT || '3000', 10)

const checks = [
  { name: 'GET /api/services', path: '/api/services', want: 200 },
  { name: 'GET /api/queue', path: '/api/queue', want: 200 }
]

function request(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(
      { hostname: host, port, path, timeout: 8000 },
      (res) => {
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8')
          let json = null
          try {
            json = raw ? JSON.parse(raw) : null
          } catch (_) {
            json = { _parseError: true, raw: raw.slice(0, 200) }
          }
          resolve({ status: res.statusCode, json, raw })
        })
      }
    )
    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('request timeout'))
    })
  })
}

async function main() {
  console.log(`Smoke: http://${host}:${port}\n`)

  for (const c of checks) {
    try {
      const res = await request(c.path)
      if (res.status !== c.want) {
        console.error(`FAIL ${c.name} — expected HTTP ${c.want}, got ${res.status}`)
        if (res.json && res.json.message) console.error('  message:', res.json.message)
        else if (res.raw) console.error('  body:', res.raw.slice(0, 300))
        if (res.status === 500) {
          console.error('  hint: ensure MySQL is running and schema.sql is applied (see backend/src/database/schema.sql).')
        }
        process.exit(1)
      }
      if (!Array.isArray(res.json)) {
        console.error(`FAIL ${c.name} — expected JSON array, got:`, typeof res.json)
        process.exit(1)
      }
      console.log(`OK   ${c.name} (${res.json.length} items)`)
    } catch (err) {
      if (err.code === 'ECONNREFUSED') {
        console.error(`FAIL ${c.name} — connection refused. Is the server running? (npm start)`)
        process.exit(1)
      }
      console.error(`FAIL ${c.name} —`, err.message || err)
      process.exit(1)
    }
  }

  console.log('\nAll smoke checks passed.')
}

main()
