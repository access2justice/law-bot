#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { LawBotBackend } from "../lib/law-bot-backend";
import { GithubActionsOIDCProvider } from "../lib/stacks/GithubActionsOIDCProvider/GithubActionsOIDCProvider";
import { LawBotSlack } from "../lib/law-bot-slack";

const envName = () =>
  String(process.env.ENV_NAME ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");

const app = new cdk.App();

new GithubActionsOIDCProvider(app, "LawBotBackendGitHubOIDCProviderStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  repositoryConfig: [
    {
      owner: "access2justice",
      repo: "law-bot",
    },
  ],
});

const lawBotBackend = new LawBotBackend(
  app,
  `LawBotBackendLambdaApiStack-${envName()}`,
  {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  }
);

new LawBotSlack(app, `LawBotSlackLambdaApiStack-${envName()}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  apiGateway: lawBotBackend.apiGateway,
});
