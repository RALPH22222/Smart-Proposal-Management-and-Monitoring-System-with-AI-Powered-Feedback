import { NestedStack, Duration } from "aws-cdk-lib";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { IRole } from "aws-cdk-lib/aws-iam";
import path from "path";

interface AdminLambdasProps {
  sharedRole: IRole;
  supabaseKey: string;
  supabaseSecretJwt: string;
  supabaseServiceRoleKey: string;
  frontendUrl: string;
}

export class AdminLambdas extends NestedStack {
  public readonly getContacts: NodejsFunction;
  public readonly updateContacts: NodejsFunction;
  public readonly createAccount: NodejsFunction;
  public readonly getAccounts: NodejsFunction;
  public readonly updateAccount: NodejsFunction;
  public readonly inviteUser: NodejsFunction;
  public readonly toggleAccountStatus: NodejsFunction;
  public readonly getDashboardStats: NodejsFunction;
  public readonly getActivityLogs: NodejsFunction;
  public readonly getLateSubmissionPolicy: NodejsFunction;
  public readonly updateLateSubmissionPolicy: NodejsFunction;
  public readonly getNotifications: NodejsFunction;
  public readonly markNotificationRead: NodejsFunction;
  public readonly getNotificationPreferences: NodejsFunction;
  public readonly updateNotificationPreferences: NodejsFunction;
  public readonly updateAvailability: NodejsFunction;
  public readonly getEvaluationDeadline: NodejsFunction;
  public readonly updateEvaluationDeadline: NodejsFunction;

