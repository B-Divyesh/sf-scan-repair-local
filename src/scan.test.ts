import { describe, expect, it } from 'vitest'
import { analyseImageData, confidenceLabel, markdownForPage } from './scan'

describe('scan analysis', () => {
  it('recognises a high contrast edge as usable', () => {
    const pixels = new Uint8ClampedArray(4 * 16)
    for (let i = 0; i < 16; i++) pixels.set([i % 2 ? 255 : 0, i % 2 ? 255 : 0, i % 2 ? 255 : 0, 255], i * 4)
    const diagnosis = analyseImageData({ data: pixels, width: 4, height: 4 } as ImageData)
    expect(diagnosis.contrast).toBeGreaterThan(50)
    expect(diagnosis.status).not.toBe('repair')
  })
  it('labels uncertainty and preserves page references in markdown', () => {
    expect(confidenceLabel(55)).toBe('Needs review')
    expect(markdownForPage('A passage', 3, 61)).toContain('Page 3')
  })
})
