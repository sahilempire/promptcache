const PREFIX = '[promptcache]'

export function createLogger(enabled: boolean = false) {
  return {
    debug: (...args: unknown[]) => {
      if (enabled) console.log(PREFIX, ...args)
    },
    info: (...args: unknown[]) => {
      if (enabled) console.info(PREFIX, ...args)
    },
    warn: (...args: unknown[]) => {
      console.warn(PREFIX, ...args)
    },
  }
}
