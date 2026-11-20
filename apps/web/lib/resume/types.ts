export type ResumeTemplateId =
  | 'modern-focus'
  | 'executive-brief'
  | 'technical-matrix'
  | 'pure-ats'
  | 'strategic-sidebar';

export type ResumeFontFamily = 'sans' | 'serif' | 'mono';
export type ResumeFontSize = 'compact' | 'standard' | 'comfortable';
export type ResumeColorTheme = 'terracotta' | 'navy' | 'forest' | 'charcoal' | 'monochrome';
export type ResumePageFormat = 'letter' | 'a4';
export type ResumeMargins = 'compact' | 'standard' | 'spacious';

export type ResumeSectionKey =
  | 'summary'
  | 'skills'
  | 'experience'
  | 'projects'
  | 'education'
  | 'certifications';

export interface ResumeDesignSettings {
  template: ResumeTemplateId;
  fontFamily: ResumeFontFamily;
  fontSize: ResumeFontSize;
  colorTheme: ResumeColorTheme;
  pageFormat: ResumePageFormat;
  margins: ResumeMargins;
  sectionOrder: ResumeSectionKey[];
  sectionVisibility: {
    headline?: boolean;
    summary?: boolean;
    skills?: boolean;
    experience?: boolean;
    projects?: boolean;
    education?: boolean;
    certifications?: boolean;
    contactLinks?: boolean;
  };
}

export const DEFAULT_RESUME_DESIGN_SETTINGS: ResumeDesignSettings = {
  template: 'modern-focus',
  fontFamily: 'sans',
  fontSize: 'standard',
  colorTheme: 'terracotta',
  pageFormat: 'letter',
  margins: 'standard',
  sectionOrder: ['summary', 'skills', 'experience', 'projects', 'education', 'certifications'],
  sectionVisibility: {
    headline: true,
    summary: true,
    skills: true,
    experience: true,
    projects: true,
    education: true,
    certifications: true,
    contactLinks: true,
  },
};

export interface ResumeTemplateMeta {
  id: ResumeTemplateId;
  name: string;
  tagline: string;
  description: string;
  bestFor: string;
  layout: 'single-column' | 'two-column-split' | 'dense-grid';
  atsSafetyScore: number; // 1-100
}

export const RESUME_TEMPLATES_CATALOG: ResumeTemplateMeta[] = [
  {
    id: 'modern-focus',
    name: 'Modern Focus',
    tagline: 'Contemporary & balanced',
    description: 'Clean typographic hierarchy with subtle brand accent rules. Highly legible and modern.',
    bestFor: 'Tech startups, Product Management, Design, Growth',
    layout: 'single-column',
    atsSafetyScore: 98,
  },
  {
    id: 'executive-brief',
    name: 'Executive Brief',
    tagline: 'Authoritative & dignified',
    description: 'Classic serif typography with refined dividers, conveying seniority and gravitas.',
    bestFor: 'VP/Director leadership, Finance, Consulting, Legal',
    layout: 'single-column',
    atsSafetyScore: 97,
  },
  {
    id: 'technical-matrix',
    name: 'Technical Matrix',
    tagline: 'High-density engineering format',
    description: 'Optimized for deep technical skill stacks, monospace accents, and quantifiable achievements.',
    bestFor: 'Software Engineering, DevOps, Data Science, Systems Architecture',
    layout: 'single-column',
    atsSafetyScore: 96,
  },
  {
    id: 'pure-ats',
    name: 'Pure ATS Single-Column',
    tagline: 'Maximum machine readability',
    description: 'Strict, conservative linear layout adhering strictly to legacy enterprise ATS parsing parsers.',
    bestFor: 'Fortune 500 enterprises, Government, Healthcare, Workday/Taleo portals',
    layout: 'single-column',
    atsSafetyScore: 100,
  },
  {
    id: 'strategic-sidebar',
    name: 'Strategic Sidebar',
    tagline: 'Two-column asymmetric narrative',
    description: 'Left column anchors verified competencies and credentials; right column details career trajectory.',
    bestFor: 'Creative technologists, Senior ICs, Modern corporate applications',
    layout: 'two-column-split',
    atsSafetyScore: 92,
  },
];

export const COLOR_THEME_CONFIG: Record<
  ResumeColorTheme,
  {
    name: string;
    primary: string;
    light: string;
    text: string;
    border: string;
  }
> = {
  terracotta: {
    name: 'Terracotta (ApplyFocus Brand)',
    primary: '#C6533B',
    light: '#FDF6F4',
    text: '#202124',
    border: '#E8D2CC',
  },
  navy: {
    name: 'Slate Navy',
    primary: '#1E3A8A',
    light: '#EFF6FF',
    text: '#1E293B',
    border: '#CBD5E1',
  },
  forest: {
    name: 'Forest Slate',
    primary: '#065F46',
    light: '#ECFDF5',
    text: '#1F2937',
    border: '#A7F3D0',
  },
  charcoal: {
    name: 'Charcoal Ink',
    primary: '#202124',
    light: '#F8F9FA',
    text: '#202124',
    border: '#E1E3E6',
  },
  monochrome: {
    name: 'Minimal Monochrome',
    primary: '#111827',
    light: '#F9FAFB',
    text: '#111827',
    border: '#D1D5DB',
  },
};

