import { WebClient } from '@slack/web-api';
import { Response, Request } from 'express';
import { processEvents } from './process-events';
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
      console.log('1. Initiate message' + new Date());
      res.sendStatus(202);
      console.log('1.1 Status 202 sent successfully.' + new Date());
      await web.chat.postMessage({
        thread_ts: data.event.ts,
        channel: data.event.channel,
        text: 'Thanks for your message, one moment please ...',
      });
      try {
        console.log('1.2 Start message' + new Date());
        await processEvents(data);
        console.log('1.3 Success message', new Date());
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
