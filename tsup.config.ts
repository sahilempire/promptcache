import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'providers/anthropic': 'src/providers/anthropic.ts',
    'providers/openai': 'src/providers/openai.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  splitting: true,
  treeshake: true,
  sourcemap: true,
  minify: false,
  external: [
    '@anthropic-ai/sdk',
    'openai',
  ],
})
