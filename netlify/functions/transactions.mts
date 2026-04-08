import type { Config, Context } from "@netlify/functions";
import { getSupabase } from "./supabase-client.mts";

export default async (req: Request, context: Context) => {
  const supabase = getSupabase();

  if (req.method === "GET") {
    const url = new URL(req.url);
    const start = url.searchParams.get("start");
    const end = url.searchParams.get("end");

    let query = supabase
      .from("transactions")
      .select("id, date, type, category, description, amount")
      .order("date", { ascending: false });

    if (start) query = query.gte("date", start);
    if (end) query = query.lt("date", end);

    const { data, error } = await query;
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json((data || []).map((r: any) => ({ ...r, amount: Number(r.amount) })));
  }

  if (req.method === "POST") {
    const { date, type, category, description, amount } = await req.json();
    const { data, error } = await supabase
      .from("transactions")
      .insert({ date, type, category, description, amount })
      .select("id, date, type, category, description, amount")
      .single();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ...data, amount: Number(data.amount) });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
};

export const config: Config = {
  path: "/api/transactions",
  method: ["GET", "POST"],
};
