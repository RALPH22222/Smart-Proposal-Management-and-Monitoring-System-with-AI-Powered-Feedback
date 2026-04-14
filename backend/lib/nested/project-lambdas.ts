import { NestedStack, Duration } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { IRole } from "aws-cdk-lib/aws-iam";
import { IBucket } from "aws-cdk-lib/aws-s3";
import path from "path";

interface ProjectLambdasProps {
  sharedRole: IRole;
  proposalBucket: IBucket;
  supabaseKey: string;
  supabaseServiceRoleKey: string;
  frontendUrl: string;
  smtpHost: string;
  smtpUser: string;
  smtpPass: string;
  stageName: string;
}

export class ProjectLambdas extends NestedStack {
  public readonly getFundedProjects: NodejsFunction;
  public readonly getProject: NodejsFunction;
  public readonly submitQuarterlyReport: NodejsFunction;
  public readonly getProjectReports: NodejsFunction;
  public readonly verifyProjectReport: NodejsFunction;
  public readonly addProjectExpense: NodejsFunction;
  public readonly getProjectExpenses: NodejsFunction;
  public readonly updateProjectStatus: NodejsFunction;
  public readonly getOverdueReports: NodejsFunction;
  public readonly inviteMember: NodejsFunction;
  public readonly removeMember: NodejsFunction;
  public readonly getProjectMembers: NodejsFunction;
  public readonly getPendingInvitations: NodejsFunction;
  public readonly respondToInvitation: NodejsFunction;
  public readonly createFundRequest: NodejsFunction;
  public readonly getFundRequests: NodejsFunction;
  public readonly reviewFundRequest: NodejsFunction;
  public readonly generateCertificate: NodejsFunction;
  public readonly getBudgetSummary: NodejsFunction;
  public readonly getReportUploadUrl: NodejsFunction;
  // Phase 3 of LIB feature: budget realignment workflow
  public readonly getBudgetVersion: NodejsFunction;
  public readonly requestRealignment: NodejsFunction;
  public readonly reviewRealignment: NodejsFunction;
  public readonly getRealignment: NodejsFunction;
  public readonly listRealignments: NodejsFunction;

  constructor(scope: Construct, id: string, props: ProjectLambdasProps) {
    super(scope, id);
    const { sharedRole, proposalBucket, supabaseKey, supabaseServiceRoleKey, frontendUrl, smtpHost, smtpUser, smtpPass, stageName } = props;

    const defaults = {
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
    };
    const sharedEnv = { SUPABASE_KEY: supabaseKey, SMTP_HOST: smtpHost, SMTP_USER: smtpUser, SMTP_PASS: smtpPass, TZ: "Asia/Manila" };

    const simple = (id: string, fnName: string, handler: string) =>
      new NodejsFunction(this, id, {
        ...defaults,
        functionName: fnName,
        entry: path.resolve("src", "handlers", "project", handler),
        role: sharedRole,
        environment: sharedEnv,
      });

    this.getFundedProjects = simple("get-funded-projects", "pms-get-funded-projects", "get-funded-projects.ts");
    this.getProject = simple("get-project", "pms-get-project", "get-project.ts");
    this.submitQuarterlyReport = simple("submit-quarterly-report", "pms-submit-quarterly-report", "submit-quarterly-report.ts");
    this.getProjectReports = simple("get-project-reports", "pms-get-project-reports", "get-project-reports.ts");
    this.verifyProjectReport = simple("verify-project-report", "pms-verify-project-report", "verify-project-report.ts");
    this.addProjectExpense = simple("add-project-expense", "pms-add-project-expense", "add-project-expense.ts");
    this.getProjectExpenses = simple("get-project-expenses", "pms-get-project-expenses", "get-project-expenses.ts");
    this.updateProjectStatus = simple("update-project-status", "pms-update-project-status", "update-project-status.ts");
    this.getOverdueReports = simple("get-overdue-reports", "pms-get-overdue-reports", "get-overdue-reports.ts");
    this.removeMember = simple("remove-member", "pms-remove-member", "remove-member.ts");
    this.getProjectMembers = simple("get-project-members", "pms-get-project-members", "get-project-members.ts");
    this.getPendingInvitations = simple("get-pending-invitations", "pms-get-pending-invitations", "get-pending-invitations.ts");
    this.respondToInvitation = simple("respond-to-invitation", "pms-respond-to-invitation", "respond-to-invitation.ts");
    this.createFundRequest = simple("create-fund-request", "pms-create-fund-request", "create-fund-request.ts");
    this.getFundRequests = simple("get-fund-requests", "pms-get-fund-requests", "get-fund-requests.ts");
    this.reviewFundRequest = simple("review-fund-request", "pms-review-fund-request", "review-fund-request.ts");
    this.generateCertificate = simple("generate-certificate", "pms-generate-certificate", "generate-certificate.ts");
    this.getBudgetSummary = simple("get-budget-summary", "pms-get-budget-summary", "get-budget-summary.ts");

    // Phase 3 of LIB feature: budget realignment workflow
    this.getBudgetVersion = simple("get-budget-version", "pms-get-budget-version", "get-budget-version.ts");
    this.requestRealignment = simple("request-realignment", "pms-request-realignment", "request-realignment.ts");
    this.reviewRealignment = simple("review-realignment", "pms-review-realignment", "review-realignment.ts");
    this.getRealignment = simple("get-realignment", "pms-get-realignment", "get-realignment.ts");
    this.listRealignments = simple("list-realignments", "pms-list-realignments", "list-realignments.ts");

    // Special: needs SUPABASE_SERVICE_ROLE_KEY, own role
    this.inviteMember = new NodejsFunction(this, "invite-member", {
      ...defaults,
      functionName: "pms-invite-member",
      entry: path.resolve("src", "handlers", "project", "invite-member.ts"),
      environment: {
        SUPABASE_KEY: supabaseKey,
        SUPABASE_SERVICE_ROLE_KEY: supabaseServiceRoleKey,
        FRONTEND_URL: frontendUrl,
        TZ: "Asia/Manila",
      },
    });

    // Special: needs S3 access, own role
    this.getReportUploadUrl = new NodejsFunction(this, "get-report-upload-url", {
      ...defaults,
      functionName: "pms-get-report-upload-url",
      entry: path.resolve("src", "handlers", "project", "get-report-upload-url.ts"),
      environment: {
        SUPABASE_KEY: supabaseKey,
        PROPOSAL_BUCKET_NAME: `pms-proposal-attachments-bucket-${stageName}`,
        TZ: "Asia/Manila",
      },
    });
    proposalBucket.grantPut(this.getReportUploadUrl);
  }
}
