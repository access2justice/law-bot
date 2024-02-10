import { WebClient } from '@slack/web-api'
const web = new WebClient(process.env.SLACK_TOKEN)

export async function POST(req: Request) {
  const data = await req.json()
  console.log(data)

  if (data.type === 'url_verification') {
    return Response.json({ challenge: data.challenge })
  }

  if (data.event.type === 'message' && data.type === 'event_callback') {
    const text = ''
    await fetch(
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
    return new Response(data.challenge, {
      status: 200
    })
  }

  return new Response('Ok', {
    status: 200
  })
}
