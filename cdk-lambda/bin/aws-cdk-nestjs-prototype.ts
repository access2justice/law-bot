#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {JurataBackend} from '../lib/jurata-backend';
import {GithubActionsOIDCProvider} from "../lib/stacks/GithubActionsOIDCProvider/GithubActionsOIDCProvider";

const envName = () => String(process.env.ENV_NAME ?? '').toLowerCase().replace(/[^a-z0-9-]/g, '');

const app = new cdk.App();

new GithubActionsOIDCProvider(app, 'JurataBackendGitHubOIDCProviderStack', {
    env: {account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION},
    repositoryConfig: [
        {owner: 'access2justice', repo: 'jurata-backend', filter: 'ref:refs/heads/*'},
    ],
});

new JurataBackend(app, `JurataBackendLambdaApiStack-${envName()}`, {
    env: {account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION},
});
