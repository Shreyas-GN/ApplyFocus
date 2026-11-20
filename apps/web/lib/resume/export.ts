import type { TailoredResumeContent } from '../types';

export function parseBulletLines(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split('\n')
    .map((l) => l.trim().replace(/^[-*•]\s*/, ''))
    .filter((l) => l.length > 0);
}

/**
 * Exports to industry-standard JSON Resume schema (https://jsonresume.org/schema/)
 * Gives users 100% data ownership and cross-tool interoperability.
 */
export function exportToJsonResume(
  content: TailoredResumeContent,
  docInfo: { jobTitle: string; company: string }
): object {
  const contact = content.contactInfo ?? {};

  const profiles: Array<{ network: string; username: string; url: string }> = [];
  if (contact.linkedinUrl) {
    profiles.push({
      network: 'LinkedIn',
      username: contact.linkedinUrl.split('/').filter(Boolean).pop() || '',
      url: contact.linkedinUrl,
    });
  }
  if (contact.githubUrl) {
    profiles.push({
      network: 'GitHub',
      username: contact.githubUrl.split('/').filter(Boolean).pop() || '',
      url: contact.githubUrl,
    });
  }
  if (contact.portfolioUrl) {
    profiles.push({
      network: 'Portfolio',
      username: 'Portfolio',
      url: contact.portfolioUrl,
    });
  }

  const work = (content.experience || []).map((exp) => ({
    name: exp.company,
    position: exp.title,
    startDate: exp.startDate || '',
    endDate: exp.endDate || 'Present',
    summary: '',
    highlights: parseBulletLines(exp.tailoredDescription),
  }));

  const education = (content.education || []).map((edu) => ({
    institution: edu.institution,
    area: edu.fieldOfStudy || '',
    studyType: edu.degree || '',
    endDate: edu.graduationYear ? String(edu.graduationYear) : '',
  }));

  const skills = [
    {
      name: 'Highlighted Skills',
      keywords: content.highlightedSkills || [],
    },
  ];

  const projects = (content.projects || []).map((p) => ({
    name: p.name,
    description: p.description || '',
    highlights: p.technologies || [],
  }));

  const certificates = (content.certifications || []).map((c) => ({
    name: c.name,
    issuer: c.issuer || '',
    date: c.issueDate || '',
    url: c.credentialUrl || '',
  }));

  return {
    $schema: 'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json',
    basics: {
      name: contact.fullName || 'Candidate',
      label: content.headline || docInfo.jobTitle,
      email: contact.email || '',
      phone: contact.phone || '',
      summary: content.summary,
      location: {
        city: contact.location || '',
      },
      profiles,
    },
    work,
    education,
    skills,
    projects,
    certificates,
    meta: {
      canonical: 'https://applyfocus.com',
      version: 'v1.0.0',
      lastModified: new Date().toISOString(),
      targetCompany: docInfo.company,
      targetRole: docInfo.jobTitle,
    },
  };
}

/**
 * Exports to clean, readable Markdown
 */
export function exportToMarkdown(
  content: TailoredResumeContent,
  docInfo: { jobTitle: string; company: string }
): string {
  const contact = content.contactInfo ?? {};
  const contactItems = [
    contact.email,
    contact.phone,
    contact.location,
    contact.linkedinUrl ? `[LinkedIn](${contact.linkedinUrl})` : null,
    contact.githubUrl ? `[GitHub](${contact.githubUrl})` : null,
    contact.portfolioUrl ? `[Portfolio](${contact.portfolioUrl})` : null,
  ].filter(Boolean);

  const lines: string[] = [
    `# ${contact.fullName || 'Candidate'}`,
    `**${content.headline || docInfo.jobTitle}**`,
    contactItems.join(' | '),
    '',
    '## Professional Summary',
    content.summary,
    '',
    '## Core Competencies & Skills',
    (content.highlightedSkills || []).map((s) => `\`${s}\``).join(' • '),
    '',
    '## Work Experience',
  ];

  for (const exp of content.experience || []) {
    lines.push(`### ${exp.title} — ${exp.company}`);
    lines.push(`*${exp.startDate || '—'} – ${exp.endDate || 'Present'}*`);
    const bullets = parseBulletLines(exp.tailoredDescription);
    for (const b of bullets) {
      lines.push(`- ${b}`);
    }
    lines.push('');
  }

  if (content.projects && content.projects.length > 0) {
    lines.push('## Key Projects');
    for (const p of content.projects) {
      lines.push(`### ${p.name}${p.role ? ` — ${p.role}` : ''}`);
      if (p.description) lines.push(p.description);
      if (p.technologies && p.technologies.length > 0) {
        lines.push(`*Technologies:* ${p.technologies.join(', ')}`);
      }
      lines.push('');
    }
  }

  if (content.education && content.education.length > 0) {
    lines.push('## Education');
    for (const edu of content.education) {
      lines.push(
        `- **${edu.degree ? `${edu.degree} in ` : ''}${edu.fieldOfStudy || ''}** — ${edu.institution}${
          edu.graduationYear ? ` (${edu.graduationYear})` : ''
        }`
      );
    }
    lines.push('');
  }

  if (content.certifications && content.certifications.length > 0) {
    lines.push('## Certifications');
    for (const cert of content.certifications) {
      lines.push(
        `- **${cert.name}**${cert.issuer ? ` (${cert.issuer})` : ''}${
          cert.issueDate ? ` — ${cert.issueDate}` : ''
        }`
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Exports to clean Plain Text
 */
export function exportToPlainText(
  content: TailoredResumeContent,
  docInfo: { jobTitle: string; company: string }
): string {
  const contact = content.contactInfo ?? {};
  const contactParts = [contact.email, contact.phone, contact.location]
    .filter(Boolean)
    .join(' | ');

  const lines = [
    (contact.fullName || 'Candidate').toUpperCase(),
    content.headline || docInfo.jobTitle,
    contactParts,
    '='.repeat(60),
    '',
    'PROFESSIONAL SUMMARY',
    '-'.repeat(30),
    content.summary,
    '',
    'CORE COMPETENCIES',
    '-'.repeat(30),
    (content.highlightedSkills || []).join(', '),
    '',
    'PROFESSIONAL EXPERIENCE',
    '-'.repeat(30),
  ];

  for (const exp of content.experience || []) {
    lines.push(`${exp.title.toUpperCase()} | ${exp.company}`);
    lines.push(`${exp.startDate || '—'} - ${exp.endDate || 'Present'}`);
    const bullets = parseBulletLines(exp.tailoredDescription);
    for (const b of bullets) {
      lines.push(`  * ${b}`);
    }
    lines.push('');
  }

  if (content.education && content.education.length > 0) {
    lines.push('EDUCATION');
    lines.push('-'.repeat(30));
    for (const edu of content.education) {
      lines.push(
        `${edu.degree ? `${edu.degree} in ` : ''}${edu.fieldOfStudy || ''} - ${edu.institution}${
          edu.graduationYear ? ` (${edu.graduationYear})` : ''
        }`
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}

