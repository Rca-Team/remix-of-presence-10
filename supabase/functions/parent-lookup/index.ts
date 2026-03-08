import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { student_id, phone } = await req.json();

    if (!student_id || !phone) {
      return new Response(
        JSON.stringify({ error: "student_id and phone are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanId = String(student_id).trim().substring(0, 50).toLowerCase();
    const cleanPhone = String(phone).trim().replace(/[^0-9]/g, "").slice(-10);

    if (cleanPhone.length < 10) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find registered student matching ID + phone
    const { data: registered, error: regError } = await supabase
      .from("attendance_records")
      .select("id, image_url, category, device_info")
      .eq("status", "registered");

    if (regError) throw regError;

    const matched = (registered || []).find((r: any) => {
      const di = r.device_info as any;
      const meta = di?.metadata || di || {};
      const empId = String(meta.employee_id || meta.roll_number || "").toLowerCase();
      const parentPhone = String(meta.parent_phone || meta.parentPhone || "");
      const phoneLast10 = parentPhone.replace(/[^0-9]/g, "").slice(-10);
      return empId === cleanId && phoneLast10 === cleanPhone;
    });

    if (!matched) {
      return new Response(
        JSON.stringify({ found: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const di = matched.device_info as any;
    const meta = di?.metadata || di || {};

    // Get attendance records for this student (current month)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

    const { data: attendance } = await supabase
      .from("attendance_records")
      .select("status, timestamp, device_info")
      .in("status", ["present", "late"])
      .gte("timestamp", monthStart);

    const studentAttendance = (attendance || []).filter((r: any) => {
      const rdi = r.device_info as any;
      const empId = String(rdi?.employee_id || rdi?.metadata?.employee_id || rdi?.metadata?.roll_number || "").toLowerCase();
      return empId === cleanId;
    });

    return new Response(
      JSON.stringify({
        found: true,
        student: {
          id: matched.id,
          name: meta.name || meta.label || "Student",
          employee_id: meta.employee_id || meta.roll_number || "N/A",
          category: matched.category || "A",
          image_url: matched.image_url || "",
        },
        attendance: studentAttendance.map((r: any) => ({
          status: r.status,
          timestamp: r.timestamp,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
