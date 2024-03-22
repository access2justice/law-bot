import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import * as path from "path";
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda";

export class LawBotBackend extends cdk.Stack {
  public apiGateway: cdk.aws_apigateway.RestApi;

  constructor(
    scope: Construct,
    id: string,
    props?: cdk.StackProps & { apiGateway: cdk.aws_apigateway.RestApi }
  ) {
    super(scope, id, props);

    console.log("process.env.AUTHENTICATION_KEY");
    console.log((process.env.AUTHENTICATION_KEY || "").length);

    console.log("process.env.DB_CONNECTION_STRING");
    console.log((process.env.DB_CONNECTION_STRING || "").length);

    const lambdaFunction = new Function(this, "LambdaFunction", {
      runtime: Runtime.NODEJS_LATEST,
      timeout: cdk.Duration.seconds(60),
      handler: "index.handler",
      code: Code.fromAsset(path.resolve(__dirname, "../../backend-2")), // same assumption as above
      environment: {
        AUTHENTICATION_KEY: process.env.AUTHENTICATION_KEY || "",
        AZURE_OPENAI_ENDPOINT: process.env.AZURE_OPENAI_ENDPOINT || "",
        AZURE_OPENAI_KEY: process.env.AZURE_OPENAI_KEY || "",
        AZURE_OPENAI_EMBEDDING_DEPLOYMENT:
          process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || "",
        AZURE_SEARCH_ENPOINT: process.env.AZURE_SEARCH_ENPOINT || "",
        AZURE_SEARCH_INDEX_NAME: process.env.AZURE_SEARCH_INDEX_NAME || "",
        AZURE_SEARCH_KEY: process.env.AZURE_SEARCH_KEY || "",
        AZURE_OPENAI_DEPLOYMENT_NAME:
          process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "",
        DB_CONNECTION_STRING: process.env.DB_CONNECTION_STRING || "",
      },
    });

    this.apiGateway = props?.apiGateway as cdk.aws_apigateway.RestApi;

    const chat = this.apiGateway.root.addResource("chat-2");

    chat.addMethod(
      "ANY",
      new LambdaIntegration(lambdaFunction, {
        proxy: true,
      })
    );
  }
}
