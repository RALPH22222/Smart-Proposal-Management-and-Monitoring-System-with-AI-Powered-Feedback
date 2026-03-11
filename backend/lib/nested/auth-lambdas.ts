import { NestedStack, Duration } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { IRole } from "aws-cdk-lib/aws-iam";
import { IBucket } from "aws-cdk-lib/aws-s3";
import path from "path";

interface AuthLambdasProps {
  sharedRole: IRole;
  profileSetupBucket: IBucket;
  supabaseKey: string;
  supabaseSecretJwt: string;
  smtpHost: string;
  smtpUser: string;
  smtpPass: string;
  frontendUrl: string;
  stageName: string;
}

export class AuthLambdas extends NestedStack {
  public readonly authorizer: NodejsFunction;
  public readonly cors: NodejsFunction;
  public readonly login: NodejsFunction;
  public readonly signup: NodejsFunction;
  public readonly confirmEmail: NodejsFunction;
  public readonly profileSetup: NodejsFunction;
  public readonly verifyOtp: NodejsFunction;
  public readonly changePassword: NodejsFunction;
  public readonly profileStatus: NodejsFunction;
  public readonly completeInvite: NodejsFunction;
  public readonly verifyToken: NodejsFunction;

  constructor(scope: Construct, id: string, props: AuthLambdasProps) {
    super(scope, id);
    const { sharedRole, profileSetupBucket, supabaseKey, supabaseSecretJwt, smtpHost, smtpUser, smtpPass, frontendUrl, stageName } =
      props;

    const defaults = {
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
    };

    this.authorizer = new NodejsFunction(this, "authorizer", {
      ...defaults,
      functionName: "pms-authorizer",
      entry: path.resolve("src", "handlers", "auth", "authorizer.ts"),
      environment: { SUPABASE_KEY: supabaseKey, SUPABASE_SECRET_JWT: supabaseSecretJwt },
    });

    this.cors = new NodejsFunction(this, "cors", {
      ...defaults,
      functionName: "pms-cors",
      entry: path.resolve("src", "handlers", "cors.ts"),
      role: sharedRole,
      environment: { SUPABASE_KEY: supabaseKey },
    });

    this.login = new NodejsFunction(this, "login", {
      ...defaults,
      functionName: "pms-login",
      entry: path.resolve("src", "handlers", "auth", "login.ts"),
      role: sharedRole,
      environment: { SUPABASE_KEY: supabaseKey },
    });

    this.signup = new NodejsFunction(this, "sign-up", {
      ...defaults,
      functionName: "pms-sign-up",
      timeout: Duration.seconds(30),
      entry: path.resolve("src", "handlers", "auth", "sign-up.ts"),
      environment: {
        SUPABASE_KEY: supabaseKey,
        SMTP_HOST: smtpHost,
        SMTP_USER: smtpUser,
        SMTP_PASS: smtpPass,
        FRONTEND_URL: frontendUrl,
        PROFILE_SETUP_BUCKET_NAME: `pms-profile-setup-bucket-${stageName}`,
      },
    });
    profileSetupBucket.grantPut(this.signup);

    this.confirmEmail = new NodejsFunction(this, "confirm-email", {
      ...defaults,
      functionName: "pms-confirm-email",
      entry: path.resolve("src", "handlers", "auth", "confirm-email.ts"),
      role: sharedRole,
      environment: { SUPABASE_KEY: supabaseKey, FRONTEND_URL: frontendUrl },
    });

    this.profileSetup = new NodejsFunction(this, "profile-setup", {
      ...defaults,
      functionName: "pms-profile-setup",
      entry: path.resolve("src", "handlers", "auth", "profile-setup.ts"),
      environment: {
        SUPABASE_KEY: supabaseKey,
        PROFILE_SETUP_BUCKET_NAME: `pms-profile-setup-bucket-${stageName}`,
      },
    });
    profileSetupBucket.grantPut(this.profileSetup);

    this.verifyOtp = new NodejsFunction(this, "verify-otp", {
      ...defaults,
      functionName: "pms-verify-otp",
      entry: path.resolve("src", "handlers", "auth", "verify-otp.ts"),
      role: sharedRole,
      environment: { SUPABASE_KEY: supabaseKey },
    });

    this.changePassword = new NodejsFunction(this, "change-password", {
      ...defaults,
      functionName: "pms-change-password",
      entry: path.resolve("src", "handlers", "auth", "change-password.ts"),
      role: sharedRole,
      environment: { SUPABASE_KEY: supabaseKey },
    });

    this.profileStatus = new NodejsFunction(this, "profile-status", {
      ...defaults,
      functionName: "pms-profile-status",
      entry: path.resolve("src", "handlers", "auth", "profile-status.ts"),
      role: sharedRole,
      environment: { SUPABASE_KEY: supabaseKey },
    });

    this.completeInvite = new NodejsFunction(this, "complete-invite", {
      ...defaults,
      functionName: "pms-complete-invite",
      entry: path.resolve("src", "handlers", "auth", "complete-invite.ts"),
      environment: {
        SUPABASE_KEY: supabaseKey,
        PROFILE_SETUP_BUCKET_NAME: `pms-profile-setup-bucket-${stageName}`,
      },
    });
    profileSetupBucket.grantPut(this.completeInvite);

    this.verifyToken = new NodejsFunction(this, "verify-token", {
      ...defaults,
      functionName: "pms-verify-token",
      entry: path.resolve("src", "handlers", "auth", "verify-token.ts"),
      role: sharedRole,
      environment: { SUPABASE_KEY: supabaseKey, SUPABASE_SECRET_JWT: supabaseSecretJwt },
    });
  }
}
