import { verifyToken } from "@/lib/jwt";
import { supabase } from "@/lib/supabase";

export async function GET(req) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return new Response(JSON.stringify({ error: "No token" }), {
      status: 401,
    });
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
    });
  }

  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("usn", decoded.usn)
    .single();

  return new Response(JSON.stringify(data), { status: 200 });
}