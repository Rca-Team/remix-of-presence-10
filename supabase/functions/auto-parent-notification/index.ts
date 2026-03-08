import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const resendApiKey = Deno.env.get('RESEND_API_KEY');
const whatsappAccessToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
const whatsappPhoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}

async function sendWhatsAppMessage(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
  if (!whatsappAccessToken || !whatsappPhoneNumberId) return { success: false, error: 'WhatsApp API not configured' };
  let formattedPhone = phone.replace(/[\s\-\(\)]/g, '');
  if (formattedPhone.startsWith('+')) formattedPhone = formattedPhone.substring(1);
  if (/^\d{10}$/.test(formattedPhone)) formattedPhone = '91' + formattedPhone;
  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${whatsappPhoneNumberId}/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${whatsappAccessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: formattedPhone, type: 'text', text: { body: message } }),
    });
    const data = await response.json();
    if (!response.ok) return { success: false, error: data.error?.message || 'WhatsApp send failed' };
    return { success: true };
  } catch (err: any) { return { success: false, error: err.message }; }
}

async function sendSMS(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
  const fast2smsKey = Deno.env.get('FAST2SMS_API_KEY');
  if (!fast2smsKey) return { success: false, error: 'SMS API not configured' };
  const cleanPhone = phone.replace(/^\+91/, '').replace(/\s+/g, '');
  if (!/^\d{10}$/.test(cleanPhone)) return { success: false, error: 'Invalid phone number' };
  try {
    const resp = await fetch(`https://www.fast2sms.com/dev/bulkV2?authorization=${fast2smsKey}&route=q&message=${encodeURIComponent(message)}&language=english&flash=0&numbers=${cleanPhone}`);
    const data = await resp.json();
    return { success: !!data.return, error: data.return ? undefined : 'SMS send failed' };
  } catch (err: any) { return { success: false, error: err.message }; }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const { studentId, studentName, status, imageUrl } = await req.json();

    if (!studentId || !studentName || !status) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: profileData } = await supabaseClient.from('profiles').select('parent_email, parent_name, parent_phone').eq('user_id', studentId).maybeSingle();
    const parentEmail = profileData?.parent_email;
    const parentName = profileData?.parent_name || 'Parent/Guardian';
    const parentPhone = profileData?.parent_phone;

    const results = { emailSent: false, whatsappSent: false, smsSent: false, errors: [] as string[] };
    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    const date = new Date().toLocaleDateString('en-IN');

    // 1. SEND EMAIL
    if (parentEmail && resendApiKey) {
      try {
        const statusColor = status === 'present' ? '#22c55e' : status === 'late' ? '#eab308' : '#ef4444';
        const statusBadge = status === 'present' ? 'ON TIME' : status === 'late' ? 'LATE ARRIVAL' : 'ABSENT';
        const statusEmoji = status === 'present' ? '✅' : status === 'late' ? '⏰' : '❌';
        const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        const subject = `${statusEmoji} Attendance Alert: ${studentName} marked ${status}`;

        const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;line-height:1.6;margin:0;padding:0;background-color:#f4f4f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
<tr><td style="background:linear-gradient(135deg,#3b82f6 0%,#1d4ed8 100%);padding:30px;text-align:center;"><h1 style="color:#ffffff;margin:0;font-size:24px;">📚 School Attendance System</h1></td></tr>
<tr><td style="padding:20px;text-align:center;"><span style="display:inline-block;background-color:${statusColor};color:white;padding:8px 20px;border-radius:20px;font-weight:600;font-size:14px;">${statusEmoji} ${statusBadge}</span></td></tr>
<tr><td style="padding:20px 30px;"><p style="color:#374151;margin:0 0 10px 0;">Dear ${escapeHtml(parentName)},</p><p style="color:#4b5563;">Your child <strong>${escapeHtml(studentName)}</strong> has been marked as <strong style="color:${statusColor};">${status.toUpperCase()}</strong> for today's attendance.</p></td></tr>
<tr><td style="padding:0 30px 20px 30px;"><table width="100%" style="background-color:#f9fafb;border-radius:8px;padding:15px;"><tr><td><p style="margin:0;color:#6b7280;font-size:12px;text-transform:uppercase;">Student</p><p style="margin:5px 0 0 0;color:#111827;font-weight:600;">${escapeHtml(studentName)}</p></td><td align="right"><p style="margin:0;color:#6b7280;font-size:12px;text-transform:uppercase;">Date & Time</p><p style="margin:5px 0 0 0;color:#111827;font-weight:600;">${currentDate}<br/>${currentTime}</p></td></tr></table></td></tr>
<tr><td style="background-color:#f9fafb;padding:20px 30px;text-align:center;border-top:1px solid #e5e7eb;"><p style="margin:0;color:#6b7280;font-size:12px;">Automated message from the School Attendance System.</p></td></tr>
</table></td></tr></table></body></html>`;

        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: 'School Attendance <noreply@electronicgaurav.me>', to: [parentEmail], subject, html: htmlContent }),
        });
        if (resendResponse.ok) { results.emailSent = true; } else { const err = await resendResponse.json(); results.errors.push(`Email: ${err.message || 'failed'}`); }
      } catch (err: any) { results.errors.push(`Email: ${err.message}`); }
    }

    // 2. SEND WHATSAPP
    if (parentPhone) {
      const msg = status === 'present'
        ? `✅ Dear ${parentName}, your child ${studentName} has arrived at school at ${time}. - Presence`
        : status === 'late'
        ? `⏰ Notice: ${studentName} arrived late at school at ${time} today. - Presence`
        : `❌ Alert: ${studentName} has been marked absent today (${date}). Contact the school if unexpected. - Presence`;

      const waResult = await sendWhatsAppMessage(parentPhone, msg);
      results.whatsappSent = waResult.success;
      if (!waResult.success) results.errors.push(`WhatsApp: ${waResult.error}`);

      await supabaseClient.from('notification_log').insert({
        recipient_phone: parentPhone, recipient_id: studentId, message_content: msg,
        notification_type: 'whatsapp', language: 'en', status: waResult.success ? 'sent' : 'failed', gateway_response: waResult as any,
      });

      // 3. SMS FALLBACK
      if (!waResult.success) {
        const smsMsg = status === 'present'
          ? `Dear Parent, ${studentName} arrived at school at ${time}. - Presence`
          : status === 'late'
          ? `Dear Parent, ${studentName} arrived late at ${time}. - Presence`
          : `Dear Parent, ${studentName} is absent today (${date}). Contact school. - Presence`;
        const smsResult = await sendSMS(parentPhone, smsMsg);
        results.smsSent = smsResult.success;
        if (!smsResult.success) results.errors.push(`SMS: ${smsResult.error}`);
        await supabaseClient.from('notification_log').insert({
          recipient_phone: parentPhone, recipient_id: studentId, message_content: smsMsg,
          notification_type: 'sms', language: 'en', status: smsResult.success ? 'sent' : 'failed',
        });
      }
    }

    // 4. IN-APP NOTIFICATION
    await supabaseClient.from('notifications').insert({
      user_id: studentId,
      title: `Attendance Recorded: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your attendance was marked as ${status} at ${time}`,
      type: 'attendance', read: false,
    });

    const channels = [results.emailSent && 'Email', results.whatsappSent && 'WhatsApp', results.smsSent && 'SMS', 'In-app'].filter(Boolean);
    return new Response(JSON.stringify({ success: true, ...results, message: `Sent via: ${channels.join(', ')}` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Failed to send notification', details: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
