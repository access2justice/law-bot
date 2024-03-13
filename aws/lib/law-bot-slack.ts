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

    // Define the first Lambda function
    const lambdaResponder = new lambda.Function(
      this,
      "LambdaFunctionSlackResponder",
      {
        runtime: lambda.Runtime.NODEJS_LATEST,
        handler: "lambdaFunctionOne.handler",
        code: lambda.Code.fromAsset(
          path.resolve(__dirname, "../../slack/responder")
        ), // assuming your Lambda code is in a directory named "lambda" at the root of your CDK project
        environment: {
          // Environment variables can be passed here
        },
      }
    );

    // Define the second Lambda function
    const lambdaWorker = new lambda.Function(
      this,
      "LambdaFunctionSlackWorker",
      {
        runtime: lambda.Runtime.NODEJS_LATEST,
        handler: "lambdaFunctionTwo.handler",
        code: lambda.Code.fromAsset(
          path.resolve(__dirname, "../../slack/worker")
        ), // same assumption as above
      }
    );

    // Grant the first Lambda permission to invoke the second Lambda
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

    slackResource.addResource("notion-interaction").addMethod(
      "POST",
      new LambdaIntegration(lambdaResponder, {
        proxy: true,
      })
    );
  }
}
