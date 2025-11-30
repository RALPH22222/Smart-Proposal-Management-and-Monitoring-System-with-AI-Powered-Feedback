import { Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib/core";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { HttpMethod, Runtime } from "aws-cdk-lib/aws-lambda";
import {
  AuthorizationType,
  IdentitySource,
  LambdaIntegration,
  RequestAuthorizer,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import path from "path";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";

const ALLOWED_STAGE_NAMES = ["dev", "prod"];

export class BackendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const stageName = scope.node.tryGetContext("stage");
    if (!ALLOWED_STAGE_NAMES.includes(stageName)) {
      throw new Error(
        `Invalid stage name: ${stageName}. Allowed values are: ${ALLOWED_STAGE_NAMES.join(", ")}. Use -c stage=<stage-name> to set the stage name when deploying the stack.`,
      );
    }

    const SUPABASE_KEY = StringParameter.valueForStringParameter(
      this,
      "/pms/backend/SUPABASE_KEY",
    );
    const SUPABASE_SECRET_JWT = StringParameter.valueForStringParameter(
      this,
      "/pms/backend/SUPABASE_SECRET_JWT",
    );

    // S3 Bucket
    const proposal_attachments_bucket = new Bucket(
      this,
      `pms-proposal-attachments-bucket-${stageName}`,
      {
        bucketName: `pms-proposal-attachments-bucket-${stageName}`,
        publicReadAccess: true,
        blockPublicAccess: {
          blockPublicAcls: false,
          blockPublicPolicy: false,
          ignorePublicAcls: false,
          restrictPublicBuckets: false,
        },
        removalPolicy: RemovalPolicy.RETAIN,
      },
    );

    // Lambdas
    const authorizer_lambda = new NodejsFunction(this, "pms-authorizer", {
      functionName: "pms-authorizer",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "auth", "authorizer.ts"),
      environment: {
        SUPABASE_SECRET_JWT,
      },
    });

    const cors_lambda = new NodejsFunction(this, "pms-cors", {
      functionName: "pms-cors",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "cors.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const login_lambda = new NodejsFunction(this, "pms-login", {
      functionName: "pms-login",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "auth", "login.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const signup_lambda = new NodejsFunction(this, "pms-sign-up", {
      functionName: "pms-sign-up",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "auth", "sign-up.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const create_proposal_lambda = new NodejsFunction(
      this,
      "pms-create-propposal",
      {
        functionName: "pms-create-propposal",
        memorySize: 128,
        runtime: Runtime.NODEJS_22_X,
        timeout: Duration.seconds(10),
        entry: path.resolve(
          "src",
          "handlers",
          "proposal",
          "create-proposal.ts",
        ),
        environment: {
          SUPABASE_KEY,
          PROPOSAL_BUCKET_NAME: `pms-proposal-attachments-bucket-${stageName}`,
        },
      },
    );
    proposal_attachments_bucket.grantPut(create_proposal_lambda);

    const proposal_forward_to_evaluators_lambda = new NodejsFunction(
      this,
      "pms-proposal-forward-to-evaluators-lambda",
      {
        functionName: "pms-proposal-forward-to-evaluators-lambda",
        memorySize: 128,
        runtime: Runtime.NODEJS_22_X,
        timeout: Duration.seconds(10),
        entry: path.resolve(
          "src",
          "handlers",
          "proposal",
          "forward-proposal-to-evaluators.ts",
        ),
        environment: {
          SUPABASE_KEY,
        },
      },
    );

    const get_proposal_lambda = new NodejsFunction(this, "pms-get-propposal", {
      functionName: "pms-get-propposal",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "get-proposal.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const get_proponent_proposal_stats_lambda = new NodejsFunction(
      this,
      "pms-get-proponent-proposal-stats",
      {
        functionName: "pms-get-proponent-proposal-stats",
        memorySize: 128,
        runtime: Runtime.NODEJS_22_X,
        timeout: Duration.seconds(10),
        entry: path.resolve(
          "src",
          "handlers",
          "proposal",
          "get-proponent-proposal-stats.ts",
        ),
        environment: {
          SUPABASE_KEY,
        },
      },
    );

    const get_rnd_proposal_stats_lambda = new NodejsFunction(
      this,
      "pms-get-rnd-proposal-stats",
      {
        functionName: "pms-get-rnd-proposal-stats",
        memorySize: 128,
        runtime: Runtime.NODEJS_22_X,
        timeout: Duration.seconds(10),
        entry: path.resolve(
          "src",
          "handlers",
          "proposal",
          "get-rnd-proposal-stats.ts",
        ),
        environment: {
          SUPABASE_KEY,
        },
      },
    );

    const get_evaluator_proposal_stats_lambda = new NodejsFunction(
      this,
      "pms-get-evaluator-proposal-stats",
      {
        functionName: "pms-get-evaluator-proposal-stats",
        memorySize: 128,
        runtime: Runtime.NODEJS_22_X,
        timeout: Duration.seconds(10),
        entry: path.resolve(
          "src",
          "handlers",
          "proposal",
          "get-evaluator-proposal-stats.ts",
        ),
        environment: {
          SUPABASE_KEY,
        },
      },
    );

    const get_proposal_evaluator_lambda = new NodejsFunction(
      this,
      "pms-get-propposal-evaluator",
      {
        functionName: "pms-get-propposal-evaluator",
        memorySize: 128,
        runtime: Runtime.NODEJS_22_X,
        timeout: Duration.seconds(10),
        entry: path.resolve(
          "src",
          "handlers",
          "proposal",
          "get-proposal-evaluator.ts",
        ),
        environment: {
          SUPABASE_KEY,
        },
      },
    );

    const get_agency_lambda = new NodejsFunction(this, "pms-get-agency", {
      functionName: "pms-get-agency",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "get-agency.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const get_cooperating_agency_lambda = new NodejsFunction(
      this,
      "pms-cooperating-agency",
      {
        functionName: "pms-cooperating-agency",
        memorySize: 128,
        runtime: Runtime.NODEJS_22_X,
        timeout: Duration.seconds(10),
        entry: path.resolve(
          "src",
          "handlers",
          "proposal",
          "get-cooperating-agency.ts",
        ),
        environment: {
          SUPABASE_KEY,
        },
      },
    );

    const get_department_lambda = new NodejsFunction(
      this,
      "pms-get-department",
      {
        functionName: "pms-get-department",
        memorySize: 128,
        runtime: Runtime.NODEJS_22_X,
        timeout: Duration.seconds(10),
        entry: path.resolve("src", "handlers", "proposal", "get-department.ts"),
        environment: {
          SUPABASE_KEY,
        },
      },
    );

    const get_discipline_lambda = new NodejsFunction(
      this,
      "pms-get-discipline",
      {
        functionName: "pms-get-discipline",
        memorySize: 128,
        runtime: Runtime.NODEJS_22_X,
        timeout: Duration.seconds(10),
        entry: path.resolve("src", "handlers", "proposal", "get-discipline.ts"),
        environment: {
          SUPABASE_KEY,
        },
      },
    );

    const get_sector_lambda = new NodejsFunction(this, "pms-get-sector", {
      functionName: "pms-get-sector",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "get-sector.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const get_tag_lambda = new NodejsFunction(this, "pms-get-tag", {
      functionName: "pms-get-tag",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "get-tag.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const verify_token_lambda = new NodejsFunction(this, "pms-verify-token", {
      functionName: "pms-verify-token",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "auth", "verify-token.ts"),
      environment: {
        SUPABASE_SECRET_JWT,
      },
    });

    const api = new RestApi(this, "pms-api-gateway", {
      restApiName: "pms-api-gateway",
      deployOptions: {
        stageName: "api",
      },
    });

    const requestAuthorizer = new RequestAuthorizer(
      this,
      "pms-request-authorizer",
      {
        handler: authorizer_lambda,
        identitySources: [
          IdentitySource.header("Cookie"), // tell API Gateway to pass Cookie header
        ],
      },
    );

    // /auth
    const auth = api.root.addResource("auth");

    // /auth/verify-token
    const verify_token = auth.addResource("verify-token");
    verify_token.addMethod(
      HttpMethod.GET,
      new LambdaIntegration(verify_token_lambda),
    );

    // /auth/login
    const login = auth.addResource("login");
    login.addMethod(HttpMethod.POST, new LambdaIntegration(login_lambda));

    // /auth/sign-up
    const signup = auth.addResource("sign-up");
    signup.addMethod(HttpMethod.POST, new LambdaIntegration(signup_lambda));

    // cors
    const cors = api.root.addResource("{proxy+}");
    cors.addMethod(HttpMethod.OPTIONS, new LambdaIntegration(cors_lambda));

    // /proposal
    const proposal = api.root.addResource("proposal");

    // /proposal/create (protected)
    const create_proposal = proposal.addResource("create");
    create_proposal.addMethod(
      HttpMethod.POST,
      new LambdaIntegration(create_proposal_lambda),
      {
        authorizer: requestAuthorizer,
        authorizationType: AuthorizationType.CUSTOM,
      },
    );

    // /proposal/forward-proposal-to-evaluators (protected)
    const proposal_forward_to_evaluators = proposal.addResource(
      "forward-proposal-to-evaluators",
    );
    proposal_forward_to_evaluators.addMethod(
      HttpMethod.POST,
      new LambdaIntegration(proposal_forward_to_evaluators_lambda),
      {
        authorizer: requestAuthorizer,
        authorizationType: AuthorizationType.CUSTOM,
      },
    );

    // /proposal/view (protected)
    const get_proposal = proposal.addResource("view");
    get_proposal.addMethod(
      HttpMethod.GET,
      new LambdaIntegration(get_proposal_lambda),
      {
        authorizer: requestAuthorizer,
        authorizationType: AuthorizationType.CUSTOM,
      },
    );

    // /proposal/view-evaluator (protected)
    const get_proposal_evaluator = proposal.addResource("view-evaluator");
    get_proposal_evaluator.addMethod(
      HttpMethod.GET,
      new LambdaIntegration(get_proposal_evaluator_lambda),
      {
        authorizer: requestAuthorizer,
        authorizationType: AuthorizationType.CUSTOM,
      },
    );

    // /proposal/view-proponent-proponent-stats
    const get_proponent_proposal_stats = proposal.addResource(
      "view-proponent-proposal-stats",
    );
    get_proponent_proposal_stats.addMethod(
      HttpMethod.GET,
      new LambdaIntegration(get_proponent_proposal_stats_lambda),
      {
        authorizer: requestAuthorizer,
        authorizationType: AuthorizationType.CUSTOM,
      },
    );

    // /proposal/view-proponent-proponent-stats
    const get_rnd_proposal_stats = proposal.addResource(
      "view-rnd-proposal-stats",
    );
    get_rnd_proposal_stats.addMethod(
      HttpMethod.GET,
      new LambdaIntegration(get_rnd_proposal_stats_lambda),
      {
        authorizer: requestAuthorizer,
        authorizationType: AuthorizationType.CUSTOM,
      },
    );

    // /proposal/view-proponent-proponent-stats
    const get_evaluator_proposal_stats = proposal.addResource(
      "view-evaluator-proposal-stats",
    );
    get_evaluator_proposal_stats.addMethod(
      HttpMethod.GET,
      new LambdaIntegration(get_evaluator_proposal_stats_lambda),
      {
        authorizer: requestAuthorizer,
        authorizationType: AuthorizationType.CUSTOM,
      },
    );
    // /proposal/view-agency
    const get_agency = proposal.addResource("view-agency");
    get_agency.addMethod(
      HttpMethod.GET,
      new LambdaIntegration(get_agency_lambda),
      {
        authorizer: requestAuthorizer,
        authorizationType: AuthorizationType.CUSTOM,
      },
    );

    // /proposal/view-cooperating-agency
    const get_cooperating_agency = proposal.addResource(
      "view-cooperating-sector",
    );
    get_cooperating_agency.addMethod(
      HttpMethod.GET,
      new LambdaIntegration(get_cooperating_agency_lambda),
      {
        authorizer: requestAuthorizer,
        authorizationType: AuthorizationType.CUSTOM,
      },
    );

    // /proposal/view-department
    const get_department = proposal.addResource("view-department");
    get_department.addMethod(
      HttpMethod.GET,
      new LambdaIntegration(get_department_lambda),
      {
        authorizer: requestAuthorizer,
        authorizationType: AuthorizationType.CUSTOM,
      },
    );

    // /proposal/view-discipline
    const get_discipline = proposal.addResource("view-discipline");
    get_discipline.addMethod(
      HttpMethod.GET,
      new LambdaIntegration(get_discipline_lambda),
      {
        authorizer: requestAuthorizer,
        authorizationType: AuthorizationType.CUSTOM,
      },
    );

    // /proposal/view-sector
    const get_sector = proposal.addResource("view-sector");
    get_sector.addMethod(
      HttpMethod.GET,
      new LambdaIntegration(get_sector_lambda),
      {
        authorizer: requestAuthorizer,
        authorizationType: AuthorizationType.CUSTOM,
      },
    );

    // /proposal/view-sector
    const get_tag = proposal.addResource("view-tag");
    get_tag.addMethod(HttpMethod.GET, new LambdaIntegration(get_tag_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });
  }
}
