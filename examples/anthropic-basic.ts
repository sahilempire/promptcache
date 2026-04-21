import Anthropic from '@anthropic-ai/sdk'
import { optimizeAnthropic } from 'cachellm'

const client = optimizeAnthropic(new Anthropic())

const systemPrompt = `You are a cooking expert with deep knowledge of cuisines from around the world.
You know traditional recipes, modern variations, dietary substitutions, and cooking techniques
for everything from street food to fine dining. When asked about a recipe, provide clear
step-by-step instructions with ingredient quantities, prep time, and cooking tips.`

async function main() {
  // first call — this creates the cache
  const res1 = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: 'user', content: 'How do I make chicken biryani?' }],
  })
  console.log('Response 1:', res1.content[0])

  // second call — same system prompt, different question
  // this one should hit the cache (system prompt tokens at 90% off)
  const res2 = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: 'user', content: 'What about a good pasta carbonara?' }],
  })
  console.log('Response 2:', res2.content[0])

  // third call
  const res3 = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: 'user', content: 'Give me a quick dosa recipe' }],
  })
  console.log('Response 3:', res3.content[0])

  // see how much we saved
  client.printStats()
}

main().catch(console.error)
