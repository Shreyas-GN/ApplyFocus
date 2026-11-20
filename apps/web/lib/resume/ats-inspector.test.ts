import { describe, expect, it } from 'vitest';
import { analyzeResumeAts } from './ats-inspector';
import type { TailoredResumeContent } from '../types';

describe('ATS & Recruiter Intelligence Inspector', () => {
  const sampleContent: TailoredResumeContent = {
    headline: 'Senior Full Stack Engineer | Cloud Architecture',
    summary:
      'High-impact software engineer with 7+ years of experience architecting distributed systems. Spearheaded multiple cloud migrations resulting in significant latency reductions and scalability gains across multi-tenant environments.',
    highlightedSkills: [
      'TypeScript',
      'React',
      'Next.js',
      'Node.js',
      'PostgreSQL',
      'AWS',
      'Docker',
      'Kubernetes',
    ],
    experience: [
      {
        company: 'Stripe',
        title: 'Senior Software Engineer',
        startDate: '2021',
        endDate: 'Present',
        originalDescription: null,
        tailoredDescription:
          '• Architected event-driven microservices processing 50,000 requests per second with 99.99% uptime.\n• Spearheaded cloud migration reducing AWS hosting infrastructure costs by 34% ($120k annually).\n• Automated CI/CD deployment pipelines cutting release turnaround time by 60%.',
      },
    ],
    keywordsUsed: ['TypeScript', 'React', 'AWS', 'Microservices', 'CI/CD'],
    missingKeywords: ['GraphQL'],
    rationale: 'Positioning emphasizes distributed systems and quantifiable impact.',
    atsScore: 92,
    contactInfo: {
      fullName: 'Alex Morgan',
      email: 'alex.morgan@example.com',
      phone: '+1 (555) 234-5678',
      location: 'San Francisco, CA',
      linkedinUrl: 'https://linkedin.com/in/alexmorgan',
      githubUrl: 'https://github.com/alexmorgan',
    },
    education: [
      {
        institution: 'University of California, Berkeley',
        degree: 'B.S.',
        fieldOfStudy: 'Computer Science',
        graduationYear: 2017,
      },
    ],
  };

  it('calculates high overall score and elite grade for well-formatted, quantified resume', () => {
    const report = analyzeResumeAts(sampleContent);

    expect(report.overallScore).toBeGreaterThanOrEqual(85);
    expect(['A+', 'A']).toContain(report.grade);
    expect(report.breakdown.contactScore).toBe(100);
    expect(report.breakdown.impactScore).toBeGreaterThanOrEqual(75);
    expect(report.metrics.quantifiedBulletCount).toBe(3);
    expect(report.metrics.quantifiedBulletPercent).toBe(100);
    expect(report.recognizedActionVerbs).toContain('architected');
    expect(report.recognizedActionVerbs).toContain('spearheaded');
    expect(report.recognizedActionVerbs).toContain('automated');
  });

  it('detects missing contact details and penalizes contact score', () => {
    const incomplete: TailoredResumeContent = {
      ...sampleContent,
      contactInfo: {
        fullName: '',
        email: '',
        phone: '',
        location: '',
      },
    };

    const report = analyzeResumeAts(incomplete);
    expect(report.breakdown.contactScore).toBeLessThan(40);
    const findingIds = report.findings.map((f) => f.id);
    expect(findingIds).toContain('missing-name');
    expect(findingIds).toContain('missing-email');
    expect(findingIds).toContain('missing-phone');
  });

  it('flags weak or passive phrases and alerts candidate', () => {
    const passiveResume: TailoredResumeContent = {
      ...sampleContent,
      experience: [
        {
          company: 'Acme Corp',
          title: 'Software Developer',
          startDate: '2020',
          endDate: '2022',
          originalDescription: null,
          tailoredDescription:
            '• Responsible for writing code and assisted with debugging.\n• Worked on internal team bugs and helped with releases.',
        },
      ],
    };

    const report = analyzeResumeAts(passiveResume);
    expect(report.metrics.weakVerbCount).toBeGreaterThan(0);
    const findingIds = report.findings.map((f) => f.id);
    expect(findingIds).toContain('weak-verbs-present');
  });

  it('calculates keyword match percentage against target opportunity', () => {
    const report = analyzeResumeAts(sampleContent);
    // 5 used, 1 missing -> 5/6 ~= 83%
    expect(report.breakdown.keywordScore).toBe(83);
    expect(report.metrics.keywordsMatchedCount).toBe(5);
    expect(report.metrics.keywordsMissingCount).toBe(1);
  });
});

