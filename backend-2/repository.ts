import mongoose, { Connection, Model, Schema } from "mongoose";

let reasoningModel = null as Model<any> | null;
let conn = null as Connection | null;

const getReasoningModel = async (): Promise<Model<any>> => {
  if (reasoningModel) {
    return reasoningModel;
  }

  await mongoose.connect(process.env.DB_CONNECTION_STRING || "");

  reasoningModel = mongoose.model(
    "legalReasoning",
    new Schema(
      {
        order: { type: Number, required: true },
        type: { type: String, enum: ["search", "llm"] },
        llmQuery: {
          type: {
            messages: [
              {
                role: String,
                prompt: String,
              },
            ],
          },
          required: false,
        },
        searchQuery: {
          type: {
            query: String,
          },
          required: false,
        },
      },
      { collection: "legalReasoning" }
    )
  );
  conn = mongoose.connection;

  return reasoningModel;
};

export const getReasoning = async () => {
  const reasoningModel = await getReasoningModel();
  const reasoning = (await reasoningModel.find({}).lean()).sort(
    (a: any, b: any) => a.order - b.order
  );
  return reasoning;
};
