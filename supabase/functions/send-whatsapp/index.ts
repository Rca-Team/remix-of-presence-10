import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Send WhatsApp message via Meta WhatsApp Business Cloud API
 * Requires secrets: WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID
 */
async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string,
  studentName?: string,
  status?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

  if (!accessToken || !phoneNumberId) {
    console.warn("WhatsApp API credentials not configured");
    return { success: false, error: "WhatsApp API not configured" };
  }

  // Format phone for WhatsApp API (needs country code, no +)
  let formattedPhone = phoneNumber.replace(/[\s\-\(\)]/g, "");
  if (formattedPhone.startsWith("+")) {
    formattedPhone = formattedPhone.substring(1);
  }
  if (/^\d{10}$/.test(formattedPhone)) {
    formattedPhone = "91" + formattedPhone; // Default to India
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: formattedPhone,
          type: "text",
          text: { body: message },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("WhatsApp API error:", data);
      return {
        success: false,
        error: data.error?.message || "WhatsApp API request failed",
      };
    }

    const messageId = data.messages?.[0]?.id;
    console.log("WhatsApp message sent:", messageId);
    return { success: true, messageId };
  } catch (err: any) {
    console.error("WhatsApp send error:", err);
    return { success: false, error: err.message };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { phoneNumber, studentId, studentName, message, status, language } =
      await req.json();

    let recipientPhone = phoneNumber;

    // Look up phone from profile if not provided
    if (!recipientPhone && studentId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("parent_phone, display_name")
        .eq("user_id", studentId)
        .maybeSingle();

      recipientPhone = profile?.parent_phone;
    }

    if (!recipientPhone) {
      return new Response(
        JSON.stringify({ success: false, error: "No phone number found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build message if not provided
    const finalMessage =
      message ||
      buildAutoMessage(studentName || "Student", status || "present", language || "en");

    const result = await sendWhatsAppMessage(
      recipientPhone,
      finalMessage,
      studentName,
      status
    );

    // Log to notification_log
    await supabase.from("notification_log").insert({
      recipient_phone: recipientPhone,
      recipient_id: studentId || null,
      message_content: finalMessage,
      notification_type: "whatsapp",
      language: language || "en",
      status: result.success ? "sent" : "failed",
      gateway_response: result as any,
    });

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("send-whatsapp error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildAutoMessage(
  studentName: string,
  status: string,
  language: string
): string {
  const time = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const date = new Date().toLocaleDateString("en-IN");

  if (language === "hi") {
    switch (status) {
      case "present":
        return `✅ नमस्ते! आपका बच्चा ${studentName} आज ${time} पर स्कूल पहुंच गया है। - Presence`;
      case "late":
        return `⏰ सूचना: ${studentName} आज ${time} पर देरी से स्कूल पहुंचा/पहुंची। कृपया समय पर भेजें। - Presence`;
      case "absent":
        return `❌ सूचना: ${studentName} आज (${date}) स्कूल में अनुपस्थित है। कृपया स्कूल से संपर्क करें। - Presence`;
      default:
        return `📚 ${studentName} की उपस्थिति: ${status} | समय: ${time} | दिनांक: ${date} - Presence`;
    }
  }

  switch (status) {
    case "present":
      return `✅ Dear Parent, ${studentName} has arrived at school at ${time}. Have a great day! - Presence`;
    case "late":
      return `⏰ Notice: ${studentName} arrived late at school at ${time} today. Please ensure timely arrival. - Presence`;
    case "absent":
      return `❌ Alert: ${studentName} has been marked absent today (${date}). If unexpected, please contact the school. - Presence`;
    default:
      return `📚 Attendance update for ${studentName}: ${status} | Time: ${time} | Date: ${date} - Presence`;
  }
}
