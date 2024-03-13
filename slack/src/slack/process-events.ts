import { WebClient } from '@slack/web-api';
import * as dotenv from 'dotenv';
const fetch = require('node-fetch');

dotenv.config();

const web = new WebClient(process.env.SLACK_TOKEN);

interface ApiResponse {
  data: {
    content: string;
    reasoning_thread: any[];
  };
}

export default async function handler(data: any) {
  console.log('2. Initiate process-events, data:' + JSON.stringify(data));
  // try {
  //   console.log('2.1 Start message' + new Date());
  //   const postMessageResponse = await web.chat.postMessage({
  //     thread_ts: data.event.ts,
  //     channel: data.event.channel,
  //     text: 'Thanks for your message, one moment please ...',
  //   });
  //   console.log(
  //     '2.2 First response slack message:',
  //     JSON.stringify(postMessageResponse),
  //   );
  // } catch (e) {
  //   console.error('2.2 Error sending message:', JSON.stringify(e, null, 2));
  // }
  try {
    console.log('2.3. Start message:', new Date());
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log('2.4. Fetching Backend:', new Date());
    const response = await fetch(process.env.AWS_API_CHAT_ENDPOINT || '', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: [
          {
            role: 'user',
            content:
              data.event.text ||
              'Explain to the user that something went wrong.',
          },
        ],
      }),
    });

    const json = (await response.json()) as ApiResponse;
    console.log('2.5. Success message:', JSON.stringify(json));
    const payload_value = JSON.stringify({
      user_input: data.event.text,
      ai_response: json.data.content,
      slack_channel: data.event.channel,
      slack_thread_ts: data.event.ts,
    });

    const legalReasoning = [] as any[];
    json.data.reasoning_thread.forEach(({ type, result, prompt, response }) => {
      if (type === 'search') {
        legalReasoning.push({
          type: 'header',
          text: {
            type: 'plain_text',
            text: '⚙️ search',
            emoji: true,
          },
        });
        legalReasoning.push({
          type: 'context',
          elements: result.text.map((r: string, i: number) => ({
            type: 'mrkdwn',
            text: `*${result.art_para[i]}*: ${r}`,
          })),
        });
        legalReasoning.push({
          type: 'divider',
        });
      } else if (type === 'llm') {
        legalReasoning.push({
          type: 'header',
          text: {
            type: 'plain_text',
            text: '⚙️ llm',
            emoji: true,
          },
        });
        legalReasoning.push({
          type: 'context',
          elements: prompt.map((r: any, i: number) => ({
            type: 'mrkdwn',
            text: `*${r.role}*: ${r.content.replaceAll('\n', '')}`,
          })),
        });
        legalReasoning.push({
          type: 'divider',
        });
      }
    });

    const messageBlocks = [
      ...legalReasoning,
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: json.data.content,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Share a feedback',
            },
            action_id: 'feedback',
            value: payload_value,
          },
        ],
      },
    ];

    // console.log(messageBlocks);

    await web.chat.postMessage({
      blocks: messageBlocks,
      thread_ts: data.event.ts,
      channel: data.event.channel,
      text: json.data.content,
    });
  } catch (error) {
    console.error('Error fetching Backend:', error);
  }
}
