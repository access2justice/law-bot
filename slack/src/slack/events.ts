import { WebClient } from '@slack/web-api';
import { Response, Request } from 'express';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const web = new WebClient(process.env.SLACK_TOKEN);

export default async function postSlackEvents(req: Request, res: Response) {
  const { body } = req;
  const data = body as any;
  try {
    if (data.type === 'url_verification') {
      return res.status(200).json({ challenge: data.challenge });
    }
    if (
      !data.event.thread_ts &&
      !data.event.parent_user_id &&
      data.event.type === 'message' &&
      data.type === 'event_callback' &&
      (data.event.channel === 'C06GGJVRMCK' ||
        data.event.channel === 'C06HA3ZLB18')
    ) {
      console.log('00. Initiate message' + new Date());
      res.sendStatus(202);

      await web.chat.postMessage({
        channel: data.event.channel,
        thread_ts: data.event.ts,
        text: 'Thanks for your message, one moment please ...',
      });
      console.log('1. Start message' + new Date());

      try {
        const responseBackend = await fetch(
          `${process.env.AWS_API_CHAT_ENDPOINT}`,
          {
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
          },
        );

        const json = await responseBackend.json();
        console.log('2.5. Success message:', JSON.stringify(json));
        console.log(
          '2.6. After fetching backend, before processing legal reasoning',
          new Date(),
        );
        const payload_value = JSON.stringify({
          user_input: data.event.text,
          ai_response: json.data.content,
          slack_channel: data.event.channel,
          slack_thread_ts: data.event.ts,
        });

        const legalReasoning = [] as any[];
        json.data.reasoning_thread.forEach(
          ({ type, result, prompt, response }) => {
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
          },
        );
        console.log(
          '2.7 Processing legal reasoning and preparing message blocks.',
          new Date(),
        );
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
        console.log('2.8 Sending final message with blocks.', new Date());
        await web.chat.postMessage({
          blocks: messageBlocks,
          thread_ts: data.event.ts,
          channel: data.event.channel,
          text: json.data.content,
        });
        console.log('2.9 Slack message sent successfully.', new Date());
      } catch (error) {
        console.error('Error processing backend response:', error);
        await web.chat.postMessage({
          channel: data.event.channel,
          thread_ts: data.event.ts,
          text: 'Sorry, something went wrong with processing your request.',
        });
      }
    }
  } catch (e) {
    console.error('error', e);
    await web.chat.postMessage({
      thread_ts: data.event.ts,
      channel: data.event.channel,
      text: 'Sorry, something went wrong.',
    });
  }
}
