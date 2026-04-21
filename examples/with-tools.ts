import Anthropic from '@anthropic-ai/sdk'
import { optimizeAnthropic } from 'cachellm'

// tools get cached too — great when you have big schemas
const tools = [
  {
    name: 'get_weather',
    description: 'Get current weather conditions for a specific location',
    input_schema: {
      type: 'object',
      properties: {
        latitude: { type: 'number', description: 'Latitude coordinate' },
        longitude: { type: 'number', description: 'Longitude coordinate' },
        units: { type: 'string', enum: ['celsius', 'fahrenheit'], description: 'Temperature unit' },
      },
      required: ['latitude', 'longitude'],
    },
  },
  {
    name: 'search_restaurants',
    description: 'Find restaurants near a given location with optional filters',
    input_schema: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City or address to search near' },
        cuisine: { type: 'string', description: 'Type of cuisine (italian, japanese, etc)' },
        price_range: { type: 'string', enum: ['$', '$$', '$$$', '$$$$'] },
        open_now: { type: 'boolean', description: 'Only show currently open restaurants' },
      },
      required: ['location'],
    },
  },
  {
    name: 'make_reservation',
    description: 'Book a table at a restaurant',
    input_schema: {
      type: 'object',
      properties: {
        restaurant_id: { type: 'string' },
        date: { type: 'string', format: 'date', description: 'YYYY-MM-DD' },
        time: { type: 'string', description: 'HH:MM in 24h format' },
        party_size: { type: 'integer', minimum: 1, maximum: 20 },
        special_requests: { type: 'string', description: 'Allergies, seating preference, etc' },
      },
      required: ['restaurant_id', 'date', 'time', 'party_size'],
    },
  },
  {
    name: 'get_directions',
    description: 'Get walking/driving/transit directions between two points',
    input_schema: {
      type: 'object',
      properties: {
        origin: { type: 'string' },
        destination: { type: 'string' },
        mode: { type: 'string', enum: ['walking', 'driving', 'transit'] },
      },
      required: ['origin', 'destination'],
    },
  },
]

const client = optimizeAnthropic(new Anthropic())

async function main() {
  const systemPrompt = `You are a helpful travel assistant. Use the available tools to help users plan their outings. Always check the weather before suggesting outdoor activities.`

  // all these calls share the same tools + system prompt — perfect for caching
  const questions = [
    'What is the weather like in Paris right now?',
    'Find me a good Italian restaurant in the 6th arrondissement',
    'Book a table for 2 at that place tonight at 8pm',
  ]

  for (const question of questions) {
    console.log(`\nUser: ${question}`)
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      system: systemPrompt,
      tools,
      messages: [{ role: 'user', content: question }],
    })
    const text = (response as any).content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('')
    if (text) console.log(`Assistant: ${text.slice(0, 120)}...`)
  }

  // the tools are ~800 tokens — caching them saves real money over many calls
  console.log('\n')
  client.printStats()
}

main().catch(console.error)