  constructor(scope: Construct, id: string, props: AdminLambdasProps) {
    super(scope, id);
    const { sharedRole, supabaseKey, supabaseSecretJwt, supabaseServiceRoleKey, frontendUrl } = props;

    const defaults = {
      memorySize: 128,
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.seconds(10),
    };
    const sharedEnv = { SUPABASE_KEY: supabaseKey };

    // Public endpoint — own role (no shared role assigned in original)
    this.getContacts = new NodejsFunction(this, "get-contacts", {
      ...defaults,
      functionName: "pms-get-contacts",
      entry: path.resolve("src", "handlers", "public", "get-contacts.ts"),
      environment: sharedEnv,
    });

    this.updateContacts = new NodejsFunction(this, "update-contacts", {
      ...defaults,
      functionName: "pms-update-contacts",
      entry: path.resolve("src", "handlers", "admin", "update-contacts.ts"),
      role: sharedRole,
      environment: { 
        SUPABASE_KEY: supabaseKey, 
        SUPABASE_SECRET_JWT: supabaseSecretJwt,
        SUPABASE_SERVICE_ROLE_KEY: supabaseServiceRoleKey
      },
    });

    this.createAccount = new NodejsFunction(this, "create-account", {
      ...defaults,
      functionName: "pms-admin-create-account",
      entry: path.resolve("src", "handlers", "admin", "create-account.ts"),
      role: sharedRole,
      environment: sharedEnv,
    });

    this.getAccounts = new NodejsFunction(this, "get-accounts", {
      ...defaults,
      functionName: "pms-admin-get-accounts",
      entry: path.resolve("src", "handlers", "admin", "get-accounts.ts"),
      role: sharedRole,
      environment: sharedEnv,
    });

    this.updateAccount = new NodejsFunction(this, "update-account", {
      ...defaults,
      functionName: "pms-admin-update-account",
      entry: path.resolve("src", "handlers", "admin", "update-account.ts"),
      role: sharedRole,
      environment: sharedEnv,
    });

    this.inviteUser = new NodejsFunction(this, "invite-user", {
      ...defaults,
      functionName: "pms-admin-invite-user",
      entry: path.resolve("src", "handlers", "admin", "invite-user.ts"),
      role: sharedRole,
      environment: {
        SUPABASE_KEY: supabaseKey,
        SUPABASE_SERVICE_ROLE_KEY: supabaseServiceRoleKey,
        FRONTEND_URL: frontendUrl,
      },
    });

    this.toggleAccountStatus = new NodejsFunction(this, "toggle-account-status", {
      ...defaults,
      functionName: "pms-admin-toggle-account-status",
      entry: path.resolve("src", "handlers", "admin", "toggle-account-status.ts"),
      role: sharedRole,
      environment: sharedEnv,
    });

    this.getDashboardStats = new NodejsFunction(this, "get-dashboard-stats", {
      ...defaults,
      functionName: "pms-admin-get-dashboard-stats",
      entry: path.resolve("src", "handlers", "admin", "get-dashboard-stats.ts"),
      role: sharedRole,
      environment: sharedEnv,
    });

    this.getActivityLogs = new NodejsFunction(this, "get-activity-logs", {
      ...defaults,
      functionName: "pms-admin-get-activity-logs",
      entry: path.resolve("src", "handlers", "admin", "get-activity-logs.ts"),
      role: sharedRole,
      environment: sharedEnv,
    });

    this.getLateSubmissionPolicy = new NodejsFunction(this, "get-late-submission-policy", {
      ...defaults,
      functionName: "pms-get-late-submission-policy",
      entry: path.resolve("src", "handlers", "admin", "get-late-submission-policy.ts"),
      role: sharedRole,
      environment: sharedEnv,
    });

    this.updateLateSubmissionPolicy = new NodejsFunction(this, "update-late-submission-policy", {
      ...defaults,
      functionName: "pms-update-late-submission-policy",
      entry: path.resolve("src", "handlers", "admin", "update-late-submission-policy.ts"),
      role: sharedRole,
      environment: sharedEnv,
    });

    this.getNotifications = new NodejsFunction(this, "get-notifications", {
      ...defaults,
      functionName: "pms-get-notifications",
      entry: path.resolve("src", "handlers", "admin", "get-notifications.ts"),
      role: sharedRole,
      environment: sharedEnv,
    });

    this.markNotificationRead = new NodejsFunction(this, "mark-notification-read", {
      ...defaults,
      functionName: "pms-mark-notification-read",
      entry: path.resolve("src", "handlers", "admin", "mark-notification-read.ts"),
      role: sharedRole,
      environment: sharedEnv,
    });

    this.getNotificationPreferences = new NodejsFunction(this, "get-notification-preferences", {
      ...defaults,
      functionName: "pms-get-notification-preferences",
      entry: path.resolve("src", "handlers", "admin", "get-notification-preferences.ts"),
      role: sharedRole,
      environment: sharedEnv,
    });

    this.updateNotificationPreferences = new NodejsFunction(this, "update-notification-preferences", {
      ...defaults,
      functionName: "pms-update-notification-preferences",
      entry: path.resolve("src", "handlers", "admin", "update-notification-preferences.ts"),
      role: sharedRole,
      environment: sharedEnv,
    });

    this.updateAvailability = new NodejsFunction(this, "update-availability", {
      ...defaults,
      functionName: "pms-update-availability",
      entry: path.resolve("src", "handlers", "admin", "update-availability.ts"),
      role: sharedRole,
      environment: sharedEnv,
    });

    this.getEvaluationDeadline = new NodejsFunction(this, "get-evaluation-deadline", {
      ...defaults,
      functionName: "pms-get-evaluation-deadline",
      entry: path.resolve("src", "handlers", "admin", "get-evaluation-deadline.ts"),
      role: sharedRole,
      environment: sharedEnv,
    });

    this.updateEvaluationDeadline = new NodejsFunction(this, "update-evaluation-deadline", {
      ...defaults,
      functionName: "pms-update-evaluation-deadline",
      entry: path.resolve("src", "handlers", "admin", "update-evaluation-deadline.ts"),
      role: sharedRole,
      environment: sharedEnv,
    });
  }
}
