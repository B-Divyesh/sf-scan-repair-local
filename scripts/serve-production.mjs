import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'

const root = resolve('dist/site')
const port = Number(process.env.PORT || 4173)
const csp = JSON.parse(readFileSync('staticwebapp.config.json', 'utf8')).globalHeaders['Content-Security-Policy']
const types = { '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.wasm': 'application/wasm', '.webmanifest': 'application/manifest+json', '.webp': 'image/webp' }

function fileFor(pathname) {
  const requested = decodeURIComponent(pathname).replace(/^\/+/, '')
  const candidate = normalize(join(root, requested))
  if (!candidate.startsWith(`${root}/`) && candidate !== root) return undefined
  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate
  if (existsSync(candidate) && statSync(candidate).isDirectory() && existsSync(join(candidate, 'index.html'))) return join(candidate, 'index.html')
  return undefined
}

createServer((request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host}`)
  const file = fileFor(url.pathname)
  const target = file || join(root, '404.html')
  response.writeHead(file ? 200 : 404, {
    'Content-Type': types[extname(target)] || 'application/octet-stream',
    'Content-Security-Policy': csp,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()'
  })
  createReadStream(target).pipe(response)
}).listen(port, 'localhost', () => console.log(`Production preview: http://localhost:${port}`))
