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
  app.use(express.urlencoded({ extended: true }));

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

  return serverlessExpress({ app });
}

let serverlessExpressInstance;

export const handler: Handler = async (event: any, context: Context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  serverlessExpressInstance = serverlessExpressInstance || (await bootstrap());
  return serverlessExpressInstance(event, context);
};
