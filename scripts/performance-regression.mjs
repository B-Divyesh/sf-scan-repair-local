import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { request } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const port = 4174
const baseURL = `http://localhost:${port}`
const chromePath = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1208/chrome-linux64/chrome'
const lighthouse = process.platform === 'win32' ? 'node_modules/.bin/lighthouse.cmd' : 'node_modules/.bin/lighthouse'

if (!existsSync(chromePath)) throw new Error(`Set CHROME_PATH to Chromium; not found: ${chromePath}`)

function waitForServer() {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + 15_000
    const tryRequest = () => request(baseURL, response => {
      response.resume()
      resolve()
    }).on('error', error => {
      if (Date.now() >= deadline) reject(error)
      else setTimeout(tryRequest, 100)
    }).end()
    tryRequest()
  })
}

function runLighthouse(run) {
  const report = join(tmpdir(), `scan-repair-local-demo-cold-${process.pid}-${run}.json`)
  const args = [
    `${baseURL}/demo`, '--quiet', '--output=json', `--output-path=${report}`,
    '--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage',
    '--form-factor=mobile', '--throttling-method=devtools',
    '--only-categories=performance,accessibility,best-practices,seo'
  ]
  return new Promise((resolve, reject) => {
    const child = spawn(lighthouse, args, { env: { ...process.env, CHROME_PATH: chromePath }, stdio: 'inherit' })
    child.on('error', reject)
    child.on('exit', code => {
      if (code !== 0) return reject(new Error(`Lighthouse cold run ${run} failed with exit ${code}`))
      try {
        const result = JSON.parse(readFileSync(report, 'utf8'))
        const evidence = {
          run,
          performance: Math.round(result.categories.performance.score * 100),
          lcp: Math.round(result.audits['largest-contentful-paint'].numericValue),
          lcpElement: result.audits['largest-contentful-paint-element'].details?.items?.[0]?.node?.snippet || ''
        }
        rmSync(report, { force: true })
        resolve(evidence)
      } catch (error) { reject(error) }
    })
  })
}

const server = spawn(process.execPath, ['scripts/serve-production.mjs'], {
  env: { ...process.env, PORT: String(port) }, stdio: 'inherit'
})

try {
  await waitForServer()
  // Each Lighthouse invocation opens a fresh Chrome profile. Three runs make
  // the formerly intermittent first-image LCP regression observable locally.
  const runs = []
  for (let run = 1; run <= 3; run += 1) runs.push(await runLighthouse(run))
  console.table(runs)
  if (process.env.PERFORMANCE_EVIDENCE_PATH) {
    writeFileSync(process.env.PERFORMANCE_EVIDENCE_PATH, `${JSON.stringify({ url: `${baseURL}/demo`, runs }, null, 2)}\n`)
  }
  for (const evidence of runs) {
    if (evidence.performance < 90 || evidence.lcp >= 2_500) {
      throw new Error(`cold mobile run ${evidence.run} missed budget: ${evidence.performance} performance, ${evidence.lcp} ms LCP`)
    }
  }
} finally {
  server.kill('SIGTERM')
}
