/**
 * Simple LRU cache. Nothing fancy, just enough for tracking
 * content hashes across requests without leaking memory.
 */
export class LRU<K, V> {
  private map = new Map<K, V>()
  private maxSize: number

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize
  }

  get(key: K): V | undefined {
    const value = this.map.get(key)
    if (value === undefined) return undefined

    // move to end (most recent)
    this.map.delete(key)
    this.map.set(key, value)
    return value
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key)
    } else if (this.map.size >= this.maxSize) {
      // evict oldest
      const oldest = this.map.keys().next().value!
      this.map.delete(oldest)
    }
    this.map.set(key, value)
  }

  has(key: K): boolean {
    return this.map.has(key)
  }

  get size(): number {
    return this.map.size
  }

  clear(): void {
    this.map.clear()
  }
}
