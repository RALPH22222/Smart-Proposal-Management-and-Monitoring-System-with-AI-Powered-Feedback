import { RemovalPolicy, Stack, StackProps, Duration } from "aws-cdk-lib/core";
import { Construct } from "constructs";
import { HttpMethod, IFunction } from "aws-cdk-lib/aws-lambda";
import {
  AuthorizationType,
  AwsIntegration,
  Cors,
  GatewayResponse,
  IdentitySource,
  RequestAuthorizer,
  ResponseType,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Bucket, HttpMethods } from "aws-cdk-lib/aws-s3";
import { Role, ServicePrincipal, ManagedPolicy, PolicyStatement } from "aws-cdk-lib/aws-iam";

import { AuthLambdas } from "./nested/auth-lambdas";
import { ProposalLambdas } from "./nested/proposal-lambdas";
import { ProjectLambdas } from "./nested/project-lambdas";
import { AdminLambdas } from "./nested/admin-lambdas";

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

    // ========== PARAMETERS ==========
    const SUPABASE_KEY = StringParameter.valueForStringParameter(this, "/pms/backend/SUPABASE_KEY");
    const SUPABASE_SECRET_JWT = StringParameter.valueForStringParameter(this, "/pms/backend/SUPABASE_SECRET_JWT");
    const SES_SENDER_EMAIL = StringParameter.valueForStringParameter(this, "/pms/backend/SES_SENDER_EMAIL");
    const SUPABASE_SERVICE_ROLE_KEY = StringParameter.valueForStringParameter(
      this,
      "/pms/backend/SUPABASE_SERVICE_ROLE_KEY",
    );
    const GEMINI_API_KEY = StringParameter.valueForStringParameter(this, "/pms/backend/GEMINI_API_KEY");

    const FRONTEND_URL = "https://wmsu-spmams.vercel.app";

    // ========== S3 BUCKETS ==========
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
      cors: [
        {
          allowedHeaders: ["*"],
          allowedMethods: [HttpMethods.PUT],
          allowedOrigins: ["https://wmsu-spmams.vercel.app", "http://localhost:5173"],
          maxAge: 3000,
        },
      ],
    });

    const profile_setup_bucket = new Bucket(this, `pms-profile-setup-bucket-${stageName}`, {
      bucketName: `pms-profile-setup-bucket-${stageName}`,
      publicReadAccess: true,
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
      removalPolicy: RemovalPolicy.RETAIN,
    });

    // ========== SHARED IAM ROLES ==========
    const authLambdaRole = new Role(this, "pms-auth-lambda-role", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")],
    });

    const proposalLambdaRole = new Role(this, "pms-proposal-lambda-role", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")],
    });

    const projectLambdaRole = new Role(this, "pms-project-lambda-role", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")],
    });

    const adminLambdaRole = new Role(this, "pms-admin-lambda-role", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")],
    });

    // ========== NESTED STACKS (Lambda definitions) ==========
    const auth = new AuthLambdas(this, "AuthLambdas", {
      sharedRole: authLambdaRole,
      profileSetupBucket: profile_setup_bucket,
      supabaseKey: SUPABASE_KEY,
      supabaseSecretJwt: SUPABASE_SECRET_JWT,
      sesSenderEmail: SES_SENDER_EMAIL,
      frontendUrl: FRONTEND_URL,
      stageName,
    });

    const proposalL = new ProposalLambdas(this, "ProposalLambdas", {
      sharedRole: proposalLambdaRole,
      proposalBucket: proposal_attachments_bucket,
      supabaseKey: SUPABASE_KEY,
      geminiApiKey: GEMINI_API_KEY,
      stageName,
    });

    const projectL = new ProjectLambdas(this, "ProjectLambdas", {
      sharedRole: projectLambdaRole,
      proposalBucket: proposal_attachments_bucket,
      supabaseKey: SUPABASE_KEY,
      supabaseServiceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
      frontendUrl: FRONTEND_URL,
      stageName,
    });

    const adminL = new AdminLambdas(this, "AdminLambdas", {
      sharedRole: adminLambdaRole,
      supabaseKey: SUPABASE_KEY,
      supabaseSecretJwt: SUPABASE_SECRET_JWT,
      supabaseServiceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
      frontendUrl: FRONTEND_URL,
    });

    // ========== API GATEWAY ==========
    const api = new RestApi(this, "pms-api-gateway", {
      restApiName: "pms-api-gateway",
      deployOptions: { stageName: "api" },
      binaryMediaTypes: ["multipart/form-data"],
      defaultCorsPreflightOptions: {
        allowOrigins: ["http://localhost:5173", "https://wmsu-spmams.vercel.app"],
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization", "Cookie"],
        allowCredentials: true,
      },
    });

    // IAM role for API Gateway to invoke Lambdas (replaces per-function Lambda::Permission resources,
    // which cause circular dependencies between nested stacks and the parent stack)
    const apiRole = new Role(this, "pms-api-execution-role", {
      assumedBy: new ServicePrincipal("apigateway.amazonaws.com"),
    });
    apiRole.addToPolicy(
      new PolicyStatement({
        actions: ["lambda:InvokeFunction"],
        resources: ["arn:aws:lambda:*:*:function:pms-*"],
      }),
    );

    // AwsIntegration with credentialsRole — no Lambda::Permission created, no circular dependency
    const integrate = (fn: IFunction) =>
      new AwsIntegration({
        proxy: true,
        service: "lambda",
        path: `2015-03-31/functions/${fn.functionArn}/invocations`,
        options: { credentialsRole: apiRole },
      });

    // Gateway Responses for proper CORS headers on error responses
    const corsResponseHeaders = {
      "Access-Control-Allow-Origin": "'http://localhost:5173'",
      "Access-Control-Allow-Headers": "'Content-Type,Authorization,Cookie'",
      "Access-Control-Allow-Methods": "'GET,POST,DELETE,OPTIONS'",
      "Access-Control-Allow-Credentials": "'true'",
    };

    new GatewayResponse(this, "GatewayResponseDefault4XX", {
      restApi: api,
      type: ResponseType.DEFAULT_4XX,
      responseHeaders: corsResponseHeaders,
    });

    new GatewayResponse(this, "GatewayResponseDefault5XX", {
      restApi: api,
      type: ResponseType.DEFAULT_5XX,
      responseHeaders: corsResponseHeaders,
    });

    const requestAuthorizer = new RequestAuthorizer(this, "pms-request-authorizer", {
      handler: auth.authorizer,
      identitySources: [],
      resultsCacheTtl: Duration.seconds(0),
      assumeRole: apiRole,
    });

    const protectedRoute = {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    };

    // ========== AUTH ROUTES ==========
    const authResource = api.root.addResource("auth");

    authResource.addResource("verify-token").addMethod(HttpMethod.GET, integrate(auth.verifyToken));
    authResource.addResource("login").addMethod(HttpMethod.POST, integrate(auth.login));
    authResource.addResource("sign-up").addMethod(HttpMethod.POST, integrate(auth.signup));
    authResource.addResource("confirm-email").addMethod(HttpMethod.GET, integrate(auth.confirmEmail));
    authResource.addResource("departments").addMethod(HttpMethod.GET, integrate(proposalL.getLookup));
    authResource.addResource("verify-otp").addMethod(HttpMethod.POST, integrate(auth.verifyOtp));

    authResource
      .addResource("complete-invite")
      .addMethod(HttpMethod.POST, integrate(auth.completeInvite), protectedRoute);
    authResource
      .addResource("profile-setup")
      .addMethod(HttpMethod.POST, integrate(auth.profileSetup), protectedRoute);
    authResource
      .addResource("profile-status")
      .addMethod(HttpMethod.GET, integrate(auth.profileStatus), protectedRoute);
    authResource
      .addResource("change-password")
      .addMethod(HttpMethod.POST, integrate(auth.changePassword), protectedRoute);

    // ========== PUBLIC ROUTES ==========
    const publicResource = api.root.addResource("public");
    publicResource.addResource("contacts").addMethod(HttpMethod.GET, integrate(adminL.getContacts));

    // ========== PROPOSAL ROUTES ==========
    const proposal = api.root.addResource("proposal");

    proposal
      .addResource("create")
      .addMethod(HttpMethod.POST, integrate(proposalL.createProposal), protectedRoute);
    proposal
      .addResource("analyze")
      .addMethod(HttpMethod.POST, integrate(proposalL.analyzeProposal), protectedRoute);
    proposal
      .addResource("generate-tags")
      .addMethod(HttpMethod.POST, integrate(proposalL.generateTags), protectedRoute);
    proposal
      .addResource("forward-proposal-to-evaluators")
      .addMethod(HttpMethod.POST, integrate(proposalL.forwardToEvaluators), protectedRoute);
    proposal
      .addResource("forward-proposal-to-rnd")
      .addMethod(HttpMethod.POST, integrate(proposalL.forwardToRnd), protectedRoute);
    proposal
      .addResource("evaluator")
      .addMethod(HttpMethod.DELETE, integrate(proposalL.removeEvaluator), protectedRoute);
    proposal
      .addResource("revision-proposal-to-proponent")
      .addMethod(HttpMethod.POST, integrate(proposalL.revisionToProponent), protectedRoute);
    proposal
      .addResource("reject-proposal-to-proponent")
      .addMethod(HttpMethod.POST, integrate(proposalL.rejectToProponent), protectedRoute);
    proposal
      .addResource("decision-evaluator-to-proposal")
      .addMethod(HttpMethod.POST, integrate(proposalL.decisionEvaluator), protectedRoute);
    proposal
      .addResource("update-status")
      .addMethod(HttpMethod.POST, integrate(proposalL.updateStatus), protectedRoute);
    proposal
      .addResource("create-evaluation-scores-to-proposal")
      .addMethod(HttpMethod.POST, integrate(proposalL.createEvalScores), protectedRoute);
    proposal
      .addResource("get-evaluation-scores-from-proposal")
      .addMethod(HttpMethod.GET, integrate(proposalL.getEvalScores), protectedRoute);
    proposal.addResource("view").addMethod(HttpMethod.GET, integrate(proposalL.getProposal), protectedRoute);
    proposal
      .addResource("view-rnd")
      .addMethod(HttpMethod.GET, integrate(proposalL.getProposalRnd), protectedRoute);
    proposal
      .addResource("view-evaluator")
      .addMethod(HttpMethod.GET, integrate(proposalL.getProposalEvaluator), protectedRoute);
    proposal
      .addResource("view-proponent-proposal-stats")
      .addMethod(HttpMethod.GET, integrate(proposalL.getProponentStats), protectedRoute);
    proposal
      .addResource("view-rnd-proposal-stats")
      .addMethod(HttpMethod.GET, integrate(proposalL.getRndStats), protectedRoute);
    proposal
      .addResource("view-evaluator-proposal-stats")
      .addMethod(HttpMethod.GET, integrate(proposalL.getEvaluatorStats), protectedRoute);

    const lookup = proposal.addResource("lookup");
    lookup.addResource("{type}").addMethod(HttpMethod.GET, integrate(proposalL.getLookup), protectedRoute);

    proposal
      .addResource("view-users-by-role")
      .addMethod(HttpMethod.GET, integrate(proposalL.getUsersByRole), protectedRoute);
    proposal
      .addResource("endorse-for-funding")
      .addMethod(HttpMethod.POST, integrate(proposalL.endorseForFunding), protectedRoute);
    proposal
      .addResource("view-for-endorsement")
      .addMethod(HttpMethod.GET, integrate(proposalL.getProposalsForEndorsement), protectedRoute);
    proposal
      .addResource("submit-revised")
      .addMethod(HttpMethod.POST, integrate(proposalL.submitRevised), protectedRoute);
    proposal
      .addResource("upload-url")
      .addMethod(HttpMethod.GET, integrate(proposalL.getUploadUrl), protectedRoute);
    proposal
      .addResource("revision-summary")
      .addMethod(HttpMethod.GET, integrate(proposalL.getRevisionSummary), protectedRoute);
    proposal
      .addResource("rejection-summary")
      .addMethod(HttpMethod.GET, integrate(proposalL.getRejectionSummary), protectedRoute);
    proposal
      .addResource("versions")
      .addMethod(HttpMethod.GET, integrate(proposalL.getProposalVersions), protectedRoute);
    proposal
      .addResource("handle-extension-request")
      .addMethod(HttpMethod.POST, integrate(proposalL.handleExtensionRequest), protectedRoute);
    proposal
      .addResource("assignment-tracker")
      .addMethod(HttpMethod.GET, integrate(proposalL.getAssignmentTracker), protectedRoute);

    // ========== PROJECT MONITORING ROUTES ==========
    const project = api.root.addResource("project");

    project
      .addResource("funded")
      .addMethod(HttpMethod.GET, integrate(projectL.getFundedProjects), protectedRoute);
    project
      .addResource("view")
      .addMethod(HttpMethod.GET, integrate(projectL.getProject), protectedRoute);
    project
      .addResource("submit-report")
      .addMethod(HttpMethod.POST, integrate(projectL.submitQuarterlyReport), protectedRoute);
    project
      .addResource("reports")
      .addMethod(HttpMethod.GET, integrate(projectL.getProjectReports), protectedRoute);
    project
      .addResource("verify-report")
      .addMethod(HttpMethod.POST, integrate(projectL.verifyProjectReport), protectedRoute);
    project
      .addResource("add-comment")
      .addMethod(HttpMethod.POST, integrate(projectL.addReportComment), protectedRoute);
    project
      .addResource("comments")
      .addMethod(HttpMethod.GET, integrate(projectL.getReportComments), protectedRoute);
    project
      .addResource("add-expense")
      .addMethod(HttpMethod.POST, integrate(projectL.addProjectExpense), protectedRoute);
    project
      .addResource("expenses")
      .addMethod(HttpMethod.GET, integrate(projectL.getProjectExpenses), protectedRoute);
    project
      .addResource("update-status")
      .addMethod(HttpMethod.POST, integrate(projectL.updateProjectStatus), protectedRoute);
    project
      .addResource("overdue-reports")
      .addMethod(HttpMethod.GET, integrate(projectL.getOverdueReports), protectedRoute);
    project
      .addResource("invite-member")
      .addMethod(HttpMethod.POST, integrate(projectL.inviteMember), protectedRoute);
    project
      .addResource("remove-member")
      .addMethod(HttpMethod.POST, integrate(projectL.removeMember), protectedRoute);
    project
      .addResource("members")
      .addMethod(HttpMethod.GET, integrate(projectL.getProjectMembers), protectedRoute);
    project
      .addResource("create-fund-request")
      .addMethod(HttpMethod.POST, integrate(projectL.createFundRequest), protectedRoute);
    project
      .addResource("fund-requests")
      .addMethod(HttpMethod.GET, integrate(projectL.getFundRequests), protectedRoute);
    project
      .addResource("review-fund-request")
      .addMethod(HttpMethod.POST, integrate(projectL.reviewFundRequest), protectedRoute);
    project
      .addResource("generate-certificate")
      .addMethod(HttpMethod.POST, integrate(projectL.generateCertificate), protectedRoute);
    project
      .addResource("budget-summary")
      .addMethod(HttpMethod.GET, integrate(projectL.getBudgetSummary), protectedRoute);
    project
      .addResource("report-upload-url")
      .addMethod(HttpMethod.GET, integrate(projectL.getReportUploadUrl), protectedRoute);

    // ========== ADMIN ROUTES ==========
    const admin = api.root.addResource("admin");

    admin
      .addResource("create-account")
      .addMethod(HttpMethod.POST, integrate(adminL.createAccount), protectedRoute);
    admin
      .addResource("accounts")
      .addMethod(HttpMethod.GET, integrate(adminL.getAccounts), protectedRoute);
    admin
      .addResource("update-account")
      .addMethod(HttpMethod.POST, integrate(adminL.updateAccount), protectedRoute);
    admin
      .addResource("invite-user")
      .addMethod(HttpMethod.POST, integrate(adminL.inviteUser), protectedRoute);
    admin
      .addResource("toggle-account-status")
      .addMethod(HttpMethod.POST, integrate(adminL.toggleAccountStatus), protectedRoute);
    admin
      .addResource("activity-logs")
      .addMethod(HttpMethod.GET, integrate(adminL.getActivityLogs), protectedRoute);
    admin
      .addResource("dashboard-stats")
      .addMethod(HttpMethod.GET, integrate(adminL.getDashboardStats), protectedRoute);
    admin
      .addResource("update-contacts")
      .addMethod(HttpMethod.PUT, integrate(adminL.updateContacts), protectedRoute);

  }
}
