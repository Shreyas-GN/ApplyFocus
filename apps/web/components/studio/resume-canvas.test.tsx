import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResumeCanvas } from './resume-canvas';
import { ResumeRenderer } from './resume-templates';
import {
  DEFAULT_RESUME_DESIGN_SETTINGS,
  RESUME_TEMPLATES_CATALOG,
  type ResumeDesignSettings,
} from '@/lib/resume/types';
import type { TailoredResumeContent } from '@/lib/types';

describe('Resume Canvas & Multi-Template System', () => {
  const sampleContent: TailoredResumeContent = {
    headline: 'Senior Full Stack Engineer',
    summary: 'Seasoned engineer specializing in web applications and cloud architecture.',
    highlightedSkills: ['React', 'Next.js', 'TypeScript', 'Node.js', 'PostgreSQL'],
    experience: [
      {
        company: 'Vercel',
        title: 'Senior Frontend Engineer',
        startDate: '2022',
        endDate: 'Present',
        originalDescription: null,
        tailoredDescription: '• Built high-performance dashboard components.\n• Optimized bundle size by 45%.',
      },
    ],
    keywordsUsed: ['React', 'TypeScript'],
    missingKeywords: [],
    rationale: 'Solid tech stack alignment.',
    contactInfo: {
      fullName: 'Taylor Swift',
      email: 'taylor@example.com',
      phone: '+1 555-1234',
      location: 'New York, NY',
      linkedinUrl: 'https://linkedin.com/in/taylorswift',
    },
    education: [
      {
        institution: 'NYU',
        degree: 'B.S.',
        fieldOfStudy: 'Computer Science',
        graduationYear: 2020,
      },
    ],
  };

  it('renders all 5 archetype templates without error', () => {
    for (const tpl of RESUME_TEMPLATES_CATALOG) {
      const settings: ResumeDesignSettings = {
        ...DEFAULT_RESUME_DESIGN_SETTINGS,
        template: tpl.id,
      };

      const { unmount } = render(
        <ResumeRenderer
          content={sampleContent}
          settings={settings}
          fallbackJobTitle="Software Engineer"
          fallbackCompany="Tech Corp"
        />
      );

      // Verify essential content renders across all templates
      expect(screen.getByText('Taylor Swift')).toBeInTheDocument();
      expect(screen.getByText(/Vercel/i)).toBeInTheDocument();
      unmount();
    }
  });

  it('switches templates when clicking quick switcher buttons on the canvas', async () => {
    const user = userEvent.setup();
    const handleUpdateSettings = vi.fn();

    render(
      <ResumeCanvas
        content={sampleContent}
        settings={DEFAULT_RESUME_DESIGN_SETTINGS}
        onUpdateSettings={handleUpdateSettings}
      />
    );

    // Look for Executive Brief button
    const execBtn = screen.getByRole('button', { name: /Executive Brief/i });
    expect(execBtn).toBeInTheDocument();

    await user.click(execBtn);
    expect(handleUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        template: 'executive-brief',
      })
    );
  });
});

