/**
 * Minimal Resend wrapper. No email infrastructure existed in this project
 * before -- Resend was picked as a reasonable default (simple REST API,
 * works from Deno edge functions, free tier) but was never tested against a
 * real account/sending domain in this session. Requires:
 *   - RESEND_API_KEY (Supabase Edge Function secret)
 *   - RESEND_FROM_EMAIL (a verified sender on your Resend domain, e.g.
 *     "PsicoManager <agenda@seudominio.com>")
 * If either is missing, sendEmail no-ops (logs and returns false) instead of
 * throwing, so a missing email config never blocks calendar sync.
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('RESEND_FROM_EMAIL');
  if (!apiKey || !from) {
    console.warn('Email not sent (RESEND_API_KEY/RESEND_FROM_EMAIL not configured):', subject, '->', to);
    return false;
  }
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!response.ok) {
      console.error('Resend send failed', response.status, await response.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error('Resend send error', e);
    return false;
  }
}
