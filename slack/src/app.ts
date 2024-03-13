import postSlackInteraction from './slack/interaction';
import postSlackNotionInteraction from './slack/notion-interaction';
import postSlackEvents from './slack/events';
import express from 'express';

// Create an instance of express
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

export default app;
