import { describe, expect, it, vi, beforeEach } from 'vitest';
import { executeResumeAiWorkflow } from './resume-ai-workflow';
import type { TailoredResumeContent } from '../types';
import type { AiMessagesClient } from './ai-provider';

// Mock DB and profile
vi.mock('@/lib/db', () => {
  const sampleDoc = {
    id: 'doc-123',
    userId: 'user-456',
    jobId: null,
    company: 'Anthropic',
    jobTitle: 'Research Engineer',
    type: 'resume',
    content: {
      headline: 'Full Stack Engineer',
      summary: 'Experienced developer working on web apps.',
      highlightedSkills: ['Python', 'TypeScript'],
      experience: [
        {
          company: 'Acme Corp',
          title: 'Software Developer',
          startDate: '2020',
          endDate: 'Present',
          originalDescription: null,
          tailoredDescription: '• Responsible for building APIs and assisted with database schemas.',
        },
      ],
      keywordsUsed: ['Python'],
      missingKeywords: ['PyTorch', 'Distributed Systems'],
      rationale: 'Initial draft',
      atsScore: 74,
      contactInfo: {
        fullName: 'Robin Chen',
        email: 'robin@example.com',
        phone: '555-0100',
        location: 'San Francisco, CA',
      },
    } as TailoredResumeContent,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    db: {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => Promise.resolve([sampleDoc]),
          }),
        }),
      }),
      update: () => ({
        set: () => ({
          where: () => Promise.resolve(),
        }),
      }),
    },
    tailoredDocuments: {},
    jobs: {},
  };
});

vi.mock('./profile', () => ({
  getProfile: vi.fn().mockResolvedValue({
    id: 'user-456',
    fullName: 'Robin Chen',
    yearsOfExperience: 5,
    skills: [
      { name: 'Python', source: 'user' },
      { name: 'TypeScript', source: 'user' },
      { name: 'PyTorch', source: 'user' },
    ],
    experience: [],
    education: [],
    projects: [],
    certifications: [],
  }),
}));

vi.mock('./audit', () => ({
  recordAudit: vi.fn().mockResolvedValue(undefined),
}));

describe('ApplyFocus AI Resume Operations Engine', () => {
  const mockAiClient: AiMessagesClient = {
    messages: {
      create: vi.fn().mockImplementation((params) => {
        if (params.system.includes('Google XYZ')) {
          return Promise.resolve({
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  variations: [
                    {
                      label: 'Metrics & Impact Focused',
                      text: '• Architected high-throughput REST APIs reducing response latency by 45% across 2M daily requests.',
                      focus: 'metrics',
                    },
                    {
                      label: 'Technical Architecture Focused',
                      text: '• Engineered resilient microservices infrastructure supporting fault-tolerant database operations.',
                      focus: 'architecture',
                    },
                  ],
                  powerVerbsUsed: ['Architected', 'Engineered'],
                }),
              },
            ],
          });
        }

        if (params.system.includes('Strategist')) {
          return Promise.resolve({
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  highlightedSkills: ['Python', 'TypeScript', 'PyTorch'],
                  keywordsBridged: ['PyTorch'],
                  rationale: 'Bridged PyTorch from verified background.',
                }),
              },
            ],
          });
        }

        // Summary or Auto Optimize
        return Promise.resolve({
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                summary: 'Research-driven engineer with 5+ years specializing in scalable systems and PyTorch model serving.',
                changesSummary: ['Sharpened narrative for target role'],
              }),
            },
          ],
        });
      }),
    },
  };

  it('transforms bullet into Google XYZ format with power verbs and variations', async () => {
    const res = await executeResumeAiWorkflow(
      'user-456',
      'doc-123',
      {
        action: 'enhance_bullet_xyz',
        bulletText: '• Responsible for building APIs and assisted with database schemas.',
      },
      mockAiClient
    );

    expect(res.action).toBe('enhance_bullet_xyz');
    expect(res.bulletEnhancement?.variations).toHaveLength(2);
    expect(res.bulletEnhancement?.variations[0]?.focus).toBe('metrics');
    expect(res.bulletEnhancement?.powerVerbsUsed).toContain('Architected');
  });

  it('bridges missing target keywords grounded in verified candidate skills', async () => {
    const res = await executeResumeAiWorkflow(
      'user-456',
      'doc-123',
      {
        action: 'bridge_keywords',
        keywordsToBridge: ['PyTorch'],
      },
      mockAiClient
    );

    expect(res.action).toBe('bridge_keywords');
    expect(res.updatedContent.highlightedSkills).toContain('PyTorch');
    expect(res.updatedContent.keywordsUsed).toContain('PyTorch');
    expect(res.updatedContent.missingKeywords).not.toContain('PyTorch');
  });

  it('elevates weak and passive phrasing to decisive executive power verbs', async () => {
    const res = await executeResumeAiWorkflow(
      'user-456',
      'doc-123',
      {
        action: 'elevate_action_verbs',
      },
      mockAiClient
    );

    expect(res.action).toBe('elevate_action_verbs');
    const desc = res.updatedContent.experience[0]?.tailoredDescription ?? '';
    // Should replace "Responsible for" and "assisted with"
    expect(desc).not.toContain('Responsible for');
    expect(desc).toContain('Spearheaded');
  });

  it('synthesizes professional summary tailored to target company and role', async () => {
    const res = await executeResumeAiWorkflow(
      'user-456',
      'doc-123',
      {
        action: 'synthesize_summary',
      },
      mockAiClient
    );

    expect(res.action).toBe('synthesize_summary');
    expect(res.updatedContent.summary).toContain('Research-driven engineer');
  });
});
