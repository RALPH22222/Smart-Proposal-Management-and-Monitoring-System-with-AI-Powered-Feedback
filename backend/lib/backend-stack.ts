import { Duration, Stack, StackProps } from "aws-cdk-lib/core";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { HttpMethod, Runtime } from "aws-cdk-lib/aws-lambda";
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import path from "path";
import { StringParameter } from "aws-cdk-lib/aws-ssm";

export class BackendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const auth_lambda = new NodejsFunction(this, "pms-login", {
      functionName: "pms-login",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "auth.ts"),
      environment: {
        SUPABASE_KEY: StringParameter.valueForStringParameter(scope, "/pms/backend/SUPABASE_KEY"),
      },
    });

    const api = new RestApi(this, "pms-api-gateway", {
      restApiName: "pms-api-gateway",
      deployOptions: {
        stageName: "api",
      },
    });
    const auth = api.root.addResource("auth");
    auth.addMethod(HttpMethod.POST, new LambdaIntegration(auth_lambda));
  }
}
