import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { studentId, month, year } = await req.json();

    // Get student profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", studentId)
      .single();

    // Get attendance records for the month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = month === 12 
      ? `${year + 1}-01-01` 
      : `${year}-${String(month + 1).padStart(2, '0')}-01`;

    const { data: records } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("user_id", studentId)
      .gte("timestamp", startDate)
      .lt("timestamp", endDate)
      .order("timestamp");

    // Get wellness scores
    const { data: wellness } = await supabase
      .from("wellness_scores")
      .select("*")
      .eq("student_id", studentId)
      .gte("score_date", startDate)
      .lt("score_date", endDate)
      .order("score_date", { ascending: false })
      .limit(1);

    // Get badges earned
    const { data: badges } = await supabase
      .from("student_badges")
      .select("*, badges(*)")
      .eq("student_id", studentId)
      .gte("earned_at", startDate)
      .lt("earned_at", endDate);

    const totalDays = records?.length || 0;
    const presentDays = records?.filter(r => r.status === 'present').length || 0;
    const lateDays = records?.filter(r => r.status === 'late').length || 0;
    const absentDays = records?.filter(r => r.status === 'absent').length || 0;
    const attendanceRate = totalDays > 0 ? ((presentDays + lateDays) / totalDays * 100).toFixed(1) : 0;

    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You generate structured school attendance report cards. Return valid JSON only."
          },
          {
            role: "user",
            content: `Generate a monthly attendance report card for:
Student: ${profile?.display_name || 'Student'}
Month: ${monthNames[month - 1]} ${year}
Total Working Days: ${totalDays}
Present: ${presentDays}, Late: ${lateDays}, Absent: ${absentDays}
Attendance Rate: ${attendanceRate}%
Wellness Score: ${wellness?.[0]?.overall_score || 'N/A'}
Badges Earned: ${badges?.length || 0}

Return JSON with this structure:
{
  "grade": "A+/A/B+/B/C/D",
  "summary": "2-3 sentence personalized summary",
  "strengths": ["strength1", "strength2"],
  "improvements": ["area1", "area2"],
  "recommendation": "one actionable recommendation for next month",
  "parentNote": "a friendly note to parents",
  "trend": "improving/stable/declining"
}`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_report",
            description: "Generate a structured report card",
            parameters: {
              type: "object",
              properties: {
                grade: { type: "string" },
                summary: { type: "string" },
                strengths: { type: "array", items: { type: "string" } },
                improvements: { type: "array", items: { type: "string" } },
                recommendation: { type: "string" },
                parentNote: { type: "string" },
                trend: { type: "string", enum: ["improving", "stable", "declining"] }
              },
              required: ["grade", "summary", "strengths", "improvements", "recommendation", "parentNote", "trend"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_report" } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    const report = toolCall ? JSON.parse(toolCall.function.arguments) : null;

    return new Response(JSON.stringify({
      success: true,
      report: {
        ...report,
        studentName: profile?.display_name || 'Student',
        month: monthNames[month - 1],
        year,
        stats: { totalDays, presentDays, lateDays, absentDays, attendanceRate },
        wellnessScore: wellness?.[0]?.overall_score || null,
        badgesEarned: badges?.length || 0,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Report error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
