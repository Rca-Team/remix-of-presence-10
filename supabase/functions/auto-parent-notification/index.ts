import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log('Auto parent notification function started');

const resendApiKey = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

serve(async (req) => {
  console.log('Auto parent notification request received:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestBody = await req.json();
    const { studentId, studentName, status, imageUrl } = requestBody;

    console.log('Processing notification for:', { studentId, studentName, status });

    if (!studentId || !studentName || !status) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: studentId, studentName, status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Look up parent contact info from profiles table
    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .select('parent_email, parent_name, parent_phone')
      .eq('user_id', studentId)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }

    const parentEmail = profileData?.parent_email;
    const parentName = profileData?.parent_name || 'Parent/Guardian';

    console.log('Parent info found:', { parentEmail, parentName, hasPhone: !!profileData?.parent_phone });

    let emailSent = false;
    let emailError: string | null = null;

    // Send email if parent email exists and Resend is configured
    if (parentEmail && resendApiKey) {
      try {
        const statusColor = status === 'present' ? '#22c55e' : status === 'late' ? '#eab308' : '#ef4444';
        const statusBadge = status === 'present' ? 'ON TIME' : status === 'late' ? 'LATE ARRIVAL' : 'ABSENT';
        const statusEmoji = status === 'present' ? '✅' : status === 'late' ? '⏰' : '❌';
        
        const currentTime = new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
        const currentDate = new Date().toLocaleDateString('en-US', { 
          weekday: 'long',
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });

        const subject = `${statusEmoji} Attendance Alert: ${studentName} marked ${status}`;
        
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${escapeHtml(subject)}</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <tr>
                      <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                          📚 School Attendance System
                        </h1>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="padding: 20px; text-align: center;">
                        <span style="display: inline-block; background-color: ${statusColor}; color: white; padding: 8px 20px; border-radius: 20px; font-weight: 600; font-size: 14px;">
                          ${statusEmoji} ${statusBadge}
                        </span>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="padding: 20px 30px;">
                        <p style="color: #374151; margin: 0 0 10px 0;">Dear ${escapeHtml(parentName)},</p>
                        <p style="color: #4b5563;">
                          This is an automatic notification to inform you that your child <strong>${escapeHtml(studentName)}</strong> 
                          has been marked as <strong style="color: ${statusColor};">${status.toUpperCase()}</strong> for today's attendance.
                        </p>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="padding: 0 30px 20px 30px;">
                        <table width="100%" style="background-color: #f9fafb; border-radius: 8px; padding: 15px;">
                          <tr>
                            <td>
                              <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Student</p>
                              <p style="margin: 5px 0 0 0; color: #111827; font-weight: 600;">${escapeHtml(studentName)}</p>
                            </td>
                            <td align="right">
                              <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Date & Time</p>
                              <p style="margin: 5px 0 0 0; color: #111827; font-weight: 600;">${currentDate}<br/>${currentTime}</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    
                    <tr>
                      <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0; color: #6b7280; font-size: 12px;">
                          This is an automated message from the School Attendance System.
                        </p>
                        <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 11px;">
                          If you have questions, please contact the school administration.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `;

        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'School Attendance <noreply@electronicgaurav.me>',
            to: [parentEmail],
            subject: subject,
            html: htmlContent,
          }),
        });

        if (!resendResponse.ok) {
          const errorData = await resendResponse.json();
          console.error('Resend error:', errorData);
          emailError = errorData.message || 'Failed to send email';
        } else {
          emailSent = true;
          console.log('Email sent successfully to:', parentEmail);
        }
      } catch (err: any) {
        console.error('Email sending error:', err);
        emailError = err.message || 'Email sending failed';
      }
    } else {
      if (!parentEmail) {
        console.log('No parent email configured for student:', studentId);
        emailError = 'No parent email configured';
      }
      if (!resendApiKey) {
        console.log('RESEND_API_KEY not configured');
        emailError = 'Email service not configured';
      }
    }

    // Store in-app notification for the student
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: studentId,
        title: `Attendance Recorded: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your attendance was marked as ${status} at ${new Date().toLocaleTimeString()}`,
        type: 'attendance',
        read: false
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailSent,
        emailError,
        message: emailSent 
          ? `Notification sent to parent at ${parentEmail}` 
          : `In-app notification stored${emailError ? ` (Email: ${emailError})` : ''}`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('Error in auto-parent-notification:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send notification', details: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})