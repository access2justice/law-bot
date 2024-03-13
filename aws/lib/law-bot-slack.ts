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

export class LawBotSlack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: cdk.StackProps & { apiGateway: cdk.aws_apigateway.RestApi }
  ) {
    super(scope, id, props);

    const dockerImageFunction = new DockerImageFunction(
      this,
      "DockerImageFunction",
      {
        code: DockerImageCode.fromImageAsset(
          path.resolve(__dirname, "../../slack")
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

    const slackResource = props?.apiGateway.root.addResource("slack");

    slackResource.addResource("interaction").addMethod(
      "POST",
      new LambdaIntegration(dockerImageFunction, {
        proxy: true,
      })
    );

    slackResource.addResource("events").addMethod(
      "POST",
      new LambdaIntegration(dockerImageFunction, {
        proxy: true,
      })
    );

    slackResource.addResource("notion-interaction").addMethod(
      "POST",
      new LambdaIntegration(dockerImageFunction, {
        proxy: true,
      })
    );
  }
}
