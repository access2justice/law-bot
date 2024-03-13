import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";

import * as path from "path";

export class LawBotSlack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: cdk.StackProps & { apiGateway: cdk.aws_apigateway.RestApi }
  ) {
    super(scope, id, props);

    const lambdaWorker = new lambda.Function(
      this,
      "LambdaFunctionSlackWorker",
      {
        runtime: lambda.Runtime.NODEJS_LATEST,
        timeout: cdk.Duration.seconds(60),
        handler: "index.handler",
        code: lambda.Code.fromAsset(
          path.resolve(__dirname, "../../slack/worker")
        ), // same assumption as above
        environment: {
          AWS_API_CHAT_ENDPOINT: process.env.AWS_API_CHAT_ENDPOINT || "",
          SLACK_TOKEN: process.env.SLACK_TOKEN || "",
          NOTION_API_SECRET: process.env.NOTION_API_SECRET || "",
        },
      }
    );

    // Define the first Lambda function
    const lambdaResponder = new lambda.Function(
      this,
      "LambdaFunctionSlackResponder",
      {
        runtime: lambda.Runtime.NODEJS_LATEST,
        timeout: cdk.Duration.seconds(15),
        handler: "index.handler",
        code: lambda.Code.fromAsset(
          path.resolve(__dirname, "../../slack/responder")
        ),
        environment: {
          WORKER_FUNCTION_NAME: lambdaWorker.functionName,
        },
      }
    );

    lambdaWorker.grantInvoke(lambdaResponder);

    const slackResource = props?.apiGateway.root.addResource("slack");

    slackResource.addResource("interaction").addMethod(
      "POST",
      new LambdaIntegration(lambdaResponder, {
        proxy: true,
      })
    );

    slackResource.addResource("events").addMethod(
      "POST",
      new LambdaIntegration(lambdaResponder, {
        proxy: true,
      })
    );
  }
}
