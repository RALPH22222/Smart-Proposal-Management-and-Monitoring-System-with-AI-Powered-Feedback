import { Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib/core";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { HttpMethod, Runtime } from "aws-cdk-lib/aws-lambda";
import {
  AuthorizationType,
  Cors,
  GatewayResponse,
  IdentitySource,
  LambdaIntegration,
  RequestAuthorizer,
  ResponseType,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import path from "path";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import { Bucket, HttpMethods } from "aws-cdk-lib/aws-s3";
import { PolicyStatement, Effect } from "aws-cdk-lib/aws-iam";

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
    const SES_SENDER_EMAIL = StringParameter.valueForStringParameter(this, "/pms/backend/SES_SENDER_EMAIL");
    const SUPABASE_SERVICE_ROLE_KEY = StringParameter.valueForStringParameter(
      this,
      "/pms/backend/SUPABASE_SERVICE_ROLE_KEY",
    );

    const FRONTEND_URL = stageName === "prod" ? "https://wmsu-spmams.vercel.app" : "http://localhost:5173";

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

    // Lambdas (All Lambda definitions remain the same)
    // ... (authorizer_lambda, cors_lambda, login_lambda, signup_lambda, create_proposal_lambda, etc. all remain unchanged)

    const authorizer_lambda = new NodejsFunction(this, "pms-authorizer", {
      functionName: "pms-authorizer",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "auth", "authorizer.ts"),
      environment: {
        SUPABASE_KEY,
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
      timeout: Duration.seconds(30),
      entry: path.resolve("src", "handlers", "auth", "sign-up.ts"),
      environment: {
        SUPABASE_KEY,
        SES_SENDER_EMAIL,
        FRONTEND_URL,
        PROFILE_SETUP_BUCKET_NAME: `pms-profile-setup-bucket-${stageName}`,
      },
    });
    profile_setup_bucket.grantPut(signup_lambda);

    // Grant SES send email permissions for verification emails
    signup_lambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["ses:SendEmail"],
        resources: ["*"],
      }),
    );

    const confirm_email_lambda = new NodejsFunction(this, "pms-confirm-email", {
      functionName: "pms-confirm-email",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "auth", "confirm-email.ts"),
      environment: {
        SUPABASE_KEY,
        FRONTEND_URL,
      },
    });

    const profile_setup_lambda = new NodejsFunction(this, "pms-profile-setup", {
      functionName: "pms-profile-setup",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "auth", "profile-setup.ts"),
      environment: {
        SUPABASE_KEY,
        PROFILE_SETUP_BUCKET_NAME: `pms-profile-setup-bucket-${stageName}`,
      },
    });
    profile_setup_bucket.grantPut(profile_setup_lambda);

    const change_password_lambda = new NodejsFunction(this, "pms-change-password", {
      functionName: "pms-change-password",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "auth", "change-password.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const profile_status_lambda = new NodejsFunction(this, "pms-profile-status", {
      functionName: "pms-profile-status",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "auth", "profile-status.ts"),
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
      },
    });

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

    const proposal_remove_evaluator_lambda = new NodejsFunction(this, "pms-proposal-remove-evaluator-lambda", {
      functionName: "pms-proposal-remove-evaluator-lambda",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "remove-evaluator.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

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

    const update_proposal_status_lambda = new NodejsFunction(this, "UpdateProposalStatusLambda", {
      functionName: "pms-update-proposal-status",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "update-proposal-status.ts"),
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

    const get_users_by_role_lambda = new NodejsFunction(this, "pms-get-users-by-role", {
      functionName: "pms-get-users-by-role",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "get-users-by-role.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

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

    const get_proposal_rnd_lambda = new NodejsFunction(this, "pms-get-propposal-rnd", {
      functionName: "pms-get-propposal-rnd",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "get-proposal-rnd.ts"),
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

    // Unified lookup Lambda — replaces 9 individual lookup lambdas
    // (agency, cooperating-agency, agency-addresses, department, discipline, sector, tag, priority, station)
    const get_lookup_lambda = new NodejsFunction(this, "pms-get-lookup", {
      functionName: "pms-get-lookup",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "get-lookup.ts"),
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
      },
    });

    const get_upload_url_lambda = new NodejsFunction(this, "pms-get-upload-url", {
      functionName: "pms-get-upload-url",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "get-upload-url.ts"),
      environment: {
        SUPABASE_KEY,
        PROPOSAL_BUCKET_NAME: `pms-proposal-attachments-bucket-${stageName}`,
      },
    });
    proposal_attachments_bucket.grantPut(get_upload_url_lambda);

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

    const handle_extension_request_lambda = new NodejsFunction(this, "pms-handle-extension-request", {
      functionName: "pms-handle-extension-request",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "handle-extension-request.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const get_assignment_tracker_lambda = new NodejsFunction(this, "pms-get-assignment-tracker", {
      functionName: "pms-get-assignment-tracker",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "proposal", "get-assignment-tracker.ts"),
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

    // PROJECT MEMBERS (CO-LEAD) LAMBDAS
    const invite_member_lambda = new NodejsFunction(this, "pms-invite-member", {
      functionName: "pms-invite-member",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "project", "invite-member.ts"),
      environment: {
        SUPABASE_KEY,
        SUPABASE_SERVICE_ROLE_KEY,
        FRONTEND_URL: "https://wmsu-spmams.vercel.app",
      },
    });

    const remove_member_lambda = new NodejsFunction(this, "pms-remove-member", {
      functionName: "pms-remove-member",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "project", "remove-member.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const get_project_members_lambda = new NodejsFunction(this, "pms-get-project-members", {
      functionName: "pms-get-project-members",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "project", "get-project-members.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const analyze_proposal_lambda = new NodejsFunction(this, "pms-analyze-proposal", {
      functionName: "pms-analyze-proposal",
      memorySize: 512, // Needed for PDF parsing + AI math (no TensorFlow, just JSON + for-loops)
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(60), // PDF text extraction + ~200 lines of matrix math can take time
      entry: path.resolve("src", "handlers", "proposal", "analyze-proposal.ts"),
      environment: {
        SUPABASE_KEY,
      },
      bundling: {
        // ⚠️ CRITICAL: Include JSON weight files (vocab, embedding, etc.)
        // Without these, ai-analyzer.service.ts will fail to load models → 502 error
        commandHooks: {
          beforeBundling(inputDir: string, outputDir: string): string[] {
            return [];
          },
          beforeInstall(inputDir: string, outputDir: string): string[] {
            return [];
          },
          afterBundling(inputDir: string, outputDir: string): string[] {
            // Copy ai-models/*.json to Lambda package (cross-platform)
            // These are JUST numbers in JSON (1.5MB total), NOT the TensorFlow framework
            if (process.platform === "win32") {
              return [`xcopy "${inputDir}\\src\\ai-models" "${outputDir}\\ai-models" /E /I /Y`];
            }
            return [`cp -r ${inputDir}/src/ai-models ${outputDir}/ai-models`];
          },
        },
      },
    });

    // ========== ADMIN ACCOUNT MANAGEMENT LAMBDAS ==========

    const admin_create_account_lambda = new NodejsFunction(this, "pms-admin-create-account", {
      functionName: "pms-admin-create-account",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "admin", "create-account.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const admin_get_accounts_lambda = new NodejsFunction(this, "pms-admin-get-accounts", {
      functionName: "pms-admin-get-accounts",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "admin", "get-accounts.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const admin_update_account_lambda = new NodejsFunction(this, "pms-admin-update-account", {
      functionName: "pms-admin-update-account",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "admin", "update-account.ts"),
      environment: {
        SUPABASE_KEY,
      },
    });

    const admin_invite_user_lambda = new NodejsFunction(this, "pms-admin-invite-user", {
      functionName: "pms-admin-invite-user",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "admin", "invite-user.ts"),
      environment: {
        SUPABASE_KEY,
        SUPABASE_SERVICE_ROLE_KEY,
        FRONTEND_URL,
      },
    });

    const complete_invite_lambda = new NodejsFunction(this, "pms-auth-complete-invite", {
      functionName: "pms-auth-complete-invite",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "auth", "complete-invite.ts"),
      environment: {
        SUPABASE_KEY,
        PROFILE_SETUP_BUCKET_NAME: `pms-profile-setup-bucket-${stageName}`,
      },
    });
    profile_setup_bucket.grantPut(complete_invite_lambda);

    const admin_toggle_account_status_lambda = new NodejsFunction(this, "pms-admin-toggle-account-status", {
      functionName: "pms-admin-toggle-account-status",
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
      entry: path.resolve("src", "handlers", "admin", "toggle-account-status.ts"),
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
        SUPABASE_KEY,
        SUPABASE_SECRET_JWT,
      },
    });

    const api = new RestApi(this, "pms-api-gateway", {
      restApiName: "pms-api-gateway",
      deployOptions: {
        stageName: "api",
      },
      binaryMediaTypes: ["multipart/form-data"],
      defaultCorsPreflightOptions: {
        allowOrigins: ["http://localhost:5173", "https://wmsu-spmams.vercel.app"],
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization", "Cookie"],
        allowCredentials: true,
      },
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

    // /auth/confirm-email (public — clicked from email link)
    const confirm_email = auth.addResource("confirm-email");
    confirm_email.addMethod(HttpMethod.GET, new LambdaIntegration(confirm_email_lambda));

    // /auth/departments (PUBLIC — for sign-up form to fetch R&D stations without auth)
    const auth_departments = auth.addResource("departments");
    auth_departments.addMethod(HttpMethod.GET, new LambdaIntegration(get_lookup_lambda));

    // /auth/complete-invite (protected — user has session from invite link)
    const complete_invite = auth.addResource("complete-invite");
    complete_invite.addMethod(HttpMethod.POST, new LambdaIntegration(complete_invite_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /auth/profile-setup
    const profile_setup = auth.addResource("profile-setup");
    profile_setup.addMethod(HttpMethod.POST, new LambdaIntegration(profile_setup_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /auth/profile-status
    const profile_status = auth.addResource("profile-status");
    profile_status.addMethod(HttpMethod.GET, new LambdaIntegration(profile_status_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /auth/change-password
    const change_password = auth.addResource("change-password");
    change_password.addMethod(HttpMethod.POST, new LambdaIntegration(change_password_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // ========== PROPOSAL ROUTES ==========
    // /proposal
    const proposal = api.root.addResource("proposal");

    // /proposal/create (protected)
    const create_proposal = proposal.addResource("create");
    create_proposal.addMethod(HttpMethod.POST, new LambdaIntegration(create_proposal_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/analyze (protected) - AI proposal analysis
    const analyze_proposal = proposal.addResource("analyze");
    analyze_proposal.addMethod(HttpMethod.POST, new LambdaIntegration(analyze_proposal_lambda), {
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

    // /proposal/evaluator (protected) - DELETE remove evaluator
    const proposal_remove_evaluator = proposal.addResource("evaluator");
    proposal_remove_evaluator.addMethod(HttpMethod.DELETE, new LambdaIntegration(proposal_remove_evaluator_lambda), {
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

    // /proposal/update-status (protected)
    const update_proposal_status = proposal.addResource("update-status");
    update_proposal_status.addMethod(HttpMethod.POST, new LambdaIntegration(update_proposal_status_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

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

    // /proposal/view-rnd (protected)
    const get_proposal_rnd = proposal.addResource("view-rnd");
    get_proposal_rnd.addMethod(HttpMethod.GET, new LambdaIntegration(get_proposal_rnd_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/view-evaluator (protected)
    const get_proposal_evaluator = proposal.addResource("view-evaluator");
    get_proposal_evaluator.addMethod(HttpMethod.GET, new LambdaIntegration(get_proposal_evaluator_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/view-proponent-proposal-stats
    const get_proponent_proposal_stats = proposal.addResource("view-proponent-proposal-stats");
    get_proponent_proposal_stats.addMethod(HttpMethod.GET, new LambdaIntegration(get_proponent_proposal_stats_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/view-rnd-proposal-stats
    const get_rnd_proposal_stats = proposal.addResource("view-rnd-proposal-stats");
    get_rnd_proposal_stats.addMethod(HttpMethod.GET, new LambdaIntegration(get_rnd_proposal_stats_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/view-evaluator-proposal-stats
    const get_evaluator_proposal_stats = proposal.addResource("view-evaluator-proposal-stats");
    get_evaluator_proposal_stats.addMethod(HttpMethod.GET, new LambdaIntegration(get_evaluator_proposal_stats_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/lookup/{type} — unified lookup route
    // Replaces: view-agency, view-cooperating-agency, view-agency-addresses,
    //           view-department, view-discipline, view-sector, view-tag, view-priority, view-station
    const lookup = proposal.addResource("lookup");
    const lookup_type = lookup.addResource("{type}");
    lookup_type.addMethod(HttpMethod.GET, new LambdaIntegration(get_lookup_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/view-users-by-role (protected)
    const get_users_by_role = proposal.addResource("view-users-by-role");
    get_users_by_role.addMethod(HttpMethod.GET, new LambdaIntegration(get_users_by_role_lambda), {
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
    get_proposals_for_endorsement.addMethod(
      HttpMethod.GET,
      new LambdaIntegration(get_proposals_for_endorsement_lambda),
      {
        authorizer: requestAuthorizer,
        authorizationType: AuthorizationType.CUSTOM,
      },
    );

    // /proposal/submit-revised (protected) - Proponent submits revised proposal
    const submit_revised_proposal = proposal.addResource("submit-revised");
    submit_revised_proposal.addMethod(HttpMethod.POST, new LambdaIntegration(submit_revised_proposal_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/upload-url (protected) - GET presigned S3 upload URL
    const upload_url_resource = proposal.addResource("upload-url");
    upload_url_resource.addMethod(HttpMethod.GET, new LambdaIntegration(get_upload_url_lambda), {
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

    // /proposal/handle-extension-request (protected) - RND approves/denies extension
    const handle_extension_request = proposal.addResource("handle-extension-request");
    handle_extension_request.addMethod(HttpMethod.POST, new LambdaIntegration(handle_extension_request_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /proposal/assignment-tracker (protected) - GET assignment tracker for a proposal
    const get_assignment_tracker = proposal.addResource("assignment-tracker");
    get_assignment_tracker.addMethod(HttpMethod.GET, new LambdaIntegration(get_assignment_tracker_lambda), {
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

    // /project/invite-member (protected) - POST invite a co-lead
    const invite_member = project.addResource("invite-member");
    invite_member.addMethod(HttpMethod.POST, new LambdaIntegration(invite_member_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /project/remove-member (protected) - POST remove a co-lead
    const remove_member = project.addResource("remove-member");
    remove_member.addMethod(HttpMethod.POST, new LambdaIntegration(remove_member_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /project/members (protected) - GET project members
    const project_members = project.addResource("members");
    project_members.addMethod(HttpMethod.GET, new LambdaIntegration(get_project_members_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // ========== ADMIN ACCOUNT MANAGEMENT ROUTES ==========

    // /admin
    const admin = api.root.addResource("admin");

    // /admin/create-account (protected) - POST create account
    const admin_create_account = admin.addResource("create-account");
    admin_create_account.addMethod(HttpMethod.POST, new LambdaIntegration(admin_create_account_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /admin/accounts (protected) - GET all accounts
    const admin_accounts = admin.addResource("accounts");
    admin_accounts.addMethod(HttpMethod.GET, new LambdaIntegration(admin_get_accounts_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /admin/update-account (protected) - POST update account
    const admin_update_account = admin.addResource("update-account");
    admin_update_account.addMethod(HttpMethod.POST, new LambdaIntegration(admin_update_account_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /admin/invite-user (protected) - POST send invitation email
    const admin_invite_user = admin.addResource("invite-user");
    admin_invite_user.addMethod(HttpMethod.POST, new LambdaIntegration(admin_invite_user_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });

    // /admin/toggle-account-status (protected) - POST toggle disable/enable
    const admin_toggle_account_status = admin.addResource("toggle-account-status");
    admin_toggle_account_status.addMethod(HttpMethod.POST, new LambdaIntegration(admin_toggle_account_status_lambda), {
      authorizer: requestAuthorizer,
      authorizationType: AuthorizationType.CUSTOM,
    });
  }
}
