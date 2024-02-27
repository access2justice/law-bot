import { Client } from "@notionhq/client";
import { VercelRequest, VercelResponse } from "@vercel/node";

const notion = new Client({ auth: process.env.NOTION_API_SECRET });

export default async function notionInteractionHandler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const { question, answer, correct, comment, expertId } = req.body;

    console.log("Received expert feedback:", JSON.parse(req.body));

    // const response = await saveExpertFeedbackToNotion(
    //   question,
    //   answer,
    //   correct,
    //   comment,
    //   expertId
    // );

    console.log("Task created in Notion:", response);

    res.status(200).json({ message: "Expert feedback saved to Notion." });
  } catch (error) {
    console.error("Error handling Notion interaction:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function saveExpertFeedbackToNotion(
  question: string,
  answer: string,
  correct: boolean,
  comment: string,
  expertId: string
) {
  const taskData = {
    parent: { database_id: "083bf4cbaf134f7a940444e847e49126" },
    properties: {
      Question: { title: [{ text: { content: question } }] },
      Answer: { rich_text: [{ text: { content: answer } }] },
      Correct: { checkbox: correct },
      Comment: { rich_text: [{ text: { content: comment } }] },
      Expert: { rich_text: [{ text: { content: expertId } }] },
      CreatedAt: { date: { start: new Date().toISOString() } },
    },
  };

  const response = await notion.pages.create(taskData);

  return response;
}
