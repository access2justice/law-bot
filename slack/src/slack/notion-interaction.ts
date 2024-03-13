import { Client } from '@notionhq/client';
import { WebClient } from '@slack/web-api';
import { Response, Request } from 'express';
import * as dotenv from 'dotenv';

dotenv.config();

const web = new WebClient(process.env.SLACK_TOKEN);

const notion = new Client({ auth: process.env.NOTION_API_SECRET });

export default async function postSlackNotionInteraction(
  req: Request,
  res: Response,
) {
  try {
    const {
      question,
      answer,
      correct,
      comment,
      expertId,
      slack_channel,
      slack_thread_ts,
    } = req.body;

    console.log('Received expert feedback:', req.body);

    const expertName = expertId.name;

    const response = await saveExpertFeedbackToNotion(
      question,
      answer,
      correct,
      comment,
      expertName,
      slack_channel,
      slack_thread_ts,
    );

    console.log('Notion response:', response);

    res.status(200).json({ message: 'Expert feedback saved to Notion.' });
  } catch (error) {
    console.error('Error handling Notion interaction:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function saveExpertFeedbackToNotion(
  question: string,
  answer: string,
  correct: boolean,
  comment: string,
  expertName: string,
  slack_channel: string,
  slack_thread_ts: string,
) {
  const taskData = {
    parent: { database_id: '083bf4cbaf134f7a940444e847e49126' },
    properties: {
      'Original Question': { title: [{ text: { content: question } }] },
      Status: { multi_select: [{ name: 'Submited' }] },
      Priority: { multi_select: [{ name: 'Medium' }] },
      'Law Bot Answer': { rich_text: [{ text: { content: answer } }] },
      Correctness: { checkbox: correct },
      'Expert Comment': { rich_text: [{ text: { content: comment } }] },
      Expert: { rich_text: [{ text: { content: expertName } }] },
    },
  };

  const response = await notion.pages.create(taskData);

  if (response) {
    const message = `Expert feedback saved to Notion: ${(response as any).url}`;
    await sendSlackMessage(message, slack_channel, slack_thread_ts);
  }

  return response;
}

async function sendSlackMessage(
  message: string,
  slack_channel: string,
  slack_thread_ts: string,
) {
  await web.chat.postMessage({
    channel: slack_channel,
    text: message,
    thread_ts: slack_thread_ts,
  });
}
