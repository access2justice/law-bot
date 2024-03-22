import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import * as path from "path";
import { DockerImageCode, DockerImageFunction } from "aws-cdk-lib/aws-lambda";
import {
  PredefinedMetric,
  ScalableTarget,
  ServiceNamespace,
} from "aws-cdk-lib/aws-applicationautoscaling";

export class LawBotBackend extends cdk.Stack {
  public apiGateway: cdk.aws_apigateway.RestApi;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dockerImageFunction = new DockerImageFunction(
      this,
      "DockerImageFunction",
      {
        code: DockerImageCode.fromImageAsset(
          path.resolve(__dirname, "../../backend")
        ),
        timeout: cdk.Duration.seconds(60),
        memorySize: 256,
        reservedConcurrentExecutions: 100,
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
      }
    );

    const target = new ScalableTarget(this, "ScalableTarget", {
      serviceNamespace: ServiceNamespace.LAMBDA,
      maxCapacity: 100,
      minCapacity: 1,
      resourceId: `function:${dockerImageFunction.functionName}:${dockerImageFunction.currentVersion.version}`,
      scalableDimension: "lambda:function:ProvisionedConcurrency",
    });

    target.scaleToTrackMetric("PceTracking", {
      targetValue: 0.9,
      scaleOutCooldown: cdk.Duration.seconds(0),
      scaleInCooldown: cdk.Duration.seconds(30),
      predefinedMetric:
        PredefinedMetric.LAMBDA_PROVISIONED_CONCURRENCY_UTILIZATION,
    });

    this.apiGateway = new RestApi(this, "ApiGateway", {});

    this.apiGateway.root.addMethod(
      "ANY",
      new LambdaIntegration(dockerImageFunction, {
        proxy: true,
      })
    );

    const chat = this.apiGateway.root.addResource("chat");

    chat.addMethod(
      "ANY",
      new LambdaIntegration(dockerImageFunction, {
        proxy: true,
      })
    );
  }
}
