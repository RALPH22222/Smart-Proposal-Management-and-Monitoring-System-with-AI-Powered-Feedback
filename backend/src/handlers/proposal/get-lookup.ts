import { APIGatewayProxyEvent } from "aws-lambda";
import { ProposalService } from "../../services/proposal.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";

const VALID_TYPES = [
  "agency",
  "cooperating-agency",
  "department",
  "discipline",
  "sector",
  "tag",
  "priority",
  "station",
  "agency-addresses",
] as const;

type LookupType = (typeof VALID_TYPES)[number];

export const handler = buildCorsHeaders(async (event: APIGatewayProxyEvent) => {
  // When called from /auth/departments (no {type} path param), default to "department"
  const type = (event.pathParameters?.type ?? "department") as LookupType;

  if (!VALID_TYPES.includes(type)) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: `Invalid lookup type: "${type}". Valid types: ${VALID_TYPES.join(", ")}`,
      }),
    };
  }

  const proposalService = new ProposalService(supabase);
  const search = event.queryStringParameters?.search ?? "";

  let data: any;
  let error: any;

  switch (type) {
    case "agency": {
      const result = await proposalService.getAgency(search);
      data = result.data;
      error = result.error;
      break;
    }
    case "cooperating-agency": {
      const result = await proposalService.getCooperatingAgency(search);
      data = result.data;
      error = result.error;
      break;
    }
    case "department":
    case "station": {
      // station is an alias for department
      const result = await proposalService.getDepartment(search);
      data = result.data;
      error = result.error;
      break;
    }
    case "discipline": {
      const result = await proposalService.getDiscipline(search);
      data = result.data;
      error = result.error;
      break;
    }
    case "sector": {
      const result = await proposalService.getSector(search);
      data = result.data;
      error = result.error;
      break;
    }
    case "tag": {
      const result = await proposalService.getTag(search);
      data = result.data;
      error = result.error;
      break;
    }
    case "priority": {
      // Priority queries supabase directly (no service method)
      let query = supabase.from("priorities").select("id, name");
      if (search) {
        query = query.ilike("name", `%${search}%`);
      }
      const result = await query;
      data = result.data || [];
      error = result.error;
      break;
    }
    case "agency-addresses": {
      const agency_id = event.queryStringParameters?.agency_id;
      if (!agency_id) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: "agency_id query parameter is required.",
          }),
        };
      }
      const parsedAgencyId = parseInt(agency_id, 10);
      if (isNaN(parsedAgencyId)) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: "agency_id must be a valid number.",
          }),
        };
      }
      const result = await proposalService.getAgencyAddresses(parsedAgencyId);
      data = result.data;
      error = result.error;
      break;
    }
  }

  if (error) {
    console.error("Supabase error: ", JSON.stringify(error, null, 2));
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error.",
      }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
});
