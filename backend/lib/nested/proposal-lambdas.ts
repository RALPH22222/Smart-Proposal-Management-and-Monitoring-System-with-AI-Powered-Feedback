import { NestedStack, Duration } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { IRole } from "aws-cdk-lib/aws-iam";
import { IBucket } from "aws-cdk-lib/aws-s3";
import path from "path";

interface ProposalLambdasProps {
  sharedRole: IRole;
  proposalBucket: IBucket;
  supabaseKey: string;
  geminiApiKey: string;
  smtpHost: string;
  smtpUser: string;
  smtpPass: string;
  stageName: string;
}

export class ProposalLambdas extends NestedStack {
  public readonly createProposal: NodejsFunction;
  public readonly forwardToEvaluators: NodejsFunction;
  public readonly removeEvaluator: NodejsFunction;
  public readonly forwardToRnd: NodejsFunction;
  public readonly revisionToProponent: NodejsFunction;
  public readonly rejectToProponent: NodejsFunction;
  public readonly decisionEvaluator: NodejsFunction;
  public readonly updateStatus: NodejsFunction;
  public readonly createEvalScores: NodejsFunction;
  public readonly getEvalScores: NodejsFunction;
  public readonly getUsersByRole: NodejsFunction;
  public readonly getProposal: NodejsFunction;
  public readonly getProponentStats: NodejsFunction;
  public readonly getRndStats: NodejsFunction;
  public readonly getEvaluatorStats: NodejsFunction;
  public readonly getProposalRnd: NodejsFunction;
  public readonly getProposalEvaluator: NodejsFunction;
  public readonly getLookup: NodejsFunction;
  public readonly endorseForFunding: NodejsFunction;
  public readonly getProposalsForEndorsement: NodejsFunction;
  public readonly submitRevised: NodejsFunction;
  public readonly getUploadUrl: NodejsFunction;
  public readonly getRevisionSummary: NodejsFunction;
  public readonly getRejectionSummary: NodejsFunction;
  public readonly getProposalVersions: NodejsFunction;
  public readonly handleExtensionRequest: NodejsFunction;
  public readonly getAssignmentTracker: NodejsFunction;
  public readonly analyzeProposal: NodejsFunction;
  public readonly generateTags: NodejsFunction;
  public readonly requestProponentExtension: NodejsFunction;
  public readonly reviewProponentExtension: NodejsFunction;
  public readonly getProponentExtensionRequests: NodejsFunction;

