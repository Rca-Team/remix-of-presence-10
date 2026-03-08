import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const resendApiKey = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function buildAbsenceEmailHtml(recipientName: string, absentNames: string[], role: 'parent' | 'teacher', date: string, cutoffTime: string): string {
  const listItems = absentNames.map(n => `<li style="padding:4px 0;">${escapeHtml(n)}</li>`).join('');
  const intro = role === 'parent'
    ? `This is to inform you that your child has been marked <strong style="color:#dc2626;">absent</strong> today as no attendance was recorded before the cutoff time (<strong>${escapeHtml(cutoffTime)}</strong>).`
    : `The following student(s) in your class have been marked <strong style="color:#dc2626;">absent</strong> today (cutoff: <strong>${escapeHtml(cutoffTime)}</strong>):`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;line-height:1.6;margin:0;padding:0;background-color:#f4f4f5;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
<tr><td style="background:linear-gradient(135deg,#dc2626 0%,#991b1b 100%);padding:24px;text-align:center;">
  <h1 style="color:#fff;margin:0;font-size:22px;">❌ Absence Alert</h1>
  <p style="color:#fecaca;margin:6px 0 0;font-size:13px;">${escapeHtml(date)}</p>
</td></tr>
<tr><td style="padding:24px 30px;">
  <p style="color:#374151;margin:0 0 12px;">Dear ${escapeHtml(recipientName)},</p>
  <p style="color:#4b5563;margin:0 0 12px;">${intro}</p>
  ${role === 'teacher' ? `<ul style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 12px 12px 32px;margin:0 0 16px;color:#991b1b;">${listItems}</ul>` : ''}
  <p style="color:#4b5563;margin:0;">If this is unexpected, please contact the school administration immediately.</p>
</td></tr>
<tr><td style="background-color:#f9fafb;padding:16px 30px;text-align:center;border-top:1px solid #e5e7eb;">
  <p style="margin:0;color:#9ca3af;font-size:11px;">Automated message from the School Attendance System</p>
</td></tr>
</table></td></tr></table></body></html>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    // Auth: accept admin bearer token or service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    // Verify caller is admin
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const authClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
      const { data: { user }, error: authErr } = await authClient.auth.getUser();
      if (authErr || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const svc = createClient(supabaseUrl, serviceKey);
      const { data: role } = await svc.from('user_roles').select('role').eq('user_id', user.id).in('role', ['admin', 'moderator']).maybeSingle();
      if (!role) return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const today = new Date().toISOString().split('T')[0];
    const dateStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Get cutoff time
    const { data: cutoffData } = await supabase.from('attendance_settings').select('value').eq('key', 'cutoff_time').single();
    const cutoffTime = cutoffData?.value || '09:00';
    const [cH, cM] = cutoffTime.split(':').map(Number);
    const cutoffDisplay = `${(cH % 12) || 12}:${String(cM).padStart(2, '0')} ${cH >= 12 ? 'PM' : 'AM'}`;

    // Get all registered faces (students & teachers)
    const { data: allFaces } = await supabase.from('face_descriptors').select('id, user_id, label');

    // Get today's attendance
    const { data: todayAttendance } = await supabase
      .from('attendance_records')
      .select('user_id, status')
      .gte('timestamp', `${today}T00:00:00`)
      .lte('timestamp', `${today}T23:59:59`);

    const presentUserIds = new Set((todayAttendance || []).map(a => a.user_id));

    // Find absent users
    const absentUsers = (allFaces || []).filter(f => !presentUserIds.has(f.user_id));

    if (absentUsers.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'No absent users found. Everyone is present!', emailsSent: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get profiles for absent users (for parent emails)
    const absentUserIds = absentUsers.map(u => u.user_id);
    const { data: profiles } = await supabase.from('profiles').select('user_id, display_name, parent_email, parent_name').in('user_id', absentUserIds);
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

    // Get class teachers for notification
    const { data: classTeachers } = await supabase.from('class_teachers').select('teacher_record_id, teacher_name, category, role');

    // Get face descriptors to map teacher_record_id -> user_id
    const { data: teacherFaces } = await supabase.from('face_descriptors').select('id, user_id, label');
    const teacherIdToUserId = new Map((teacherFaces || []).map(f => [f.id, f.user_id]));
    const teacherIdToProfile = new Map<string, any>();

    // Get teacher profiles
    const teacherUserIds = [...new Set((classTeachers || []).map(ct => teacherIdToUserId.get(ct.teacher_record_id)).filter(Boolean))];
    if (teacherUserIds.length > 0) {
      const { data: teacherProfiles } = await supabase.from('profiles').select('user_id, display_name, parent_email').in('user_id', teacherUserIds as string[]);
      (teacherProfiles || []).forEach(tp => teacherIdToProfile.set(tp.user_id, tp));
    }

    let emailsSent = 0;
    let inAppSent = 0;
    const errors: string[] = [];

    // 1. Send emails to absent students' parents
    for (const absentUser of absentUsers) {
      const profile = profileMap.get(absentUser.user_id);
      const studentName = profile?.display_name || absentUser.label || 'Student';

      // In-app notification to the student
      await supabase.from('notifications').insert({
        user_id: absentUser.user_id,
        title: '❌ Marked Absent',
        message: `You have been marked absent today (${dateStr}). Cutoff time was ${cutoffDisplay}. Contact administration if this is an error.`,
        type: 'attendance',
      });
      inAppSent++;

      // Email to parent
      if (profile?.parent_email && resendApiKey) {
        try {
          const html = buildAbsenceEmailHtml(
            profile.parent_name || 'Parent/Guardian',
            [studentName],
            'parent',
            dateStr,
            cutoffDisplay
          );
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: 'School Attendance <noreply@presences.dev>',
              to: [profile.parent_email],
              subject: `❌ Absence Alert: ${studentName} - ${dateStr}`,
              html,
            }),
          });
          if (res.ok) { emailsSent++; } else {
            const err = await res.json();
            errors.push(`Parent email for ${studentName}: ${err.message || 'failed'}`);
          }
        } catch (e: any) { errors.push(`Parent email for ${studentName}: ${e.message}`); }
      }
    }

    // 2. Notify class teachers about absent students in their class
    // Group absent students by category
    const absentByCategory = new Map<string, string[]>();
    for (const absentUser of absentUsers) {
      // Find which category this student belongs to from attendance_records or face_descriptors label
      const label = absentUser.label || '';
      // Try to find category from existing attendance records
      const { data: lastRecord } = await supabase
        .from('attendance_records')
        .select('category')
        .eq('user_id', absentUser.user_id)
        .not('category', 'is', null)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();

      const cat = lastRecord?.category;
      if (cat) {
        if (!absentByCategory.has(cat)) absentByCategory.set(cat, []);
        const profile = profileMap.get(absentUser.user_id);
        absentByCategory.get(cat)!.push(profile?.display_name || label || 'Unknown');
      }
    }

    // Send notification to each class teacher about their absent students
    for (const ct of (classTeachers || []).filter(c => c.role === 'class_teacher')) {
      const absentInClass = absentByCategory.get(ct.category);
      if (!absentInClass || absentInClass.length === 0) continue;

      const teacherUserId = teacherIdToUserId.get(ct.teacher_record_id);

      // In-app notification
      if (teacherUserId) {
        await supabase.from('notifications').insert({
          user_id: teacherUserId,
          title: `📋 ${absentInClass.length} Student(s) Absent`,
          message: `Absent students in your class: ${absentInClass.join(', ')}. Date: ${dateStr}`,
          type: 'attendance',
        });
        inAppSent++;

        // Email to teacher (using their profile email or parent_email field)
        const teacherProfile = teacherIdToProfile.get(teacherUserId);
        const teacherEmail = teacherProfile?.parent_email; // teachers may store their email in parent_email field
        if (teacherEmail && resendApiKey) {
          try {
            const html = buildAbsenceEmailHtml(
              ct.teacher_name,
              absentInClass,
              'teacher',
              dateStr,
              cutoffDisplay
            );
            const res = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                from: 'School Attendance <noreply@presences.dev>',
                to: [teacherEmail],
                subject: `📋 Absence Report: ${absentInClass.length} student(s) absent - ${dateStr}`,
                html,
              }),
            });
            if (res.ok) { emailsSent++; } else {
              const err = await res.json();
              errors.push(`Teacher email for ${ct.teacher_name}: ${err.message || 'failed'}`);
            }
          } catch (e: any) { errors.push(`Teacher email for ${ct.teacher_name}: ${e.message}`); }
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Absence cutoff notifications sent. ${emailsSent} email(s), ${inAppSent} in-app notification(s).`,
      absentCount: absentUsers.length,
      emailsSent,
      inAppSent,
      errors: errors.length > 0 ? errors : undefined,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Absence cutoff notify error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process absence notifications', details: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
