import { NestedStack, Duration } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { IRole } from "aws-cdk-lib/aws-iam";
import { IBucket } from "aws-cdk-lib/aws-s3";
import { Rule, Schedule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import path from "path";

interface ProposalLambdasProps {
  sharedRole: IRole;
  proposalBucket: IBucket;
  supabaseKey: string;
  geminiApiKey: string;
  smtpHost: string;
  smtpUser: string;
  smtpPass: string;
  orsApiKey: string;
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
  public readonly getAllLookups: NodejsFunction;
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
  public readonly requestRndTransfer: NodejsFunction;
  public readonly respondRndTransfer: NodejsFunction;
  public readonly approveRndTransfer: NodejsFunction;
  public readonly getRndTransfers: NodejsFunction;
  public readonly checkEvaluatorDeadlines: NodejsFunction;
  public readonly reverseGeocode: NodejsFunction;

  constructor(scope: Construct, id: string, props: ProposalLambdasProps) {
    super(scope, id);
    const { sharedRole, proposalBucket, supabaseKey, geminiApiKey, orsApiKey, smtpHost, smtpUser, smtpPass, stageName } = props;

    const defaults = {
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
    };
    const sharedEnv = { SUPABASE_KEY: supabaseKey, SMTP_HOST: smtpHost, SMTP_USER: smtpUser, SMTP_PASS: smtpPass, TZ: "Asia/Manila" };

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
    this.getAllLookups = simple("get-all-lookups", "pms-get-all-lookups", "get-all-lookups.ts");
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
    this.requestRndTransfer = simple("request-rnd-transfer", "pms-request-rnd-transfer", "request-rnd-transfer.ts");
    this.respondRndTransfer = simple("respond-rnd-transfer", "pms-respond-rnd-transfer", "respond-rnd-transfer.ts");
    this.approveRndTransfer = simple("approve-rnd-transfer", "pms-approve-rnd-transfer", "approve-rnd-transfer.ts");
    this.getRndTransfers = simple("get-rnd-transfers", "pms-get-rnd-transfers", "get-rnd-transfers.ts");
    this.reverseGeocode = new NodejsFunction(this, "reverse-geocode", {
      ...defaults,
      functionName: "pms-reverse-geocode",
      entry: path.resolve("src", "handlers", "proposal", "reverse-geocode.ts"),
      role: sharedRole,
      environment: { ORS_API_KEY: orsApiKey, TZ: "Asia/Manila" },
    });

    // Special: needs S3 access, own role
    this.getUploadUrl = new NodejsFunction(this, "get-upload-url", {
      ...defaults,
      functionName: "pms-get-upload-url",
      entry: path.resolve("src", "handlers", "proposal", "get-upload-url.ts"),
      environment: {
        SUPABASE_KEY: supabaseKey,
        PROPOSAL_BUCKET_NAME: `pms-proposal-attachments-bucket-${stageName}`,
        TZ: "Asia/Manila",
      },
    });
    proposalBucket.grantPut(this.getUploadUrl);

    // Special: AI analysis with local SentenceTransformer (WASM via onnxruntime-web).
    // We strip onnxruntime-node (211MB native binaries) and sharp (21MB), then replace
    // onnxruntime-node with a tiny shim that re-exports onnxruntime-web (WASM).
    // transformers.node.mjs has a static `import ... from "onnxruntime-node"` that MUST
    // resolve — just deleting the package causes ERR_MODULE_NOT_FOUND at load time.
    // Final package: ~165MB (under 250MB Lambda limit).
    this.analyzeProposal = new NodejsFunction(this, "analyze-proposal", {
      ...defaults,
      functionName: "pms-analyze-proposal",
      memorySize: 1024,
      timeout: Duration.seconds(120),
      entry: path.resolve("src", "handlers", "proposal", "analyze-proposal.ts"),
      role: sharedRole,
      environment: sharedEnv,
      bundling: {
        nodeModules: ["@huggingface/transformers"],
        commandHooks: {
          beforeBundling(_inputDir: string, _outputDir: string): string[] {
            return [];
          },
          beforeInstall(_inputDir: string, _outputDir: string): string[] {
            return [];
          },
            afterBundling(inputDir: string, outputDir: string): string[] {
            if (process.platform === "win32") {
              return [
                `xcopy "${inputDir}\\src\\ai-models" "${outputDir}\\ai-models" /E /I /Y`,
                // Replace onnxruntime-node with shim → onnxruntime-web (WASM)
                `if exist "${outputDir}\\node_modules\\onnxruntime-node" rmdir /S /Q "${outputDir}\\node_modules\\onnxruntime-node"`,
                `xcopy "${inputDir}\\src\\onnxruntime-shim" "${outputDir}\\node_modules\\onnxruntime-node" /E /I /Y`,
                // Replace sharp with no-op shim (not used — text/NLP only)
                `if exist "${outputDir}\\node_modules\\sharp" rmdir /S /Q "${outputDir}\\node_modules\\sharp"`,
                `xcopy "${inputDir}\\src\\sharp-shim" "${outputDir}\\node_modules\\sharp" /E /I /Y`,
                `if exist "${outputDir}\\node_modules\\@img" rmdir /S /Q "${outputDir}\\node_modules\\@img"`,
              ];
            }
            return [
              `cp -r ${inputDir}/src/ai-models ${outputDir}/ai-models`,
              // Replace onnxruntime-node with shim → onnxruntime-web (WASM)
              `rm -rf ${outputDir}/node_modules/onnxruntime-node || true`,
              `cp -r ${inputDir}/src/onnxruntime-shim ${outputDir}/node_modules/onnxruntime-node`,
              // Replace sharp with no-op shim (not used — text/NLP only)
              `rm -rf ${outputDir}/node_modules/sharp || true`,
              `cp -r ${inputDir}/src/sharp-shim ${outputDir}/node_modules/sharp`,
              `rm -rf ${outputDir}/node_modules/@img || true`,
            ];
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
      environment: { SUPABASE_KEY: supabaseKey, GEMINI_API_KEY: geminiApiKey, TZ: "Asia/Manila" },
    });

    // Scheduled: daily check for overdue evaluator deadlines
    this.checkEvaluatorDeadlines = new NodejsFunction(this, "check-evaluator-deadlines", {
      ...defaults,
      functionName: "pms-check-evaluator-deadlines",
      timeout: Duration.seconds(30),
      entry: path.resolve("src", "handlers", "proposal", "check-evaluator-deadlines.ts"),
      role: sharedRole,
      environment: sharedEnv,
    });

    new Rule(this, "check-evaluator-deadlines-rule", {
      ruleName: "pms-check-evaluator-deadlines-daily",
      schedule: Schedule.cron({
        minute: "0",
        hour: "16", // 16:00 UTC = 12:00 AM PH time (UTC+8)
      }),
      targets: [new LambdaFunction(this.checkEvaluatorDeadlines)],
    });
  }
}
