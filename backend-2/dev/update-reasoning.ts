// put legalReasoning.json into mongodb

// hardcoded to never update the prod db
process.env.DB_CONNECTION_STRING = "mongodb://root:legalbot@127.0.0.1:27017";

import { getReasoningModel } from "../repository";

const reasoningFromFile = require("./legalReasoning.json");

async function updateReasoning() {
  console.log(
    `Updating reasoning in mongodb at ${process.env.DB_CONNECTION_STRING}`
  );
  const reasoningModel = await getReasoningModel();
  await reasoningModel.deleteMany({});
  await reasoningModel.insertMany(reasoningFromFile, { lean: true });
  console.log("Updated reasoning.");
  process.exit(0);
}

// @ts-ignore
await updateReasoning();
