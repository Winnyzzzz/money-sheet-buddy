import type { Config } from "@netlify/functions";
import { getSupabase } from "./supabase-client.mts";

export default async (req: Request) => {
  const supabase = getSupabase();
  const { rows } = await req.json();

  if (!Array.isArray(rows) || rows.length === 0) {
    return Response.json({ error: "No rows" }, { status: 400 });
  }

  const { error } = await supabase.from("transactions").insert(rows);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ count: rows.length });
};

export const config: Config = {
  path: "/api/transactions/batch",
  method: ["POST"],
};
