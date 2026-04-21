import OpenAI from 'openai'
import { optimizeOpenAI } from 'promptcache'

const client = optimizeOpenAI(new OpenAI())

async function main() {
  const systemMessage = {
    role: 'system' as const,
    content: `You are a senior software engineer doing code reviews. Focus on correctness, readability, and performance. Be direct but constructive. Point out bugs and suggest fixes.`,
  }

  // first call — establishes the prefix OpenAI will cache
  const res1 = await client.chat.completions.create({
    model: 'gpt-4.1',
    messages: [
      systemMessage,
      { role: 'user', content: 'Review this: function add(a, b) { return a - b }' },
    ],
  })
  console.log('Review 1:', (res1 as any).choices[0].message.content.slice(0, 100))

  // second call — same system prefix, different question
  const res2 = await client.chat.completions.create({
    model: 'gpt-4.1',
    messages: [
      systemMessage,
      { role: 'user', content: 'Review this: const data = JSON.parse(fs.readFileSync(path))' },
    ],
  })
  console.log('Review 2:', (res2 as any).choices[0].message.content.slice(0, 100))

  // OpenAI caches automatically — we just track the savings
  client.printStats()
}

main().catch(console.error)
