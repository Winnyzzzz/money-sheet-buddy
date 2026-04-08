import type { Config, Context } from "@netlify/functions";
import { getSupabase } from "./supabase-client.mts";

export default async (req: Request, context: Context) => {
  const supabase = getSupabase();
  const id = context.params.id;

  if (req.method === "PATCH") {
    const body = await req.json();
    const { error } = await supabase
      .from("transactions")
      .update(body)
      .eq("id", id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true });
  }

  if (req.method === "DELETE") {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ success: true });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
};

export const config: Config = {
  path: "/api/transactions/:id",
  method: ["PATCH", "DELETE"],
};
