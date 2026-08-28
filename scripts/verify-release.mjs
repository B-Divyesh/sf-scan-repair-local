import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'

const INSTALLER_PATTERNS = {
  macos: /\.dmg$/i,
  windows: /\.(?:msi|exe)$/i,
  linux: /\.AppImage$/i,
}

export function validateReleaseIdentity({ release, manifest, checksums, tagSha, expectedTag, expectedSha }) {
  if (release.tag_name !== expectedTag) throw new Error(`latest release is ${release.tag_name}, expected ${expectedTag}`)
  if (tagSha !== expectedSha) throw new Error(`release tag ${expectedTag} resolves to ${tagSha}, expected ${expectedSha}`)
  if (manifest.tag !== expectedTag) throw new Error(`latest.json tag is ${manifest.tag}, expected ${expectedTag}`)
  if (manifest.source_sha !== expectedSha) throw new Error(`latest.json source_sha is ${manifest.source_sha}, expected ${expectedSha}`)

  const names = new Set(release.assets.map(asset => asset.name))
  for (const required of ['latest.json', 'SHA256SUMS']) {
    if (!names.has(required)) throw new Error(`release is missing ${required}`)
  }

  const selected = []
  for (const [platform, pattern] of Object.entries(INSTALLER_PATTERNS)) {
    const entry = manifest.platforms?.[platform]
    if (!entry?.url) throw new Error(`latest.json is missing ${platform}.url`)
    const file = decodeURIComponent(new URL(entry.url).pathname.split('/').pop())
    if (!pattern.test(file)) throw new Error(`${platform} URL does not name a supported artifact: ${file}`)
    if (!entry.url.includes(`/releases/download/${expectedTag}/`)) throw new Error(`${platform} URL does not resolve through ${expectedTag}`)
    if (!names.has(file)) throw new Error(`${platform} artifact is absent from the release: ${file}`)
    selected.push({ platform, file, url: entry.url })
  }

  const hashes = new Map()
  for (const line of checksums.trim().split(/\r?\n/)) {
    const match = line.match(/^([a-f0-9]{64})\s+\*?(.+)$/i)
    if (match) hashes.set(match[2], match[1].toLowerCase())
  }
  for (const artifact of selected) {
    artifact.sha256 = hashes.get(artifact.file)
    if (!artifact.sha256) throw new Error(`SHA256SUMS does not cover ${artifact.file}`)
  }
  return selected
}

async function checkedFetch(url, options = {}) {
  const response = await fetch(url, options)
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`)
  return response
}

async function resolveTagSha(repo, tag, headers) {
  const ref = await checkedFetch(`https://api.github.com/repos/${repo}/git/ref/tags/${encodeURIComponent(tag)}`, { headers }).then(r => r.json())
  if (ref.object.type === 'commit') return ref.object.sha
  if (ref.object.type !== 'tag') throw new Error(`unsupported tag object type: ${ref.object.type}`)
  const annotated = await checkedFetch(ref.object.url, { headers }).then(r => r.json())
  if (annotated.object.type !== 'commit') throw new Error(`annotated tag points to ${annotated.object.type}, not a commit`)
  return annotated.object.sha
}

async function sha256Url(url, headers) {
  const response = await checkedFetch(url, { headers })
  const hash = createHash('sha256')
  for await (const chunk of response.body) hash.update(chunk)
  return hash.digest('hex')
}

export async function verifyPublishedRelease({ repo, expectedTag, expectedSha, token = process.env.GITHUB_TOKEN }) {
  if (!repo || !expectedTag || !expectedSha) throw new Error('usage: --repo=owner/repo --tag=vX.Y.Z --sha=<40-character commit>')
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'scan-repair-local-release-verifier' }
  if (token) headers.Authorization = `Bearer ${token}`

  let release
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, { headers })
    if (response.ok) {
      const candidate = await response.json()
      if (candidate.tag_name === expectedTag) { release = candidate; break }
    }
    if (attempt < 12) await new Promise(resolve => setTimeout(resolve, 10_000))
  }
  if (!release) throw new Error(`latest release did not become ${expectedTag}`)

  const asset = name => {
    const found = release.assets.find(item => item.name === name)
    if (!found) throw new Error(`release is missing ${name}`)
    return found.browser_download_url
  }
  const [manifest, checksums, tagSha] = await Promise.all([
    checkedFetch(asset('latest.json'), { headers }).then(r => r.json()),
    checkedFetch(asset('SHA256SUMS'), { headers }).then(r => r.text()),
    resolveTagSha(repo, expectedTag, headers),
  ])
  const selected = validateReleaseIdentity({ release, manifest, checksums, tagSha, expectedTag, expectedSha })
  for (const artifact of selected) {
    const actual = await sha256Url(artifact.url, headers)
    if (actual !== artifact.sha256) throw new Error(`${artifact.file} checksum is ${actual}, expected ${artifact.sha256}`)
  }
  return { tag: expectedTag, source_sha: tagSha, artifacts: selected }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const values = Object.fromEntries(process.argv.slice(2).map(value => value.split(/=(.*)/s).slice(0, 2)))
  const result = await verifyPublishedRelease({ repo: values['--repo'], expectedTag: values['--tag'], expectedSha: values['--sha'] })
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
}
