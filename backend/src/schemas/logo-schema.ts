import { z } from "zod";

export const LogosSchema = z.object({
  wmsu_logo: z.string().url("Must be a valid URL"),
  rdec_logo: z.string().url("Must be a valid URL"),
});

export type LogosInfo = z.infer<typeof LogosSchema>;

export const DEFAULT_LOGOS: LogosInfo = {
  wmsu_logo: "https://ilutdlvlhjpxsyvedyxf.supabase.co/storage/v1/object/public/system-assets/WMSU.png",
  rdec_logo: "https://ilutdlvlhjpxsyvedyxf.supabase.co/storage/v1/object/public/system-assets/RDEC-WMSU.png",
};
