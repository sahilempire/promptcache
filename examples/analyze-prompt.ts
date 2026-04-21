import { PromptAnalyzer } from 'promptcache'

// you can analyze prompts without making any API calls
// useful for understanding what would get cached

const analyzer = new PromptAnalyzer()

const analysis = analyzer.analyzeAnthropicParams({
  system: `You are a legal document analyzer. You carefully read contracts, identify key clauses, flag potential risks, and summarize terms in plain English. Always cite the specific section numbers you reference.`,
  tools: [
    {
      name: 'extract_clauses',
      description: 'Extract and categorize clauses from a legal document',
      input_schema: {
        type: 'object',
        properties: {
          document_text: { type: 'string' },
          clause_types: { type: 'array', items: { type: 'string' } },
        },
        required: ['document_text'],
      },
    },
    {
      name: 'compare_versions',
      description: 'Compare two versions of a contract and highlight differences',
      input_schema: {
        type: 'object',
        properties: {
          version_a: { type: 'string' },
          version_b: { type: 'string' },
        },
        required: ['version_a', 'version_b'],
      },
    },
  ],
  messages: [
    { role: 'user', content: 'Here is the NDA we received from Acme Corp...' },
    { role: 'assistant', content: 'I can see several key sections in this NDA. Let me break them down...' },
    { role: 'user', content: 'What about the non-compete clause? Is 2 years standard?' },
  ],
})

console.log('Prompt Analysis')
console.log('===============')
console.log(`Total tokens (estimated): ${analysis.totalTokens}`)
console.log(`Cacheable tokens: ${analysis.cacheableTokens}`)
console.log(`Estimated savings: ~${analysis.estimatedSavingsPercent}%`)
console.log()

console.log('Segments:')
for (const seg of analysis.segments) {
  const stability = seg.stabilityScore >= 0.8 ? 'STABLE' : seg.stabilityScore >= 0.5 ? 'maybe' : 'variable'
  console.log(`  [${stability.padEnd(8)}] ${seg.path.padEnd(14)} ~${seg.tokenEstimate} tokens`)
}

console.log()
console.log('Stable segments (will be cached):')
for (const seg of analysis.stableSegments) {
  console.log(`  - ${seg.path}: "${seg.content.slice(0, 60)}..."`)
}

console.log()
console.log('Variable segments (won\'t be cached):')
for (const seg of analysis.variableSegments) {
  console.log(`  - ${seg.path}: "${seg.content.slice(0, 60)}..."`)
}
