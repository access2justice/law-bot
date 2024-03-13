import { Client } from "@notionhq/client";
import * as dotenv from "dotenv";
import { sendSlackMessage } from "./slack";

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_API_SECRET });

export async function saveExpertFeedbackToNotion(
  question: string,
  answer: string,
  correct: boolean,
  comment: string,
  expertName: string,
  slack_channel: string,
  slack_thread_ts: string
) {
  const taskData = {
    parent: { database_id: "083bf4cbaf134f7a940444e847e49126" },
    properties: {
      "Original Question": { title: [{ text: { content: question } }] },
      Status: { multi_select: [{ name: "Submited" }] },
      Priority: { multi_select: [{ name: "Medium" }] },
      "Law Bot Answer": { rich_text: [{ text: { content: answer } }] },
      Correctness: { checkbox: correct },
      "Expert Comment": { rich_text: [{ text: { content: comment } }] },
      Expert: { rich_text: [{ text: { content: expertName } }] },
    },
  };

  const response = await notion.pages.create(taskData);

  if (response) {
    const message = `Expert feedback saved to Notion <${
      (response as any).url
    }|here>
    `;
    await sendSlackMessage(message, slack_channel, slack_thread_ts);
  }

  return response;
}
