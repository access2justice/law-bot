import { WebClient } from '@slack/web-api';
import * as dotenv from 'dotenv';

dotenv.config();

const web = new WebClient(process.env.SLACK_TOKEN);

async function sendSlackMessage(channel, thread, text) {
  return web.chat.postMessage({
    channel: channel,
    thread_ts: thread,
    text: text,
  });
}

async function fetchBackendAPI(body) {
  const response = await fetch(process.env.AWS_API_CHAT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.json();
}

export async function processEvents(data): Promise<void> {
  console.log('2.1 Start message' + new Date());
  await sendSlackMessage(
    data.event.channel,
    data.event.ts,
    'Thanks for your message, one moment please ...',
  );
  console.log('2.2. Slack message sent.', new Date());
  return new Promise(async (resolve, reject) => {
    console.log('2. Initiate process-events, data:' + JSON.stringify(data));
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('2.3. Fetching backend', new Date());
      const backendResponse = await fetchBackendAPI({
        message: [
          {
            role: 'user',
            content:
              data.event.text ||
              'Explain to the user that something went wrong.',
          },
        ],
      });
      console.log('2.4. Backend response:', backendResponse);
      console.log(
        '2.5. After fetching backend, before processing legal reasoning',
        new Date(),
      );
      const payload_value = JSON.stringify({
        user_input: data.event.text,
        ai_response: backendResponse.data.content,
        slack_channel: data.event.channel,
        slack_thread_ts: data.event.ts,
      });

      const legalReasoning = [] as any[];
      backendResponse.data.reasoning_thread.forEach(
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
            text: backendResponse.data.content,
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
        text: backendResponse.data.content,
      });
      console.log('2.9 Slack message sent successfully.', new Date());
      resolve();
    } catch (error) {
      console.log('Process-events Error:', error);
      console.error(
        'Process-events Error Detailed:',
        JSON.stringify(error, null, 2),
      );
      reject(error);
    }
  });
}

exports.handler = async (event) => {
  try {
    const data = JSON.parse(event.body);
    await processEvents(data);
    return { statusCode: 200, body: 'Process completed' };
  } catch (error) {
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};
