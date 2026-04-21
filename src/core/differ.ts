import { LRU } from '../utils/lru.js'
import { hashNormalized, hashObject } from './hasher.js'

/**
 * Tracks content hashes across requests to figure out what's stable
 * (same every call) vs what changes (user query, conversation tail).
 *
 * The idea: if a content block appears in 2+ of your last N requests,
 * it's almost certainly stable and worth caching.
 */
export class ContentDiffer {
  private seen: LRU<string, number>
  private threshold: number

  constructor(windowSize: number = 100, stabilityThreshold: number = 2) {
    this.seen = new LRU(windowSize)
    this.threshold = stabilityThreshold
  }

  /**
   * Record a content block and return how many times we've seen it.
   */
  recordAndCount(content: string): number {
    const hash = hashNormalized(content)
    const count = (this.seen.get(hash) || 0) + 1
    this.seen.set(hash, count)
    return count
  }

  recordObjectAndCount(obj: unknown): number {
    const hash = hashObject(obj)
    const count = (this.seen.get(hash) || 0) + 1
    this.seen.set(hash, count)
    return count
  }

  /**
   * Check if we've seen this content enough times to consider it stable.
   */
  isStable(content: string): boolean {
    const hash = hashNormalized(content)
    return (this.seen.get(hash) || 0) >= this.threshold
  }

  isObjectStable(obj: unknown): boolean {
    const hash = hashObject(obj)
    return (this.seen.get(hash) || 0) >= this.threshold
  }

  clear(): void {
    this.seen.clear()
  }
}
