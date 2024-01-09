#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { LawBotBackend } from "../lib/law-bot-backend";
import { GithubActionsOIDCProvider } from "../lib/stacks/GithubActionsOIDCProvider/GithubActionsOIDCProvider";

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
      repo: "law-bot-backend",
      filter: "ref:refs/heads/*",
    },
  ],
});

new LawBotBackend(app, `LawBotBackendLambdaApiStack-${envName()}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
