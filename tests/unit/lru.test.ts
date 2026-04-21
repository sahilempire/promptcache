import { describe, it, expect } from 'vitest'
import { LRU } from '../../src/utils/lru'

describe('LRU', () => {
  it('stores and retrieves values', () => {
    const cache = new LRU<string, number>(10)
    cache.set('a', 1)
    cache.set('b', 2)
    expect(cache.get('a')).toBe(1)
    expect(cache.get('b')).toBe(2)
  })

  it('returns undefined for missing keys', () => {
    const cache = new LRU<string, number>(10)
    expect(cache.get('missing')).toBeUndefined()
  })

  it('evicts oldest entry when full', () => {
    const cache = new LRU<string, number>(3)
    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('c', 3)
    cache.set('d', 4) // should evict 'a'
    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('b')).toBe(2)
    expect(cache.get('d')).toBe(4)
    expect(cache.size).toBe(3)
  })

  it('accessing a key refreshes its position', () => {
    const cache = new LRU<string, number>(3)
    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('c', 3)
    cache.get('a') // refresh 'a'
    cache.set('d', 4) // should evict 'b', not 'a'
    expect(cache.get('a')).toBe(1)
    expect(cache.get('b')).toBeUndefined()
  })

  it('updates existing keys without growing', () => {
    const cache = new LRU<string, number>(3)
    cache.set('a', 1)
    cache.set('b', 2)
    cache.set('a', 10)
    expect(cache.get('a')).toBe(10)
    expect(cache.size).toBe(2)
  })

  it('clears all entries', () => {
    const cache = new LRU<string, number>(10)
    cache.set('a', 1)
    cache.set('b', 2)
    cache.clear()
    expect(cache.size).toBe(0)
    expect(cache.get('a')).toBeUndefined()
  })
})
