import { describe, expect, it } from 'vitest'
import { analyseImageData, confidenceLabel, estimateSkew, markdownForPage } from './scan'

function ruledPage(angle: number, width = 220, height = 140) {
  const pixels = new Uint8ClampedArray(width * height * 4).fill(255)
  const slope = Math.tan(angle * Math.PI / 180)
  for (let line = 25; line < height - 15; line += 22) for (let x = 12; x < width - 12; x++) {
    const y = Math.round(line + (x - width / 2) * slope)
    for (let thickness = -1; thickness <= 1; thickness++) if (y + thickness >= 0 && y + thickness < height) {
      const index = ((y + thickness) * width + x) * 4
      pixels[index] = 24; pixels[index + 1] = 32; pixels[index + 2] = 28; pixels[index + 3] = 255
    }
  }
  return { data: pixels, width, height } as ImageData
}

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
  it('measures controlled clockwise and counter-clockwise text-line skew', () => {
    const clockwise = estimateSkew(ruledPage(3))
    const counterClockwise = estimateSkew(ruledPage(-2.5))
    expect(clockwise.skew).toBeCloseTo(3, 0)
    expect(counterClockwise.skew).toBeCloseTo(-2.5, 0)
    expect(clockwise.skewConfidence).toBe('high')
    expect(counterClockwise.skewConfidence).toBe('high')
  })
})
