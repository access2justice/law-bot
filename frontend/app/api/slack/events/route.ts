import { WebClient } from '@slack/web-api'
const web = new WebClient(process.env.SLACK_TOKEN)

export async function POST(req: Request) {
  const data = await req.json()
  console.log(data)

  return new Response('Ok', {
    status: 200
  })
}
