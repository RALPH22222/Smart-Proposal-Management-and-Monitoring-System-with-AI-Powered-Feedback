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

  // Parse JSON body
  const body = JSON.parse(event.body || "{}");

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

  const { file_url, ...data } = validation.data;

  // Create Proposal
  const proposalService = new ProposalService(supabase);
  const { data: proposal, error: createError } = await proposalService.create(data);

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
  await proposalService.createVersion(validation_version.data);

  await logActivity(supabase, {
    user_id: auth.userId,
    action: "proposal_created",
    category: "proposal",
    target_id: String(proposal.id),
    target_type: "proposal",
    details: { project_title: data.project_title },
  });

  // Notify admin users about new proposal submission (fire-and-forget)
  try {
    const { data: admins } = await supabase
      .from("users")
      .select("id")
      .contains("roles", ["admin"]);

    if (admins && admins.length > 0) {
      const notifications = admins.map((admin) => ({
        user_id: admin.id,
        message: `A new proposal "${data.project_title}" has been submitted and is awaiting routing to R&D.`,
        is_read: false,
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
