import { describe, expect, test } from 'vitest'
import { validateReleaseIdentity } from './verify-release.mjs'

const expectedSha = '89b973efea218d9e77e2cbce3925916f92e09162'
const expectedTag = 'v0.1.6'
const assets = [
  'latest.json', 'SHA256SUMS',
  'Scan.Repair.Local_0.1.6_aarch64.dmg',
  'Scan.Repair.Local_0.1.6_x64-setup.exe',
  'Scan.Repair.Local_0.1.6_amd64.AppImage',
].map(name => ({ name }))
const manifest = {
  version: '0.1.6', tag: expectedTag, source_sha: expectedSha,
  platforms: {
    macos: { url: `https://github.com/example/repo/releases/download/${expectedTag}/Scan.Repair.Local_0.1.6_aarch64.dmg` },
    windows: { url: `https://github.com/example/repo/releases/download/${expectedTag}/Scan.Repair.Local_0.1.6_x64-setup.exe` },
    linux: { url: `https://github.com/example/repo/releases/download/${expectedTag}/Scan.Repair.Local_0.1.6_amd64.AppImage` },
  },
}
const checksums = assets.slice(2).map(({ name }, index) => `${String(index + 1).padStart(64, '0')}  ${name}`).join('\n')

describe('published release source identity regression', () => {
  test('reproduces verifier B1 when a valid release tag points to stale source', () => {
    expect(() => validateReleaseIdentity({ release: { tag_name: expectedTag, assets }, manifest, checksums, tagSha: 'cdd7991524a88cf2b1d4861af009e0ccf601082d', expectedTag, expectedSha }))
      .toThrow(`release tag ${expectedTag} resolves to cdd7991524a88cf2b1d4861af009e0ccf601082d, expected ${expectedSha}`)
  })

  test('accepts only a release whose tag, metadata, platform assets and checksums match the source', () => {
    expect(validateReleaseIdentity({ release: { tag_name: expectedTag, assets }, manifest, checksums, tagSha: expectedSha, expectedTag, expectedSha }))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ platform: 'macos' }),
        expect.objectContaining({ platform: 'windows' }),
        expect.objectContaining({ platform: 'linux' }),
      ]))
  })
})
