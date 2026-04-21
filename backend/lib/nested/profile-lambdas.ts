import { NestedStack, Duration } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { IRole } from "aws-cdk-lib/aws-iam";
import { IBucket } from "aws-cdk-lib/aws-s3";
import path from "path";

interface ProfileLambdasProps {
  sharedRole: IRole;
  profileSetupBucket: IBucket;
  supabaseKey: string;
  supabaseSecretJwt: string;
  stageName: string;
  rateLimitsTableName: string;
}

export class ProfileLambdas extends NestedStack {
  public readonly getProfile: NodejsFunction;
  public readonly updateProfile: NodejsFunction;
  public readonly changeEmail: NodejsFunction;
  public readonly updateAvatar: NodejsFunction;

  constructor(scope: Construct, id: string, props: ProfileLambdasProps) {
    super(scope, id);
    const { sharedRole, profileSetupBucket, supabaseKey, supabaseSecretJwt, stageName, rateLimitsTableName } = props;

    const defaults = {
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      role: sharedRole,
    };
    const TZ = "Asia/Manila";
    const envVars = { SUPABASE_KEY: supabaseKey, SUPABASE_SECRET_JWT: supabaseSecretJwt, TZ, RATE_LIMITS_TABLE: rateLimitsTableName };

    this.getProfile = new NodejsFunction(this, "get-profile", {
      ...defaults,
      functionName: "pms-profile-get",
      entry: path.resolve("src", "handlers", "profile", "get-profile.ts"),
      environment: envVars,
    });

    this.updateProfile = new NodejsFunction(this, "update-profile", {
      ...defaults,
      functionName: "pms-profile-update",
      entry: path.resolve("src", "handlers", "profile", "update-profile.ts"),
      environment: envVars,
    });

    this.changeEmail = new NodejsFunction(this, "change-email", {
      ...defaults,
      functionName: "pms-profile-change-email",
      entry: path.resolve("src", "handlers", "profile", "change-email.ts"),
      environment: envVars,
    });

    this.updateAvatar = new NodejsFunction(this, "update-avatar", {
      ...defaults,
      functionName: "pms-profile-update-avatar",
      entry: path.resolve("src", "handlers", "profile", "update-avatar.ts"),
      environment: {
        ...envVars,
        PROFILE_SETUP_BUCKET_NAME: `pms-profile-setup-bucket-${stageName}`,
      },
    });
    profileSetupBucket.grantPut(this.updateAvatar);
  }
}
