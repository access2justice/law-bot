import { WebClient } from '@slack/web-api'

const web = new WebClient(process.env.SLACK_TOKEN)

interface MessageShortcutBody {
  token: string
  callback_id: 'feedback'
  type: 'message_action'
  trigger_id: string
  response_url: string
  team: {
    id: string
    domain: string
  }
  channel: {
    id: string // "D0LFFBKLZ"
    name: string // "cats"
  }
  user: {
    id: string
    name: string
  }
  message: {
    type: 'message'
    user: string
    ts: string
    text: string
  }
}

export async function POST(req: Request) {
  const payload = (await req.json()).payload as MessageShortcutBody
  openModal(payload.trigger_id)
  const json = (await req.json()) as MessageShortcutBody
}

const openModal = async (trigger: string) => {
  // Open a modal.
  // Find more arguments and details of the response: https://api.slack.com/methods/views.open
  const result = await web.views.open({
    trigger_id: trigger,
    view: {
      type: 'modal',
      callback_id: 'view_identifier',
      title: {
        type: 'plain_text',
        text: 'Modal title'
      },
      submit: {
        type: 'plain_text',
        text: 'Submit'
      },
      blocks: [
        {
          type: 'input',
          label: {
            type: 'plain_text',
            text: 'Input label'
          },
          element: {
            type: 'plain_text_input',
            action_id: 'value_indentifier'
          }
        }
      ]
    }
  })

  // The result contains an identifier for the root view, view.id
  console.log(`Successfully opened root view ${result.view?.id}`)
}
