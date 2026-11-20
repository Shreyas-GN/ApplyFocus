import { NextRequest, NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { getUser } from '@/lib/auth/session';
import { db, tailoredDocuments } from '@/lib/db';
import type { CoverLetterContent, TailoredResumeContent } from '@/lib/types';
import {
  COLOR_THEME_CONFIG,
  DEFAULT_RESUME_DESIGN_SETTINGS,
  type ResumeDesignSettings,
} from '@/lib/resume/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const [doc] = await db
    .select()
    .from(tailoredDocuments)
    .where(and(eq(tailoredDocuments.id, id), eq(tailoredDocuments.userId, user.id)))
    .limit(1);

  if (!doc) return NextResponse.json({ detail: 'Not found' }, { status: 404 });

  const html =
    doc.type === 'resume'
      ? buildResumeHtml(doc.jobTitle, doc.company, doc.content as TailoredResumeContent)
      : buildCoverLetterHtml(doc.jobTitle, doc.company, doc.content as CoverLetterContent);

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Document-Type': doc.type,
    },
  });
}

function esc(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const PRINT_INSTRUCTIONS_HTML = `
<div class="print-instructions">
  <strong>Save as PDF:</strong>
  Open your browser menu and choose <strong>Print</strong>
  (or press <kbd>Ctrl+P</kbd> on Windows / <kbd>⌘+P</kbd> on Mac),
  then set the <strong>Destination</strong> to <strong>Save as PDF</strong>
  and click <strong>Save</strong>.
  This banner is hidden when you print.
</div>`;

const PRINT_INSTRUCTIONS_CSS = `
  .print-instructions {
    background: #FDF6F4;
    border: 1px solid #E8D2CC;
    border-radius: 6px;
    padding: 10px 16px;
    margin-bottom: 24px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 10pt;
    color: #C6533B;
    line-height: 1.6;
  }
  kbd {
    background: #F0F0F0;
    border: 1px solid #E1E0DC;
    border-radius: 3px;
    padding: 1px 5px;
    font-size: 9pt;
    font-family: monospace;
  }
  @media print { .print-instructions { display: none; } }`;

function buildResumeHtml(
  jobTitle: string,
  company: string,
  content: TailoredResumeContent
): string {
  const settings: ResumeDesignSettings = content.designSettings || DEFAULT_RESUME_DESIGN_SETTINGS;
  const theme = COLOR_THEME_CONFIG[settings.colorTheme || 'terracotta'] || COLOR_THEME_CONFIG.terracotta;
  const contact = content.contactInfo ?? {};
  const vis = settings.sectionVisibility ?? {};

  const contactItems = [
    contact.email,
    contact.phone,
    contact.location,
    vis.contactLinks !== false && contact.linkedinUrl ? `<a href="${esc(contact.linkedinUrl)}">LinkedIn</a>` : null,
    vis.contactLinks !== false && contact.githubUrl ? `<a href="${esc(contact.githubUrl)}">GitHub</a>` : null,
    vis.contactLinks !== false && contact.portfolioUrl ? `<a href="${esc(contact.portfolioUrl)}">Portfolio</a>` : null,
  ].filter(Boolean);

  const expHtml =
    content.experience
      ?.map((e) => {
        const rawBullets = e.tailoredDescription
          .split('\n')
          .map((b) => b.trim())
          .filter(Boolean);
        const bulletList = rawBullets
          .map((b) => `<li>${esc(b.replace(/^[-•*]\s*/, ''))}</li>`)
          .join('');

        return `
    <div class="exp-item">
      <div class="exp-header">
        <span class="exp-title">${esc(e.title)} &mdash; <span class="exp-company">${esc(e.company)}</span></span>
        <span class="dates">${esc(e.startDate || '')}${e.endDate ? ` &ndash; ${esc(e.endDate)}` : ' &ndash; Present'}</span>
      </div>
      <ul class="bullets">
        ${bulletList}
      </ul>
    </div>`;
      })
      .join('') ?? '';

  const eduHtml =
    content.education
      ?.map(
        (ed) => `
    <div class="edu-item">
      <div class="exp-header">
        <span class="exp-title">${esc(ed.institution)}</span>
        <span class="dates">${ed.graduationYear ? esc(String(ed.graduationYear)) : ''}</span>
      </div>
      <div class="exp-company">${esc(ed.degree ?? '')}${ed.fieldOfStudy ? ` in ${esc(ed.fieldOfStudy)}` : ''}</div>
    </div>`
      )
      .join('') ?? '';

  const skillsHtml = content.highlightedSkills?.length
    ? `<div class="skills-section"><p>${content.highlightedSkills.map((s) => `<span class="skill-tag">${esc(s)}</span>`).join(' ')}</p></div>`
    : '';

  const fontStack =
    settings.fontFamily === 'serif'
      ? "Georgia, Cambria, 'Times New Roman', Times, serif"
      : settings.fontFamily === 'mono'
      ? "'JetBrains Mono', 'Courier New', Courier, monospace"
      : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  const pageSize = settings.pageFormat === 'a4' ? 'A4' : 'letter';
  const pageMargin =
    settings.margins === 'compact'
      ? '1.2cm'
      : settings.margins === 'spacious'
      ? '2.2cm'
      : '1.6cm';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(contact.fullName || 'Resume')} - ${esc(jobTitle)} at ${esc(company)}</title>
<style>
  @page {
    size: ${pageSize};
    margin: ${pageMargin};
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: ${fontStack};
    font-size: 10pt;
    line-height: 1.45;
    color: #1a1a1a;
    background: #fff;
    padding: ${pageMargin};
    max-width: 820px;
    margin: 0 auto;
  }
  .header {
    text-align: ${settings.template === 'executive-brief' || settings.template === 'pure-ats' ? 'center' : 'left'};
    margin-bottom: 16px;
    border-bottom: 2px solid ${theme.primary};
    padding-bottom: 12px;
  }
  .name {
    font-size: 20pt;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: ${theme.primary};
    margin-bottom: 4px;
    text-transform: ${settings.template === 'pure-ats' ? 'uppercase' : 'none'};
  }
  .headline {
    font-size: 10.5pt;
    font-weight: 600;
    color: #555;
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .contacts {
    font-size: 9pt;
    color: #666;
    display: flex;
    justify-content: ${settings.template === 'executive-brief' || settings.template === 'pure-ats' ? 'center' : 'flex-start'};
    flex-wrap: wrap;
    gap: 12px;
  }
  .contacts a { color: ${theme.primary}; text-decoration: none; }

  h2 {
    font-size: 10pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: ${theme.primary};
    border-bottom: 1px solid #ddd;
    padding-bottom: 3px;
    margin: 14px 0 8px;
  }

  .summary-text { font-size: 9.5pt; line-height: 1.5; color: #333; text-align: justify; }
  .exp-item { margin-bottom: 11px; page-break-inside: avoid; }
  .exp-header { display: flex; justify-content: space-between; align-items: baseline; }
  .exp-title { font-weight: 700; font-size: 10pt; color: #111; }
  .exp-company { font-weight: 600; font-size: 9.5pt; color: #555; }
  .dates { font-size: 8.5pt; font-weight: 500; color: #666; }

  .bullets { list-style-type: disc; margin-left: 18px; margin-top: 4px; }
  .bullets li { font-size: 9.2pt; color: #222; margin-bottom: 3px; line-height: 1.45; }

  .skill-tag {
    display: inline-block;
    background: ${theme.light};
    border: 1px solid ${theme.border};
    color: ${theme.primary};
    padding: 1px 6px;
    border-radius: 3px;
    font-size: 8.5pt;
    margin-right: 4px;
    margin-bottom: 4px;
  }

  .edu-item { margin-bottom: 8px; page-break-inside: avoid; }

  ${PRINT_INSTRUCTIONS_CSS}
  @media print {
    body { padding: 0; max-width: 100%; }
  }
</style>
</head>
<body>
${PRINT_INSTRUCTIONS_HTML}

<div class="header">
  <div class="name">${esc(contact.fullName || 'Candidate')}</div>
  ${vis.headline !== false ? `<div class="headline">${esc(content.headline || jobTitle)}</div>` : ''}
  <div class="contacts">
    ${contactItems.join('&nbsp;&bull;&nbsp;')}
  </div>
</div>

${vis.summary !== false && content.summary ? `<h2>Professional Summary</h2><p class="summary-text">${esc(content.summary)}</p>` : ''}
${vis.skills !== false && skillsHtml ? `<h2>Core Competencies & Skills</h2>${skillsHtml}` : ''}
${vis.experience !== false && expHtml ? `<h2>Work Experience</h2>${expHtml}` : ''}
${vis.education !== false && eduHtml ? `<h2>Education</h2>${eduHtml}` : ''}

</body>
</html>`;
}

function buildCoverLetterHtml(
  jobTitle: string,
  company: string,
  content: CoverLetterContent
): string {
  const bodyHtml = content.bodyParagraphs
    .map((p) => `<p>${esc(p)}</p>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Cover Letter - ${esc(jobTitle)} at ${esc(company)}</title>
<style>
  @page { size: letter; margin: 2.2cm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 10.5pt;
    line-height: 1.65;
    color: #202124;
    background: #fff;
    padding: 2.2cm;
    max-width: 800px;
    margin: 0 auto;
  }
  .subject {
    font-weight: 700;
    color: #C6533B;
    margin-bottom: 1.5em;
    font-size: 11pt;
  }
  .greeting {
    margin-bottom: 1.2em;
    font-weight: 600;
  }
  p {
    margin-bottom: 1.2em;
    text-align: justify;
  }
  .closing {
    margin-top: 2em;
    margin-bottom: 0.5em;
  }
  .signature {
    font-weight: 700;
    color: #202124;
  }
  ${PRINT_INSTRUCTIONS_CSS}
  @media print {
    body { padding: 0; max-width: 100%; }
  }
</style>
</head>
<body>
${PRINT_INSTRUCTIONS_HTML}

<div class="subject">RE: ${esc(content.subjectLine || `${jobTitle} &mdash; ${company}`)}</div>
<div class="greeting">${esc(content.greeting || 'Dear Hiring Manager,')}</div>
${bodyHtml}
<div class="closing">${esc(content.closing || 'Sincerely,')}</div>
<div class="signature">${esc(content.signature || '')}</div>

</body>
</html>`;
}
