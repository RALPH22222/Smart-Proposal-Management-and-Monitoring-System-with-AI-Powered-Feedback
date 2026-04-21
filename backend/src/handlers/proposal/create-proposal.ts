import { supabase } from "../../lib/supabase";
import { ProposalService } from "../../services/proposal.service";
import { proposalSchema, proposalVersionSchema } from "../../schemas/proposal-schema";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";
import { logActivity } from "../../utils/activity-logger";

export const handler = buildCorsHeaders(async (event) => {
  // Extract proponent identity from JWT
  const auth = getAuthContext(event);
  if (!auth.userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: "Unauthorized: User ID not found in token" }),
    };
  }

  // Parse JSON body. Return a clean 400 instead of crashing the handler when
  // a malformed / multipart / empty body sneaks through — otherwise a stale
  // browser tab or a misrouted request shows up as a generic 500 in the logs.
  let body: any;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (err) {
    console.warn("create-proposal: invalid JSON body", err);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Request body is not valid JSON" }),
    };
  }

  // Validate fields — inject proponent_id from JWT, not from body
  const validation = proposalSchema.safeParse({
    ...body,
    proponent_id: auth.userId,
  });
  if (!validation.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        type: "validation_error",
        data: validation.error.issues,
      }),
    };
  }

  const { file_url, work_plan_file_url, ...data } = validation.data;

  // Create Proposal (work_plan_file_url included in payload if provided)
  const proposalService = new ProposalService(supabase);
  const createPayload = work_plan_file_url ? { ...data, work_plan_file_url } : data;
  const { data: proposal, error: createError } = await proposalService.create(createPayload);

  if (createError || !proposal) {
    console.error("Error creating proposal", createError);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to create proposal",
      }),
    };
  }

  // Validate version entry (file_url already uploaded to S3 by browser)
  const validation_version = proposalVersionSchema.safeParse({
    proposal_id: proposal.id,
    file_url,
  });
  if (!validation_version.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        type: "validation_error",
        data: validation_version.error.issues,
      }),
    };
  }

  // Create Proposal Version
  const { error: versionError } = await proposalService.createVersion(validation_version.data);
  if (versionError) {
    console.error("Error creating proposal version:", versionError);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Proposal created but failed to save file version",
      }),
    };
  }

  await logActivity(supabase, {
    user_id: auth.userId,
    action: "proposal_created",
    category: "proposal",
    target_id: String(proposal.id),
    target_type: "proposal",
    details: { project_title: data.project_title },
  });

  // Notify admin users — proposal is pending and needs to be distributed to R&D
  try {
    const { data: admins } = await supabase
      .from("users")
      .select("id")
      .contains("roles", ["admin"]);

    if (admins && admins.length > 0) {
      const notifications = admins.map((admin) => ({
        user_id: admin.id,
        message: `A new proposal "${data.project_title}" has been submitted and is pending distribution to R&D.`,
        is_read: false,
        link: "proposals",
      }));
      await supabase.from("notifications").insert(notifications);
    }
  } catch (notifErr) {
    console.error("Notification failed (non-blocking):", notifErr);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Proposal submitted successfully",
    }),
  };
});
