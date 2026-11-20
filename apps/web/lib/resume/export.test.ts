import { describe, expect, it } from 'vitest';
import { exportToJsonResume, exportToMarkdown, exportToPlainText } from './export';
import type { TailoredResumeContent } from '../types';

describe('Resume Portability & Export Suite', () => {
  const sampleContent: TailoredResumeContent = {
    headline: 'Staff Infrastructure Engineer',
    summary: 'Expert in distributed data pipelines and Kubernetes clusters.',
    highlightedSkills: ['Kubernetes', 'Go', 'Rust', 'Terraform'],
    experience: [
      {
        company: 'Cloudflare',
        title: 'Staff Engineer',
        startDate: '2022',
        endDate: 'Present',
        originalDescription: null,
        tailoredDescription: '• Scaled edge routing infrastructure across 300+ cities.\n• Reduced latency by 28ms globally.',
      },
    ],
    keywordsUsed: ['Kubernetes', 'Rust'],
    missingKeywords: [],
    rationale: 'Focus on low-latency infrastructure.',
    contactInfo: {
      fullName: 'Jordan Lee',
      email: 'jordan@example.com',
      phone: '+1 555-0199',
      location: 'Austin, TX',
      linkedinUrl: 'https://linkedin.com/in/jordanlee',
    },
    education: [
      {
        institution: 'UT Austin',
        degree: 'B.S.',
        fieldOfStudy: 'Electrical Engineering',
        graduationYear: 2018,
      },
    ],
    projects: [
      {
        name: 'OpenDNS Proxy',
        role: 'Creator',
        description: 'High-throughput DNS cache written in Rust.',
        technologies: ['Rust', 'Tokio'],
      },
    ],
  };

  const docInfo = {
    jobTitle: 'Staff Site Reliability Engineer',
    company: 'Datadog',
  };

  it('exports to standard JSON Resume schema with basics, work, education, and projects', () => {
    const jsonResume = exportToJsonResume(sampleContent, docInfo) as Record<string, unknown> & {
      $schema: string;
      basics: { name: string; email: string; label: string };
      work: Array<{ name: string; highlights: string[] }>;
      skills: Array<{ keywords: string[] }>;
      projects: Array<{ name: string }>;
    };

    expect(jsonResume.$schema).toContain('jsonresume');
    expect(jsonResume.basics.name).toBe('Jordan Lee');
    expect(jsonResume.basics.email).toBe('jordan@example.com');
    expect(jsonResume.basics.label).toBe('Staff Infrastructure Engineer');
    expect(jsonResume.work).toHaveLength(1);
    expect(jsonResume.work[0]?.name).toBe('Cloudflare');
    expect(jsonResume.work[0]?.highlights).toHaveLength(2);
    expect(jsonResume.skills[0]?.keywords).toContain('Kubernetes');
    expect(jsonResume.projects[0]?.name).toBe('OpenDNS Proxy');
  });

  it('exports to clean markdown format', () => {
    const md = exportToMarkdown(sampleContent, docInfo);

    expect(md).toContain('# Jordan Lee');
    expect(md).toContain('## Professional Summary');
    expect(md).toContain('## Work Experience');
    expect(md).toContain('### Staff Engineer — Cloudflare');
    expect(md).toContain('Scaled edge routing infrastructure');
    expect(md).toContain('## Key Projects');
  });

  it('exports to formatted plain text', () => {
    const txt = exportToPlainText(sampleContent, docInfo);

    expect(txt).toContain('JORDAN LEE');
    expect(txt).toContain('jordan@example.com');
    expect(txt).toContain('STAFF ENGINEER | Cloudflare');
    expect(txt).toContain('PROFESSIONAL SUMMARY');
    expect(txt).toContain('EDUCATION');
  });
});
