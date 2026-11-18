// Sends transactional email through Resend's HTTP API (free tier: 3,000/month,
// 100/day). No SDK needed. Without RESEND_API_KEY the message is logged
// instead — fine for local development, refused in production.

interface Message {
  to: string;
  subject: string;
  text: string;
  html: string;
}

async function send(message: Message): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('RESEND_API_KEY is not set; cannot send email.');
    }
    console.info(`[email:dev] to=${message.to} subject="${message.subject}"\n${message.text}`);
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'ApplyPilot <onboarding@resend.dev>',
      to: [message.to],
      subject: message.subject,
      text: message.text,
      html: message.html,
    }),
  });

  if (!response.ok) {
    throw new Error(`Email provider returned ${response.status}.`);
  }
}

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}

function layout(heading: string, body: string, link: string, cta: string): string {
  return `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px">
<h2 style="margin:0 0 12px">${heading}</h2>
<p style="line-height:1.5">${body}</p>
<p><a href="${link}" style="display:inline-block;background:#111;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">${cta}</a></p>
<p style="color:#666;font-size:12px">If the button doesn't work, paste this link into your browser:<br>${link}</p>
</div>`;
}

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const link = `${appUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  await send({
    to,
    subject: 'Confirm your ApplyPilot email',
    text: `Confirm your email to activate your ApplyPilot account:\n\n${link}\n\nThis link expires in 24 hours. If you didn't sign up, ignore this email.`,
    html: layout(
      'Confirm your email',
      'Click below to activate your ApplyPilot account. This link expires in 24 hours.',
      link,
      'Confirm email'
    ),
  });
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const link = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  await send({
    to,
    subject: 'Reset your ApplyPilot password',
    text: `Reset your password:\n\n${link}\n\nThis link expires in 1 hour. If you didn't request it, ignore this email.`,
    html: layout(
      'Reset your password',
      'Click below to choose a new password. This link expires in 1 hour.',
      link,
      'Reset password'
    ),
  });
}
