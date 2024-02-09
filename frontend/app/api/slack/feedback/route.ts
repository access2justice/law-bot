import { WebClient } from '@slack/web-api'

const web = new WebClient(process.env.SLACK_TOKEN)

/*
const slackResponse = {
  type: 'modal',
  title: {
    type: 'plain_text',
    text: 'Law Bot Expert Feedback',
    emoji: true
  },
  submit: {
    type: 'plain_text',
    text: 'Submit',
    emoji: true
  },
  close: {
    type: 'plain_text',
    text: 'Cancel',
    emoji: true
  },
  blocks: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Was the answer correct?'
      },
      accessory: {
        type: 'static_select',
        placeholder: {
          type: 'plain_text',
          text: 'Select an item',
          emoji: true
        },
        options: [
          {
            text: {
              type: 'plain_text',
              text: 'Yes',
              emoji: true
            },
            value: 'correct'
          },
          {
            text: {
              type: 'plain_text',
              text: 'No',
              emoji: true
            },
            value: 'false'
          }
        ],
        action_id: 'static_select-action'
      }
    },
    {
      type: 'input',
      element: {
        type: 'plain_text_input',
        multiline: true,
        action_id: 'plain_text_input-action'
      },
      label: {
        type: 'plain_text',
        text: 'Your Expert Comment',
        emoji: true
      }
    },
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: "Question & Bot's Answer",
        emoji: true
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'What is the minimum length of vacation?'
      }
    },
    {
      type: 'context',
      elements: [
        {
          type: 'plain_text',
          text: 'In Switzerland, the minimum length of vacation for employees is four weeks (20 working days) per year according to the Swiss Code of Obligations, Article 329a. This applies to all employees regardless of their age. For employees under the age of 20, the minimum vacation is five weeks.',
          emoji: true
        }
      ]
    }
  ]
}
*/

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
