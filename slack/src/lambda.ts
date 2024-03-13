import { Callback, Context, Handler } from 'aws-lambda';
import { configure as serverlessExpress } from '@vendia/serverless-express';
import postSlackInteraction from './slack/interaction';
import postSlackNotionInteraction from './slack/notion-interaction';
import postSlackEvents from './slack/events';
const express = require('express');

let _cachedServer: Handler;

async function bootstrap(): Promise<Handler> {
  // Create an instance of express
  const app = express();
  app.use(express.json());

  // Specify the port to listen on
  const PORT = 3000;

  // Define a route for GET requests to the root URL ("/")
  app.post('/slack/interaction', async (req, res) => {
    await postSlackInteraction(req as any, res);
  });

  app.post('/slack/events', async (req, res) => {
    await postSlackEvents(req as any, res);
  });

  app.post('/slack/notion-interaction', async (req, res) => {
    await postSlackNotionInteraction(req as any, res);
  });

  // Start the server
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });

  return serverlessExpress({ app });
}

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  _cachedServer = _cachedServer ?? (await bootstrap());
  return _cachedServer(event, context, callback);
};