/**
 * Fast token estimation without tiktoken dependency.
 *
 * tiktoken adds ~3MB of WASM to your bundle. For deciding where to place
 * cache breakpoints, we don't need exact counts — being within ~15% is
 * plenty good enough. If you need precision, pass a custom tokenCounter.
 *
 * Based on OpenAI's own rule of thumb: ~4 chars per token for English.
 * We adjust for code (more tokens per char) and CJK (fewer chars per token).
 */
export function estimateTokens(text: string): number {
  if (!text) return 0

  let charCount = 0
  let nonAsciiCount = 0

  for (let i = 0; i < text.length; i++) {
    charCount++
    if (text.charCodeAt(i) > 127) nonAsciiCount++
  }

  // base estimate: ~4 chars per token
  let estimate = charCount / 4

  // CJK and non-ASCII heavy text uses more tokens per char
  const nonAsciiRatio = nonAsciiCount / charCount
  if (nonAsciiRatio > 0.3) {
    estimate = charCount / 2.5
  }

  // code tends to be more token-dense (lots of special chars, short identifiers)
  const codeIndicators = (text.match(/[{}()\[\];=<>]/g) || []).length
  if (codeIndicators / charCount > 0.05) {
    estimate *= 1.15
  }

  return Math.ceil(estimate)
}

/**
 * Estimate tokens for a structured object (tool definitions, message arrays, etc.)
 * by serializing to JSON first.
 */
export function estimateTokensForObject(obj: unknown): number {
  return estimateTokens(JSON.stringify(obj))
}
