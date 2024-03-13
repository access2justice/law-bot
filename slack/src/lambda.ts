import { configure as serverlessExpress } from '@codegenie/serverless-express';
import app from './app';

exports.handler = serverlessExpress({ app });
