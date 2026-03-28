import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Check if students table exists
    const { data: students, error: studentsError } = await supabase
      .from("students")
      .select("*")
      .limit(5);
    
    if (studentsError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: studentsError.message,
          hint: "Students table may not exist or RLS is blocking access"
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Check for specific student
    const { data: specificStudent, error: specificError } = await supabase
      .from("students")
      .select("*")
      .eq("usn", "3TS25AI043")
      .maybeSingle();
    
    return new Response(
      JSON.stringify({
        success: true,
        students_count: students.length,
        students: students,
        specific_student: specificStudent,
        specific_error: specificError
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}