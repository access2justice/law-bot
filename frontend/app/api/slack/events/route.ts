import { WebClient } from '@slack/web-api'
const web = new WebClient(process.env.SLACK_TOKEN)

export async function POST(req: Request) {
  const data = await req.json()
  console.log(data)

  if (data.type === 'url_verification') {
    return Response.json({ challenge: data.challenge })
  }

  if (
    !data.event.thread_ts &&
    !data.event.parent_user_id &&
    data.event.type === 'message' &&
    data.type === 'event_callback' &&
    data.event.channel === 'C06GGJVRMCK'
  ) {
    const text = ''
    const response = await fetch(
      'https://credgs6ig3.execute-api.eu-central-1.amazonaws.com/prod/chat',
      {
        method: 'POST',
        headers: {
          'Content-type': 'application/json'
        },
        body: JSON.stringify({
          message: [
            {
              role: 'user',
              content: text
            }
          ]
        })
      }
    )

    const json = await response.json()
    console.log(json)
    web.chat.postMessage({
      text: json.data.content,
      thread_ts: data.event.ts,
      channel: data.event.channel
    })
    return new Response(data.challenge, {
      status: 200
    })
  }

  return new Response('Ok', {
    status: 200
  })
}
