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
  public readonly addReportComment: NodejsFunction;
  public readonly getReportComments: NodejsFunction;
  public readonly addProjectExpense: NodejsFunction;
  public readonly getProjectExpenses: NodejsFunction;
  public readonly updateProjectStatus: NodejsFunction;
  public readonly getOverdueReports: NodejsFunction;
  public readonly inviteMember: NodejsFunction;
  public readonly removeMember: NodejsFunction;
  public readonly getProjectMembers: NodejsFunction;
  public readonly createFundRequest: NodejsFunction;
  public readonly getFundRequests: NodejsFunction;
  public readonly reviewFundRequest: NodejsFunction;
  public readonly generateCertificate: NodejsFunction;
  public readonly getBudgetSummary: NodejsFunction;
  public readonly getReportUploadUrl: NodejsFunction;

  constructor(scope: Construct, id: string, props: ProjectLambdasProps) {
    super(scope, id);
    const { sharedRole, proposalBucket, supabaseKey, supabaseServiceRoleKey, frontendUrl, smtpHost, smtpUser, smtpPass, stageName } = props;

    const defaults = {
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
    };
    const sharedEnv = { SUPABASE_KEY: supabaseKey, SMTP_HOST: smtpHost, SMTP_USER: smtpUser, SMTP_PASS: smtpPass };

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
    this.addReportComment = simple("add-report-comment", "pms-add-report-comment", "add-report-comment.ts");
    this.getReportComments = simple("get-report-comments", "pms-get-report-comments", "get-report-comments.ts");
    this.addProjectExpense = simple("add-project-expense", "pms-add-project-expense", "add-project-expense.ts");
    this.getProjectExpenses = simple("get-project-expenses", "pms-get-project-expenses", "get-project-expenses.ts");
    this.updateProjectStatus = simple("update-project-status", "pms-update-project-status", "update-project-status.ts");
    this.getOverdueReports = simple("get-overdue-reports", "pms-get-overdue-reports", "get-overdue-reports.ts");
    this.removeMember = simple("remove-member", "pms-remove-member", "remove-member.ts");
    this.getProjectMembers = simple("get-project-members", "pms-get-project-members", "get-project-members.ts");
    this.createFundRequest = simple("create-fund-request", "pms-create-fund-request", "create-fund-request.ts");
    this.getFundRequests = simple("get-fund-requests", "pms-get-fund-requests", "get-fund-requests.ts");
    this.reviewFundRequest = simple("review-fund-request", "pms-review-fund-request", "review-fund-request.ts");
    this.generateCertificate = simple("generate-certificate", "pms-generate-certificate", "generate-certificate.ts");
    this.getBudgetSummary = simple("get-budget-summary", "pms-get-budget-summary", "get-budget-summary.ts");

    // Special: needs SUPABASE_SERVICE_ROLE_KEY, own role
    this.inviteMember = new NodejsFunction(this, "invite-member", {
      ...defaults,
      functionName: "pms-invite-member",
      entry: path.resolve("src", "handlers", "project", "invite-member.ts"),
      environment: {
        SUPABASE_KEY: supabaseKey,
        SUPABASE_SERVICE_ROLE_KEY: supabaseServiceRoleKey,
        FRONTEND_URL: frontendUrl,
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
      },
    });
    proposalBucket.grantPut(this.getReportUploadUrl);
  }
}
