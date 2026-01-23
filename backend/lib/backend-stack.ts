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

    const SUPABASE_KEY = StringParameter.valueForStringParameter(this, "/pms/backend/SUPABASE_KEY");
    const SUPABASE_SECRET_JWT = StringParameter.valueForStringParameter(this, "/pms/backend/SUPABASE_SECRET_JWT");

    // S3 Bucket
    const proposal_attachments_bucket = new Bucket(this, `pms-proposal-attachments-bucket-${stageName}`, {
      bucketName: `pms-proposal-attachments-bucket-${stageName}`,
      publicReadAccess: true,
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // Lambdas (All Lambda definitions remain the same)
    // ... (authorizer_lambda, cors_lambda, login_lambda, signup_lambda, create_proposal_lambda, etc. all remain unchanged)

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

    const create_proposal_lambda = new NodejsFunction(this, "pms-create-propposal", {
      functionName: "pms-create-propposal",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "create-proposal.ts"),
      environment: {
        SUPABASE_KEY,
        PROPOSAL_BUCKET_NAME: `pms-proposal-attachments-bucket-${stageName}`,
      },
    });
    proposal_attachments_bucket.grantPut(create_proposal_lambda);

    const proposal_forward_to_evaluators_lambda = new NodejsFunction(
      this,
      "pms-proposal-forward-to-evaluators-lambda",
      {
        functionName: "pms-proposal-forward-to-evaluators-lambda",
        memorySize: 128,
        runtime: Runtime.NODEJS_22_X,
        timeout: Duration.seconds(10),
        entry: path.resolve("src", "handlers", "proposal", "forward-proposal-to-evaluators.ts"),
        environment: {
          SUPABASE_KEY,
        },
      },
    );

    const proposal_forward_to_rnd_lambda = new NodejsFunction(this, "pms-proposal-forward-to-rnd-lambda", {
      functionName: "pms-proposal-forward-to-rnd-lambda",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "forward-proposal-to-rnd.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const revision_proposal_to_proponent_lambda = new NodejsFunction(this, "revision-proposal-to-proponent-lambda", {
      functionName: "revision-proposal-to-proponent-lambda",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "revision-proposal-to-proponent.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const reject_proposal_to_proponent_lambda = new NodejsFunction(this, "reject-proposal-to-proponent-lambda", {
      functionName: "reject-proposal-to-proponent-lambda",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "reject-proposal-to-proponent.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const decision_evaluator_to_proposal_lambda = new NodejsFunction(this, "decision-evaluator-to-proposal-lambda", {
      functionName: "decision-evaluator-to-proposal-lambda",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "decision-evaluator-to-proposal.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const create_evaluation_scores_to_proposal_lambda = new NodejsFunction(
      this,
      "create-evaluation-scores-to-proposal_lambda",
      {
        functionName: "create-evaluation-scores-to-proposal_lambda",
        memorySize: 128,
        runtime: Runtime.NODEJS_22_X,
        timeout: Duration.seconds(10),
        entry: path.resolve("src", "handlers", "proposal", "create-evaluation-scores-to-proposal.ts"),
        environment: {
          SUPABASE_KEY,
        },
      },
    );

    const get_evaluation_scores_from_proposal_lambda = new NodejsFunction(
      this,
      "get-evaluation-scores-from-proposal-lambda",
      {
        functionName: "get-evaluation-scores-from-proposal-lambda",
        memorySize: 128,
        runtime: Runtime.NODEJS_22_X,
        timeout: Duration.seconds(10),
        entry: path.resolve("src", "handlers", "proposal", "get-evaluation-scores-from-proposal.ts"),
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

    const get_proponent_proposal_stats_lambda = new NodejsFunction(this, "pms-get-proponent-proposal-stats", {
      functionName: "pms-get-proponent-proposal-stats",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "get-proponent-proposal-stats.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const get_rnd_proposal_stats_lambda = new NodejsFunction(this, "pms-get-rnd-proposal-stats", {
      functionName: "pms-get-rnd-proposal-stats",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "get-rnd-proposal-stats.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const get_evaluator_proposal_stats_lambda = new NodejsFunction(this, "pms-get-evaluator-proposal-stats", {
      functionName: "pms-get-evaluator-proposal-stats",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "get-evaluator-proposal-stats.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const get_proposal_evaluator_lambda = new NodejsFunction(this, "pms-get-propposal-evaluator", {
      functionName: "pms-get-propposal-evaluator",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "get-proposal-evaluator.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

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

    const get_cooperating_agency_lambda = new NodejsFunction(this, "pms-cooperating-agency", {
      functionName: "pms-cooperating-agency",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "get-cooperating-agency.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const get_department_lambda = new NodejsFunction(this, "pms-get-department", {
      functionName: "pms-get-department",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "get-department.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const get_discipline_lambda = new NodejsFunction(this, "pms-get-discipline", {
      functionName: "pms-get-discipline",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "get-discipline.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

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

    const get_priority_lambda = new NodejsFunction(this, "pms-get-priority", {
      functionName: "pms-get-priority",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "get-priority.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const get_station_lambda = new NodejsFunction(this, "pms-get-station", {
      functionName: "pms-get-station",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "get-station.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const endorse_for_funding_lambda = new NodejsFunction(this, "pms-endorse-for-funding", {
      functionName: "pms-endorse-for-funding",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "endorse-for-funding.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const get_proposals_for_endorsement_lambda = new NodejsFunction(this, "pms-get-proposals-for-endorsement", {
      functionName: "pms-get-proposals-for-endorsement",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "get-proposals-for-endorsement.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const submit_revised_proposal_lambda = new NodejsFunction(this, "pms-submit-revised-proposal", {
      functionName: "pms-submit-revised-proposal",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "submit-revised-proposal.ts"),
      environment: {
        SUPABASE_KEY,
        PROPOSAL_BUCKET_NAME: `pms-proposal-attachments-bucket-${stageName}`,
      },
    });
    proposal_attachments_bucket.grantPut(submit_revised_proposal_lambda);

    const get_revision_summary_lambda = new NodejsFunction(this, "pms-get-revision-summary", {
      functionName: "pms-get-revision-summary",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "get-revision-summary.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const get_rejection_summary_lambda = new NodejsFunction(this, "pms-get-rejection-summary", {
      functionName: "pms-get-rejection-summary",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "get-rejection-summary.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const get_proposal_versions_lambda = new NodejsFunction(this, "pms-get-proposal-versions", {
      functionName: "pms-get-proposal-versions",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "get-proposal-versions.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    // ========== PROJECT MONITORING LAMBDAS ==========

    const get_funded_projects_lambda = new NodejsFunction(this, "pms-get-funded-projects", {
      functionName: "pms-get-funded-projects",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "project", "get-funded-projects.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const get_project_lambda = new NodejsFunction(this, "pms-get-project", {
      functionName: "pms-get-project",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "project", "get-project.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const submit_quarterly_report_lambda = new NodejsFunction(this, "pms-submit-quarterly-report", {
      functionName: "pms-submit-quarterly-report",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "project", "submit-quarterly-report.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const get_project_reports_lambda = new NodejsFunction(this, "pms-get-project-reports", {
      functionName: "pms-get-project-reports",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "project", "get-project-reports.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const verify_project_report_lambda = new NodejsFunction(this, "pms-verify-project-report", {
      functionName: "pms-verify-project-report",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "project", "verify-project-report.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const add_report_comment_lambda = new NodejsFunction(this, "pms-add-report-comment", {
      functionName: "pms-add-report-comment",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "project", "add-report-comment.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const get_report_comments_lambda = new NodejsFunction(this, "pms-get-report-comments", {
      functionName: "pms-get-report-comments",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "project", "get-report-comments.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const add_project_expense_lambda = new NodejsFunction(this, "pms-add-project-expense", {
      functionName: "pms-add-project-expense",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "project", "add-project-expense.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const get_project_expenses_lambda = new NodejsFunction(this, "pms-get-project-expenses", {
      functionName: "pms-get-project-expenses",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "project", "get-project-expenses.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const update_project_status_lambda = new NodejsFunction(this, "pms-update-project-status", {
      functionName: "pms-update-project-status",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "project", "update-project-status.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const get_overdue_reports_lambda = new NodejsFunction(this, "pms-get-overdue-reports", {
      functionName: "pms-get-overdue-reports",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "project", "get-overdue-reports.ts"),
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
      binaryMediaTypes: ["multipart/form-data"],
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

    // cors (This is the {proxy+} general handler and remains the same)
    const cors = api.root.addResource("{proxy+}");
    cors.addMethod(HttpMethod.OPTIONS, new LambdaIntegration(cors_lambda));

    // /proposal
    const proposal = api.root.addResource("proposal");

    // /proposal/create (protected)
    const create_proposal = proposal.addResource("create");
    create_proposal.addMethod(HttpMethod.POST, new LambdaIntegration(create_proposal_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/forward-proposal-to-evaluators (protected)
    const proposal_forward_to_evaluators = proposal.addResource("forward-proposal-to-evaluators");
    proposal_forward_to_evaluators.addMethod(
      HttpMethod.POST,
      new LambdaIntegration(proposal_forward_to_evaluators_lambda),
      {
        authorizer: requestAuthorizer,
        authorizationType: AuthorizationType.CUSTOM,
      },
    );

    // /proposal/forward-proposal-to-rnd (protected)
    const proposal_forward_to_rnd = proposal.addResource("forward-proposal-to-rnd");
    proposal_forward_to_rnd.addMethod(HttpMethod.POST, new LambdaIntegration(proposal_forward_to_rnd_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/revision-proposal-to-proponent (protected)
    const revision_proposal_to_proponent = proposal.addResource("revision-proposal-to-proponent");
    revision_proposal_to_proponent.addMethod(
      HttpMethod.POST,
      new LambdaIntegration(revision_proposal_to_proponent_lambda),
      {
        authorizer: requestAuthorizer,
        authorizationType: AuthorizationType.CUSTOM,
      },
    );

    // /proposal/reject-proposal-to-proponent (protected)
    const reject_proposal_to_proponent = proposal.addResource("reject-proposal-to-proponent");
    reject_proposal_to_proponent.addMethod(
      HttpMethod.POST,
      new LambdaIntegration(reject_proposal_to_proponent_lambda),
      {
        authorizer: requestAuthorizer,
        authorizationType: AuthorizationType.CUSTOM,
      },
    );

    // /proposal/decision-evaluator-to-proposal (protected)
    const decision_evaluator_to_proposal = proposal.addResource("decision-evaluator-to-proposal");
    decision_evaluator_to_proposal.addMethod(
      HttpMethod.POST,
      new LambdaIntegration(decision_evaluator_to_proposal_lambda),
      {
        authorizer: requestAuthorizer,
        authorizationType: AuthorizationType.CUSTOM,
      },
    );

    // /proposal/create-evaluation-scores-to-proposal (protected)
    const create_evaluation_scores_to_proposal = proposal.addResource("create-evaluation-scores-to-proposal");
    create_evaluation_scores_to_proposal.addMethod(
      HttpMethod.POST,
      new LambdaIntegration(create_evaluation_scores_to_proposal_lambda),
      {
        authorizer: requestAuthorizer,
        authorizationType: AuthorizationType.CUSTOM,
      },
    );

    // /proposal/get-evaluation-scores-from-proposal (protected)
    const get_evaluation_scores_from_proposal = proposal.addResource("get-evaluation-scores-from-proposal");
    get_evaluation_scores_from_proposal.addMethod(
      HttpMethod.GET,
      new LambdaIntegration(get_evaluation_scores_from_proposal_lambda),
      {
        authorizer: requestAuthorizer,
        authorizationType: AuthorizationType.CUSTOM,
      },
    );

    // /proposal/view (protected)
    const get_proposal = proposal.addResource("view");
    get_proposal.addMethod(HttpMethod.GET, new LambdaIntegration(get_proposal_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/view-evaluator (protected)
    const get_proposal_evaluator = proposal.addResource("view-evaluator");
    get_proposal_evaluator.addMethod(HttpMethod.GET, new LambdaIntegration(get_proposal_evaluator_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/view-proponent-proponent-stats
    const get_proponent_proposal_stats = proposal.addResource("view-proponent-proposal-stats");
    get_proponent_proposal_stats.addMethod(HttpMethod.GET, new LambdaIntegration(get_proponent_proposal_stats_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/view-proponent-proponent-stats
    const get_rnd_proposal_stats = proposal.addResource("view-rnd-proposal-stats");
    get_rnd_proposal_stats.addMethod(HttpMethod.GET, new LambdaIntegration(get_rnd_proposal_stats_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/view-proponent-proponent-stats
    const get_evaluator_proposal_stats = proposal.addResource("view-evaluator-proposal-stats");
    get_evaluator_proposal_stats.addMethod(HttpMethod.GET, new LambdaIntegration(get_evaluator_proposal_stats_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/view-agency
    const get_agency = proposal.addResource("view-agency");
    get_agency.addMethod(HttpMethod.GET, new LambdaIntegration(get_agency_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/view-cooperating-agency
    const get_cooperating_agency = proposal.addResource("view-cooperating-sector");
    get_cooperating_agency.addMethod(HttpMethod.GET, new LambdaIntegration(get_cooperating_agency_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/view-department
    const get_department = proposal.addResource("view-department");
    get_department.addMethod(HttpMethod.GET, new LambdaIntegration(get_department_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/view-discipline
    const get_discipline = proposal.addResource("view-discipline");
    get_discipline.addMethod(HttpMethod.GET, new LambdaIntegration(get_discipline_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/view-sector
    const get_sector = proposal.addResource("view-sector");
    get_sector.addMethod(HttpMethod.GET, new LambdaIntegration(get_sector_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/view-tag
    const get_tag = proposal.addResource("view-tag");
    get_tag.addMethod(HttpMethod.GET, new LambdaIntegration(get_tag_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/view-priority
    const get_priority = proposal.addResource("view-priority");
    get_priority.addMethod(HttpMethod.GET, new LambdaIntegration(get_priority_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/view-station
    const get_station = proposal.addResource("view-station");
    get_station.addMethod(HttpMethod.GET, new LambdaIntegration(get_station_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/endorse-for-funding (protected)
    const endorse_for_funding = proposal.addResource("endorse-for-funding");
    endorse_for_funding.addMethod(HttpMethod.POST, new LambdaIntegration(endorse_for_funding_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/view-for-endorsement (protected)
    const get_proposals_for_endorsement = proposal.addResource("view-for-endorsement");
    get_proposals_for_endorsement.addMethod(HttpMethod.GET, new LambdaIntegration(get_proposals_for_endorsement_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/submit-revised (protected) - Proponent submits revised proposal
    const submit_revised_proposal = proposal.addResource("submit-revised");
    submit_revised_proposal.addMethod(HttpMethod.POST, new LambdaIntegration(submit_revised_proposal_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/revision-summary (protected) - Get revision feedback for a proposal
    const get_revision_summary = proposal.addResource("revision-summary");
    get_revision_summary.addMethod(HttpMethod.GET, new LambdaIntegration(get_revision_summary_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/rejection-summary (protected) - Get rejection details for a proposal
    const get_rejection_summary = proposal.addResource("rejection-summary");
    get_rejection_summary.addMethod(HttpMethod.GET, new LambdaIntegration(get_rejection_summary_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/versions (protected) - Get all versions of a proposal
    const get_proposal_versions = proposal.addResource("versions");
    get_proposal_versions.addMethod(HttpMethod.GET, new LambdaIntegration(get_proposal_versions_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // ========== PROJECT MONITORING ROUTES ==========

    // /project
    const project = api.root.addResource("project");

    // /project/funded (protected) - GET funded projects
    const funded_projects = project.addResource("funded");
    funded_projects.addMethod(HttpMethod.GET, new LambdaIntegration(get_funded_projects_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /project/view (protected) - GET single project
    const view_project = project.addResource("view");
    view_project.addMethod(HttpMethod.GET, new LambdaIntegration(get_project_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /project/submit-report (protected) - POST quarterly report
    const submit_report = project.addResource("submit-report");
    submit_report.addMethod(HttpMethod.POST, new LambdaIntegration(submit_quarterly_report_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /project/reports (protected) - GET project reports
    const project_reports = project.addResource("reports");
    project_reports.addMethod(HttpMethod.GET, new LambdaIntegration(get_project_reports_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /project/verify-report (protected) - POST verify report
    const verify_report = project.addResource("verify-report");
    verify_report.addMethod(HttpMethod.POST, new LambdaIntegration(verify_project_report_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /project/add-comment (protected) - POST add comment
    const add_comment = project.addResource("add-comment");
    add_comment.addMethod(HttpMethod.POST, new LambdaIntegration(add_report_comment_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /project/comments (protected) - GET report comments
    const get_comments = project.addResource("comments");
    get_comments.addMethod(HttpMethod.GET, new LambdaIntegration(get_report_comments_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /project/add-expense (protected) - POST add expense
    const add_expense = project.addResource("add-expense");
    add_expense.addMethod(HttpMethod.POST, new LambdaIntegration(add_project_expense_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /project/expenses (protected) - GET project expenses
    const get_expenses = project.addResource("expenses");
    get_expenses.addMethod(HttpMethod.GET, new LambdaIntegration(get_project_expenses_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /project/update-status (protected) - POST update project status
    const update_status = project.addResource("update-status");
    update_status.addMethod(HttpMethod.POST, new LambdaIntegration(update_project_status_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /project/overdue-reports (protected) - GET overdue reports
    const overdue_reports = project.addResource("overdue-reports");
    overdue_reports.addMethod(HttpMethod.GET, new LambdaIntegration(get_overdue_reports_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });
  }
}
