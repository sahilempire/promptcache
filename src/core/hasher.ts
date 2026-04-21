/**
 * Content fingerprinting for detecting stable prompt segments across requests.
 *
 * Uses a fast string hash (djb2). We don't need cryptographic security here,
 * just collision-resistant identity checks for prompt content.
 */
export function hashContent(content: string): string {
  let hash = 5381
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) + hash + content.charCodeAt(i)) & 0xffffffff
  }
  return hash.toString(36)
}

export function hashObject(obj: unknown): string {
  return hashContent(JSON.stringify(obj))
}

/**
 * Hash a content block, normalizing whitespace so minor formatting
 * changes don't invalidate the cache.
 */
export function hashNormalized(content: string): string {
  const normalized = content.replace(/\s+/g, ' ').trim()
  return hashContent(normalized)
}
