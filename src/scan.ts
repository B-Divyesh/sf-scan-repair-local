export type Diagnosis = {
  contrast: number
  blur: number
  /** Positive values mean the text lines descend from left to right. */
  skew: number
  skewConfidence: 'high' | 'low'
  status: 'good' | 'review' | 'repair'
}

type SkewEstimate = Pick<Diagnosis, 'skew' | 'skewConfidence'>

/**
 * Estimate the angle of text baselines with a projection profile. For each
 * plausible page angle, dark pixels are projected onto rows perpendicular to
 * that angle. Aligned text produces a noticeably peaky row profile.
 *
 * This deliberately measures line angle, rather than page brightness. It is
 * bounded to the repair control's useful +/- 8 degree range and is sampled so
 * large PDFs remain responsive in the browser.
 */
export function estimateSkew(data: ImageData): SkewEstimate {
  const { width, height } = data
  const step = Math.max(1, Math.ceil(Math.max(width, height) / 260))
  const points: Array<[number, number, number]> = []
  for (let y = 0; y < height; y += step) for (let x = 0; x < width; x += step) {
    const p = (y * width + x) * 4
    const luminance = data.data[p] * .2126 + data.data[p + 1] * .7152 + data.data[p + 2] * .0722
    // Ignore the paper tone; line ink and other dark detail carry the angle.
    const ink = Math.max(0, (225 - luminance) / 225)
    if (ink > .05) points.push([x / step, y / step, ink])
  }
  if (points.length < 24) return { skew: 0, skewConfidence: 'low' }

  const sampleWidth = Math.ceil(width / step)
  const sampleHeight = Math.ceil(height / step)
  const scoreAt = (angle: number) => {
    const tangent = Math.tan(angle * Math.PI / 180)
    const bins = new Float64Array(Math.ceil(sampleHeight + sampleWidth * Math.abs(tangent)) + 3)
    const offset = tangent < 0 ? -sampleWidth * tangent : 0
    let total = 0
    for (const [x, y, ink] of points) {
      const bin = Math.max(0, Math.min(bins.length - 1, Math.round(y - x * tangent + offset)))
      bins[bin] += ink
      total += ink
    }
    let squares = 0
    for (const value of bins) squares += value * value
    return total ? squares / total : 0
  }

  let bestAngle = 0
  let bestScore = scoreAt(0)
  for (let angle = -8; angle <= 8; angle += .25) {
    const score = angle === 0 ? bestScore : scoreAt(angle)
    if (score > bestScore) { bestScore = score; bestAngle = angle }
  }
  const skew = Math.round(bestAngle * 10) / 10
  // Sparse scans cannot support a useful angle estimate. Dense line evidence
  // is enough to report the estimate, while near-level pages remain cautious.
  return { skew, skewConfidence: Math.abs(skew) >= .5 && points.length >= 100 ? 'high' : 'low' }
}

export function analyseImageData(data: ImageData): Diagnosis {
  const { width, height } = data
  const luminance = new Float32Array(width * height)
  let total = 0
  for (let i = 0; i < luminance.length; i++) {
    const p = i * 4
    const l = (data.data[p] * 0.2126 + data.data[p + 1] * 0.7152 + data.data[p + 2] * 0.0722)
    luminance[i] = l; total += l
  }
  const mean = total / luminance.length
  let variance = 0; let laplacian = 0
  for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
    const i = y * width + x; const value = luminance[i]
    variance += (value - mean) ** 2
    laplacian += Math.abs(4 * value - luminance[i - 1] - luminance[i + 1] - luminance[i - width] - luminance[i + width])
  }
  const contrast = Math.round(Math.sqrt(variance / luminance.length))
  const blur = Math.round(laplacian / Math.max(1, (width - 2) * (height - 2)))
  const skewEstimate = estimateSkew(data)
  const status = contrast < 28 || blur < 12 || Math.abs(skewEstimate.skew) >= 3
    ? 'repair'
    : contrast < 42 || blur < 20 || Math.abs(skewEstimate.skew) >= 1
      ? 'review'
      : 'good'
  return { contrast, blur, ...skewEstimate, status }
}

export function confidenceLabel(confidence: number) {
  if (confidence >= 85) return 'High confidence'
  if (confidence >= 60) return 'Review suggested'
  return 'Needs review'
}

export function markdownForPage(text: string, page: number, confidence: number) {
  return `## Page ${page}\n\n<!-- OCR confidence: ${Math.round(confidence)}% — verify against original -->\n\n${text.trim() || '[No text detected]'}\n`
}
