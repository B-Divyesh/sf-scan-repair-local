export type Diagnosis = { contrast: number; blur: number; skew: number; status: 'good' | 'review' | 'repair' }

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
  let variance = 0; let laplacian = 0; let left = 0; let right = 0
  for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
    const i = y * width + x; const value = luminance[i]
    variance += (value - mean) ** 2
    laplacian += Math.abs(4 * value - luminance[i - 1] - luminance[i + 1] - luminance[i - width] - luminance[i + width])
    if (x < width / 2) left += value; else right += value
  }
  const contrast = Math.round(Math.sqrt(variance / luminance.length))
  const blur = Math.round(laplacian / Math.max(1, (width - 2) * (height - 2)))
  const skew = Math.min(8, Math.round(Math.abs(left - right) / (width * height) * 8 * 10) / 10)
  const status = contrast < 28 || blur < 12 ? 'repair' : contrast < 42 || blur < 20 ? 'review' : 'good'
  return { contrast, blur, skew, status }
}

export function confidenceLabel(confidence: number) {
  if (confidence >= 85) return 'High confidence'
  if (confidence >= 60) return 'Review suggested'
  return 'Needs review'
}

export function markdownForPage(text: string, page: number, confidence: number) {
  return `## Page ${page}\n\n<!-- OCR confidence: ${Math.round(confidence)}% — verify against original -->\n\n${text.trim() || '[No text detected]'}\n`
}
