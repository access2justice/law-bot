import { kv } from '@vercel/kv'

import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'

export const runtime = 'edge'

export async function POST(req: Request) {
  const json = await req.json()
  const { messages, previewToken } = json
  const userId = (await auth())?.user.id

  if (!userId) {
    return new Response('Unauthorized', {
      status: 401
    })
  }

  const userMessage = messages[messages.length - 1]

  // POST => AWS
  const res = await fetch(process.env.AWS_API_CHAT_ENDPOINT || '', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: [
        {
          role: 'user',
          content: userMessage.content
        }
      ],
      stream: true
    })
  })

  if (!res.ok) {
    return new Response('Error from server', { status: res.status })
  }

  if (res.body === null) {
    return new Response('Response body is null', { status: 500 })
  }

  const completion = await streamResponse(res.body)
  const title = json.messages[0].content.substring(0, 100)
  const id = json.id ?? nanoid()
  const createdAt = Date.now()
  const path = `/chat/${id}`
  const payload = {
    id,
    title,
    userId,
    createdAt,
    path,
    messages: [
      ...messages,
      {
        content: completion,
        role: 'assistant'
      }
    ]
  }

  await kv.hmset(`chat:${id}`, payload)
  await kv.zadd(`user:chat:${userId}`, {
    score: createdAt,
    member: `chat:${id}`
  })

  return new Response(completion, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    }
  })
}

async function streamResponse(
  body: ReadableStream<Uint8Array>
): Promise<string> {
  const reader = body.getReader()
  let result = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    const chunk = new TextDecoder().decode(value)
    result += chunk
  }
  return result
}
