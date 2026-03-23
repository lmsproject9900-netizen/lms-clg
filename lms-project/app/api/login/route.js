import { supabase } from "@/lib/supabase";
import { signToken } from "@/lib/jwt";

export async function POST(req) {
  const { usn, name } = await req.json();

  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("usn", usn)
    .eq("name", name)
    .single();

  if (error || !data) {
    return new Response(JSON.stringify({ error: "Invalid credentials" }), {
      status: 401,
    });
  }

  const token = signToken({ usn: data.usn });

  return new Response(
    JSON.stringify({
      message: "Login successful",
      token,
      student: data,
    }),
    { status: 200 }
  );
}