import { WebClient } from '@slack/web-api'
const web = new WebClient(process.env.SLACK_TOKEN)

export async function POST(req: Request) {
  const data = await req.json()

  if (data.type === 'url_verification') {
    return Response.json({ challenge: data.challenge })
  }

  if (
    !data.event.thread_ts &&
    !data.event.parent_user_id &&
    data.event.type === 'message' &&
    data.type === 'event_callback' &&
    (data.event.channel === 'C06GGJVRMCK' || 'C06HA3ZLB18')
  ) {
    const response = await fetch(process.env.AWS_API_CHAT_ENDPOINT || '', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: [
          {
            role: 'user',
            content:
              data.event.text ||
              'Explain to the user that something went wrong.'
          }
        ]
      })
    })

    const json = await response.json()

    const payload_value = JSON.stringify({
      user_input: data.event.text,
      ai_response: json.data.content
    })

    const messageBlocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: json.data.content
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Share a feedback'
            },
            action_id: 'feedback',
            value: payload_value
          }
        ]
      }
    ]

    await web.chat.postMessage({
      blocks: messageBlocks,
      thread_ts: data.event.ts,
      channel: data.event.channel,
      text: json.data.content
    })

    return new Response(data.challenge, {
      status: 200
    })
  }

  return new Response('Ok', {
    status: 200
  })
}
