import { WebClient } from '@slack/web-api'
const web = new WebClient(process.env.SLACK_TOKEN)

export async function POST(req: Request) {
  const data = await req.formData()
  const payload = JSON.parse(data.get('payload') as string)

  if (payload.callback_id === 'feedback' && payload.trigger_id) {
    console.log(payload)
    console.log(JSON.stringify(payload.message.blocks))
    console.log(payload.channel.id)

    const thread = await web.conversations.replies({
      channel: payload.channel.id,
      ts: payload.message.ts
    })

    const question =
      (thread as any)?.messages[0]?.text ||
      'Something went wrong, please copy paste the question.'
    const answer =
      (thread as any)?.messages[1]?.text ||
      'Something went wrong, please copy paste the answer.'

    console.log(thread)

    await openModal(payload.trigger_id, question, answer)
  }

  return new Response('Ok', {
    status: 200
  })
}

const openModal = async (trigger: string, question: string, answer: string) => {
  // Open a modal.
  // Find more arguments and details of the response: https://api.slack.com/methods/views.open
  const result = await web.views.open({
    trigger_id: trigger,
    view: {
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
            text: question
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'plain_text',
              text: answer,
              emoji: true
            }
          ]
        }
      ]
    }
  })

  // The result contains an identifier for the root view, view.id
  console.log(`Successfully opened root view ${result.view?.id}`)
}
