import { Duration, Stack, StackProps } from "aws-cdk-lib/core";
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

export class BackendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const SUPABASE_KEY = StringParameter.valueForStringParameter(this, "/pms/backend/SUPABASE_KEY");
    const SUPABASE_SECRET_JWT = StringParameter.valueForStringParameter(this, "/pms/backend/SUPABASE_SECRET_JWT");

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

    const create_proposal_lamda = new NodejsFunction(this, "pms-create-propposal", {
      functionName: "pms-create-propposal",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "create-proposal.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const get_proposal_lamda = new NodejsFunction(this, "pms-get-propposal", {
      functionName: "pms-get-propposal",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "get-proposal.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const get_proposal_evaluator_lamda = new NodejsFunction(this, "pms-get-propposal-evaluator", {
      functionName: "pms-get-propposal-evaluator",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "get-proposal-evaluator.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const get_agency_lamda = new NodejsFunction(this, "pms-get-agency", {
      functionName: "pms-get-agency",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "get-agency.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const get_cooperating_agency_lamda = new NodejsFunction(this, "pms-cooperating-agency", {
      functionName: "pms-cooperating-agency",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "get-cooperating-agency.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const get_department_lamda = new NodejsFunction(this, "pms-get-department", {
      functionName: "pms-get-department",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "get-department.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const get_discipline_lamda = new NodejsFunction(this, "pms-get-discipline", {
      functionName: "pms-get-discipline",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "get-discipline.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const get_sector_lamda = new NodejsFunction(this, "pms-get-sector", {
      functionName: "pms-get-sector",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "get-sector.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const get_tag_lamda = new NodejsFunction(this, "pms-get-tag", {
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

    const requestAuthorizer = new RequestAuthorizer(this, "pms-request-authorizer", {
      handler: authorizer_lambda,
      identitySources: [
        IdentitySource.header("Cookie"), // tell API Gateway to pass Cookie header
      ],
    });

    // /auth
    const auth = api.root.addResource("auth");

    // /auth/verify-token
    const verify_token = auth.addResource("verify-token");
    verify_token.addMethod(HttpMethod.GET, new LambdaIntegration(verify_token_lambda));

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
    create_proposal.addMethod(HttpMethod.POST, new LambdaIntegration(create_proposal_lamda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/view (protected)
    const get_proposal = proposal.addResource("view");
    get_proposal.addMethod(HttpMethod.GET, new LambdaIntegration(get_proposal_lamda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/view-evaluator (protected)
    const get_proposal_evaluator = proposal.addResource("view-evaluator");
    get_proposal_evaluator.addMethod(HttpMethod.GET, new LambdaIntegration(get_proposal_evaluator_lamda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/view-agency
    const get_agency = proposal.addResource("view-agency");
    get_agency.addMethod(HttpMethod.GET, new LambdaIntegration(get_agency_lamda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/view-cooperating-agency
    const get_cooperating_agency = proposal.addResource("view-cooperating-sector");
    get_cooperating_agency.addMethod(HttpMethod.GET, new LambdaIntegration(get_cooperating_agency_lamda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/view-department
    const get_department = proposal.addResource("view-department");
    get_department.addMethod(HttpMethod.GET, new LambdaIntegration(get_department_lamda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/view-discipline
    const get_discipline = proposal.addResource("view-discipline");
    get_discipline.addMethod(HttpMethod.GET, new LambdaIntegration(get_discipline_lamda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/view-sector
    const get_sector = proposal.addResource("view-sector");
    get_sector.addMethod(HttpMethod.GET, new LambdaIntegration(get_sector_lamda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/view-sector
    const get_tag = proposal.addResource("view-tag");
    get_tag.addMethod(HttpMethod.GET, new LambdaIntegration(get_tag_lamda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });
  }
}
