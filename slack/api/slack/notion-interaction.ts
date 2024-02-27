import { Client } from "@notionhq/client";
import { VercelRequest, VercelResponse } from "@vercel/node";

const notion = new Client({ auth: process.env.NOTION_API_SECRET });

export default async function notionInteractionHandler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const { question, answer, correct, comment, expertId } = req.body;

    console.log("Received expert feedback:", req.body);

    const usersList = await listUsers();

    console.log("usersList:", usersList);

    const response = await saveExpertFeedbackToNotion(
      question,
      answer,
      correct,
      comment,
      expertId
    );

    console.log("Task created in Notion:", response);

    res.status(200).json({ message: "Expert feedback saved to Notion." });
  } catch (error) {
    console.error("Error handling Notion interaction:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

async function listUsers() {
  try {
    const response = await notion.users.list({});
    console.log("usersList response:", response);
    return response.results;
  } catch (error) {
    console.error(error.body);
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
      "Original Question": { title: [{ text: { content: question } }] },
      Status: { multi_select: [{ name: "Submited" }] },
      Priority: { multi_select: [{ name: "Medium" }] },
      "Law Bot Answer": { rich_text: [{ text: { content: answer } }] },
      Correctness: { checkbox: correct },
      "Expert Comment": { rich_text: [{ text: { content: comment } }] },
      // Expert: {
      //   people: [{ user_id: expertId }],
      // },
    },
  };

  const response = await notion.pages.create(taskData);

  return response;
}
