import { APIGatewayProxyEvent } from "aws-lambda";
import { ProposalService } from "../../services/proposal.service";
import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";

export const handler = buildCorsHeaders(async (_event: APIGatewayProxyEvent) => {
  const proposalService = new ProposalService(supabase);

  const [agencies, departments, disciplines, sectors, tags, priorities, stations] =
    await Promise.all([
      proposalService.getAgency(""),
      proposalService.getDepartment(""),
      proposalService.getDiscipline(""),
      proposalService.getSector(""),
      proposalService.getTag(""),
      supabase.from("priorities").select("id, name"),
      proposalService.getDepartment(""), // station is alias for department
    ]);

  const error =
    agencies.error || departments.error || disciplines.error ||
    sectors.error || tags.error || priorities.error || stations.error;

  if (error) {
    console.error("Lookup batch error:", JSON.stringify(error, null, 2));
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error." }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      agencies: agencies.data || [],
      departments: departments.data || [],
      disciplines: disciplines.data || [],
      sectors: sectors.data || [],
      tags: tags.data || [],
      priorities: priorities.data || [],
      stations: stations.data || [],
    }),
    headers: {
      "Cache-Control": "public, max-age=300", // 5 minutes — lookup data rarely changes
    },
  };
});
