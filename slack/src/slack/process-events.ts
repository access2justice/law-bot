import { WebClient } from '@slack/web-api';
import { Response, Request } from 'express';
import * as dotenv from 'dotenv';

dotenv.config({ path: __dirname + '/../../.env' });

const web = new WebClient(process.env.SLACK_TOKEN);

export default async function handler(data: any) {
  try {
    await web.chat.postMessage({
      thread_ts: data.event.ts,
      channel: data.event.channel,
      text: 'Thanks for your message, one moment please ...',
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));
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

    const json = await response.json();

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
