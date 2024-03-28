import { kv } from '@vercel/kv'

import { auth } from '@/auth'
import { nanoid } from '@/lib/utils'

export const runtime = 'edge'

export async function POST(req: Request) {
  const json = await req.json()
  const { messages, previewToken } = json
  const userId = (await auth())?.user.id
  console.log('Request: ', req)

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
      stream: false
    })
  })

  if (!res.ok) {
    return new Response('Error from server', { status: res.status })
  }

  const data = await res.json()
  console.log('Backend response: ', data)
  const completion = JSON.stringify(data.data)
  const title = 'Expert-' + json.messages[0].content.substring(0, 100)
  const id = json.id ?? nanoid()
  const createdAt = Date.now()
  const path = `/expert/chat/${id}`
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
      'Content-Type': 'text/plain'
    }
  })
}
