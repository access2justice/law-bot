import { WebClient } from '@slack/web-api';
import { Response, Request } from 'express';
import processEvents from './process-events';
import * as dotenv from 'dotenv';

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

      try {
        console.log('1. Start message' + new Date());
        await fetch(
          `${process.env.API_SLACK_GATEWAY_URL}/slack/process-events`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          },
        );
        console.log('2. Success message', new Date());
        return;
      } catch (e) {
        console.log('Error fetching process-events:', e);
        await web.chat.postMessage({
          thread_ts: data.event.ts,
          channel: data.event.channel,
          text: 'Sorry, something went wrong.',
        });
      }
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
