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
        timeout: cdk.Duration.seconds(30),
        memorySize: 256,
        reservedConcurrentExecutions: 100,
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
