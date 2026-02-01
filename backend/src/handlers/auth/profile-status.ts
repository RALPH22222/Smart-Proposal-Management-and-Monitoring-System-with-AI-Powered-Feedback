import { supabase } from "../../lib/supabase";
import { buildCorsHeaders } from "../../utils/cors";
import { getAuthContext } from "../../utils/auth-context";

/**
 * GET /auth/profile-status
 * Check if user's profile is complete
 * Returns: { profileComplete: boolean, missingFields: string[] }
 */
export const handler = buildCorsHeaders(async (event) => {
       const auth = getAuthContext(event);

       if (!auth.userId) {
              return {
                     statusCode: 401,
                     body: JSON.stringify({ message: "Unauthorized" }),
              };
       }

       // Fetch user profile from database
       const { data: user, error } = await supabase
              .from("users")
              .select("birthdate, gender, rnd_station_id")
              .eq("id", auth.userId)
              .single();

       if (error) {
              console.error("Error fetching user profile:", error);
              return {
                     statusCode: 500,
                     body: JSON.stringify({ message: "Failed to fetch profile status" }),
              };
       }

       // Check required fields
       const missingFields: string[] = [];

       if (!user.birthdate) missingFields.push("birthdate");
       if (!user.gender) missingFields.push("gender");
       if (!user.rnd_station_id) missingFields.push("rnd_station");

       const profileComplete = missingFields.length === 0;

       return {
              statusCode: 200,
              body: JSON.stringify({
                     profileComplete,
                     missingFields,
                     userId: auth.userId,
              }),
       };
});
