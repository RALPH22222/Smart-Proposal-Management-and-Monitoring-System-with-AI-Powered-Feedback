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

  // Auto-routing: try to assign to least-loaded RND in the same department
  let autoRouted = false;
  try {
    const departmentId = proposal.department_id;
    if (departmentId) {
      const { data: rnd } = await proposalService.getLeastLoadedRnd(departmentId);
      if (rnd) {
        await proposalService.forwardToRnd({ proposal_id: proposal.id, rnd_id: [rnd.id] });
        autoRouted = true;

        await logActivity(supabase, {
          user_id: rnd.id,
          action: "proposal_auto_routed_to_rnd",
          category: "proposal",
          target_id: String(proposal.id),
          target_type: "proposal",
          details: { project_title: data.project_title, rnd_load: rnd.load },
        });

        // Notify the assigned RND
        await supabase.from("notifications").insert({
          user_id: rnd.id,
          message: `A new proposal "${data.project_title}" has been auto-assigned to you for review.`,
          is_read: false,
        });
      }
    }
  } catch (routeErr) {
    console.error("Auto-routing failed (falling back to admin):", routeErr);
  }

  // Notify admin users (always for visibility; if not auto-routed, they need to manually assign)
  try {
    const { data: admins } = await supabase
      .from("users")
      .select("id")
      .contains("roles", ["admin"]);

    if (admins && admins.length > 0) {
      const msg = autoRouted
        ? `A new proposal "${data.project_title}" has been submitted and auto-assigned to R&D.`
        : `A new proposal "${data.project_title}" has been submitted and is awaiting manual routing to R&D.`;
      const notifications = admins.map((admin) => ({
        user_id: admin.id,
        message: msg,
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
      message: autoRouted
        ? "Proposal submitted and auto-assigned to R&D successfully"
        : "Proposal submitted successfully",
      auto_routed: autoRouted,
    }),
  };
});