  constructor(scope: Construct, id: string, props: ProposalLambdasProps) {
    super(scope, id);
    const { sharedRole, proposalBucket, supabaseKey, geminiApiKey, smtpHost, smtpUser, smtpPass, stageName } = props;

    const defaults = {
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
    };
    const sharedEnv = { SUPABASE_KEY: supabaseKey, SMTP_HOST: smtpHost, SMTP_USER: smtpUser, SMTP_PASS: smtpPass };

    // Helper for the common case: shared role + SUPABASE_KEY only
    const simple = (id: string, fnName: string, handler: string) =>
      new NodejsFunction(this, id, {
        ...defaults,
        functionName: fnName,
        entry: path.resolve("src", "handlers", "proposal", handler),
        role: sharedRole,
        environment: sharedEnv,
      });

    this.createProposal = simple("create-proposal", "pms-create-proposal", "create-proposal.ts");
    this.forwardToEvaluators = simple("forward-to-evaluators", "pms-forward-to-evaluators", "forward-proposal-to-evaluators.ts");
    this.removeEvaluator = simple("remove-evaluator", "pms-remove-evaluator", "remove-evaluator.ts");
    this.forwardToRnd = simple("forward-to-rnd", "pms-forward-to-rnd", "forward-proposal-to-rnd.ts");
    this.revisionToProponent = simple("revision-to-proponent", "pms-revision-to-proponent", "revision-proposal-to-proponent.ts");
    this.rejectToProponent = simple("reject-to-proponent", "pms-reject-to-proponent", "reject-proposal-to-proponent.ts");
    this.decisionEvaluator = simple("decision-evaluator", "pms-decision-evaluator", "decision-evaluator-to-proposal.ts");
    this.updateStatus = simple("update-status", "pms-update-proposal-status", "update-proposal-status.ts");
    this.createEvalScores = simple("create-eval-scores", "pms-create-eval-scores", "create-evaluation-scores-to-proposal.ts");
    this.getEvalScores = simple("get-eval-scores", "pms-get-eval-scores", "get-evaluation-scores-from-proposal.ts");
    this.getUsersByRole = simple("get-users-by-role", "pms-get-users-by-role", "get-users-by-role.ts");
    this.getProposal = simple("get-proposal", "pms-get-proposal", "get-proposal.ts");
    this.getProponentStats = simple("get-proponent-stats", "pms-get-proponent-proposal-stats", "get-proponent-proposal-stats.ts");
    this.getRndStats = simple("get-rnd-stats", "pms-get-rnd-proposal-stats", "get-rnd-proposal-stats.ts");
    this.getEvaluatorStats = simple("get-evaluator-stats", "pms-get-evaluator-proposal-stats", "get-evaluator-proposal-stats.ts");
    this.getProposalRnd = simple("get-proposal-rnd", "pms-get-proposal-rnd", "get-proposal-rnd.ts");
    this.getProposalEvaluator = simple("get-proposal-evaluator", "pms-get-proposal-evaluator", "get-proposal-evaluator.ts");
    this.getLookup = simple("get-lookup", "pms-get-lookup", "get-lookup.ts");
    this.endorseForFunding = simple("endorse-for-funding", "pms-endorse-for-funding", "endorse-for-funding.ts");
    this.getProposalsForEndorsement = simple("get-proposals-for-endorsement", "pms-get-proposals-for-endorsement", "get-proposals-for-endorsement.ts");
    this.submitRevised = simple("submit-revised", "pms-submit-revised-proposal", "submit-revised-proposal.ts");
    this.getRevisionSummary = simple("get-revision-summary", "pms-get-revision-summary", "get-revision-summary.ts");
    this.getRejectionSummary = simple("get-rejection-summary", "pms-get-rejection-summary", "get-rejection-summary.ts");
    this.getProposalVersions = simple("get-proposal-versions", "pms-get-proposal-versions", "get-proposal-versions.ts");
    this.handleExtensionRequest = simple("handle-extension-request", "pms-handle-extension-request", "handle-extension-request.ts");
    this.getAssignmentTracker = simple("get-assignment-tracker", "pms-get-assignment-tracker", "get-assignment-tracker.ts");
    this.requestProponentExtension = simple("request-proponent-extension", "pms-request-proponent-extension", "request-proponent-extension.ts");
    this.reviewProponentExtension = simple("review-proponent-extension", "pms-review-proponent-extension", "review-proponent-extension.ts");
    this.getProponentExtensionRequests = simple("get-proponent-extension-requests", "pms-get-proponent-extension-requests", "get-proponent-extension-requests.ts");

    // Special: needs S3 access, own role
    this.getUploadUrl = new NodejsFunction(this, "get-upload-url", {
      ...defaults,
      functionName: "pms-get-upload-url",
      entry: path.resolve("src", "handlers", "proposal", "get-upload-url.ts"),
      environment: {
        SUPABASE_KEY: supabaseKey,
        PROPOSAL_BUCKET_NAME: `pms-proposal-attachments-bucket-${stageName}`,
      },
    });
    proposalBucket.grantPut(this.getUploadUrl);

    // Special: larger memory + timeout + bundling for AI analysis
    this.analyzeProposal = new NodejsFunction(this, "analyze-proposal", {
      ...defaults,
      functionName: "pms-analyze-proposal",
      memorySize: 512,
      timeout: Duration.seconds(60),
      entry: path.resolve("src", "handlers", "proposal", "analyze-proposal.ts"),
      role: sharedRole,
      environment: sharedEnv,
      bundling: {
        commandHooks: {
          beforeBundling(_inputDir: string, _outputDir: string): string[] {
            return [];
          },
          beforeInstall(_inputDir: string, _outputDir: string): string[] {
            return [];
          },
          afterBundling(inputDir: string, outputDir: string): string[] {
            if (process.platform === "win32") {
              return [`xcopy "${inputDir}\\src\\ai-models" "${outputDir}\\ai-models" /E /I /Y`];
            }
            return [`cp -r ${inputDir}/src/ai-models ${outputDir}/ai-models`];
          },
        },
      },
    });

    // Special: needs Gemini API key
    this.generateTags = new NodejsFunction(this, "generate-tags", {
      ...defaults,
      functionName: "pms-generate-tags",
      timeout: Duration.seconds(30),
      entry: path.resolve("src", "handlers", "proposal", "generate-tags.ts"),
      role: sharedRole,
      environment: { SUPABASE_KEY: supabaseKey, GEMINI_API_KEY: geminiApiKey },
    });
  }
}
