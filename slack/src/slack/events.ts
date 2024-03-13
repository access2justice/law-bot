import { WebClient } from '@slack/web-api';
import { Response, Request } from 'express';

const web = new WebClient(process.env.SLACK_TOKEN);

export default async function postSlackEvents(req: Request, res: Response) {
  const { body } = req;
  const data = body as any;
  try {
    if (data.type === 'url_verification') {
      return new Response(JSON.stringify({ challenge: data.challenge }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
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

      (async () => {
        try {
          console.log('1. Start message' + new Date());
          const retJson = await fetch(
            `https://${process.env.VERCEL_URL}/api/slack/process-events`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(data),
            },
          );
          const status = retJson.status;
          const response = await retJson.json();
          console.log('2a. Success message', status, response);
          throw new Error();
        } catch (e) {
          console.log('2b. Success message' + new Date());
          console.log('Error fetching process-events:', e);
          await web.chat.postMessage({
            thread_ts: data.event.ts,
            channel: data.event.channel,
            text: 'Sorry, something went wrong.',
          });
        }
      })();
      console.log('x. Return message' + new Date());

      return new Response(Date.now() + '');
    }

    return new Response(Date.now() + '');
  } catch (e) {
    console.error('error', e);
    await web.chat.postMessage({
      thread_ts: data.event.ts,
      channel: data.event.channel,
      text: 'Sorry, something went wrong.',
    });
  }
}