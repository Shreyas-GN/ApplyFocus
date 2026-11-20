"use client";

import React from "react";
import type { TailoredResumeContent } from "@/lib/types";
import {
  COLOR_THEME_CONFIG,
  DEFAULT_RESUME_DESIGN_SETTINGS,
  type ResumeDesignSettings,
  type ResumeSectionKey,
} from "@/lib/resume/types";
import { parseBulletLines } from "@/lib/resume/export";
import { Mail, Phone, MapPin, Globe, ExternalLink } from "lucide-react";

interface TemplateProps {
  content: TailoredResumeContent;
  settings?: ResumeDesignSettings;
  fallbackJobTitle?: string;
  fallbackCompany?: string;
}

export function ResumeRenderer({
  content,
  settings = DEFAULT_RESUME_DESIGN_SETTINGS,
  fallbackJobTitle = "Candidate",
  fallbackCompany = "Company",
}: TemplateProps) {
  const templateId = settings.template || "modern-focus";

  switch (templateId) {
    case "executive-brief":
      return (
        <ExecutiveBriefTemplate
          content={content}
          settings={settings}
          fallbackJobTitle={fallbackJobTitle}
          fallbackCompany={fallbackCompany}
        />
      );
    case "technical-matrix":
      return (
        <TechnicalMatrixTemplate
          content={content}
          settings={settings}
          fallbackJobTitle={fallbackJobTitle}
          fallbackCompany={fallbackCompany}
        />
      );
    case "pure-ats":
      return (
        <PureAtsTemplate
          content={content}
          settings={settings}
          fallbackJobTitle={fallbackJobTitle}
          fallbackCompany={fallbackCompany}
        />
      );
    case "strategic-sidebar":
      return (
        <StrategicSidebarTemplate
          content={content}
          settings={settings}
          fallbackJobTitle={fallbackJobTitle}
          fallbackCompany={fallbackCompany}
        />
      );
    case "modern-focus":
    default:
      return (
        <ModernFocusTemplate
          content={content}
          settings={settings}
          fallbackJobTitle={fallbackJobTitle}
          fallbackCompany={fallbackCompany}
        />
      );
  }
}

function getFontFamilyClass(font?: string): string {
  if (font === "serif") return "font-serif";
  if (font === "mono") return "font-mono";
  return "font-sans";
}

function getFontSizeClass(size?: string): { body: string; h1: string; h2: string; h3: string } {
  if (size === "compact") {
    return {
      body: "text-[11px] leading-snug",
      h1: "text-xl",
      h2: "text-xs tracking-wider",
      h3: "text-xs font-semibold",
    };
  }
  if (size === "comfortable") {
    return {
      body: "text-[13px] leading-relaxed",
      h1: "text-2xl",
      h2: "text-sm tracking-wide",
      h3: "text-sm font-semibold",
    };
  }
  // Standard
  return {
    body: "text-[12px] leading-normal",
    h1: "text-[22px]",
    h2: "text-xs tracking-wider",
    h3: "text-xs font-semibold",
  };
}

function getMarginPadding(margins?: string): string {
  if (margins === "compact") return "p-6 sm:p-8";
  if (margins === "spacious") return "p-10 sm:p-14";
  return "p-8 sm:p-10";
}

// -------------------------------------------------------------
// 1. MODERN FOCUS TEMPLATE (Default ApplyFocus Brand Archetype)
// -------------------------------------------------------------
export function ModernFocusTemplate({
  content,
  settings = DEFAULT_RESUME_DESIGN_SETTINGS,
  fallbackJobTitle,
}: TemplateProps) {
  const theme = COLOR_THEME_CONFIG[settings.colorTheme || "terracotta"];
  const fontClass = getFontFamilyClass(settings.fontFamily);
  const sizeClass = getFontSizeClass(settings.fontSize);
  const paddingClass = getMarginPadding(settings.margins);

  const contact = content.contactInfo ?? {};
  const vis = settings.sectionVisibility ?? {};
  const sectionOrder = settings.sectionOrder ?? DEFAULT_RESUME_DESIGN_SETTINGS.sectionOrder;

  return (
    <div
      className={`relative w-full bg-white text-stone-900 shadow-sm transition-all ${fontClass} ${sizeClass.body} ${paddingClass}`}
      style={{ color: theme.text }}
    >
      {/* Top Header */}
      <div className="border-b pb-4" style={{ borderColor: theme.border }}>
        <h1
          className={`font-bold tracking-tight ${sizeClass.h1}`}
          style={{ color: theme.primary }}
        >
          {contact.fullName || "Candidate"}
        </h1>

        {vis.headline !== false && (
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-stone-600">
            {content.headline || fallbackJobTitle}
          </p>
        )}

        {/* Contact links */}
        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
          {contact.email && (
            <span className="inline-flex items-center gap-1">
              <Mail className="h-3 w-3" style={{ color: theme.primary }} />
              {contact.email}
            </span>
          )}
          {contact.phone && (
            <span className="inline-flex items-center gap-1">
              <Phone className="h-3 w-3" style={{ color: theme.primary }} />
              {contact.phone}
            </span>
          )}
          {contact.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" style={{ color: theme.primary }} />
              {contact.location}
            </span>
          )}
          {vis.contactLinks !== false && contact.linkedinUrl && (
            <span className="inline-flex items-center gap-1">
              <Globe className="h-3 w-3" style={{ color: theme.primary }} />
              LinkedIn
            </span>
          )}
          {vis.contactLinks !== false && contact.githubUrl && (
            <span className="inline-flex items-center gap-1">
              <Globe className="h-3 w-3" style={{ color: theme.primary }} />
              GitHub
            </span>
          )}
          {vis.contactLinks !== false && contact.portfolioUrl && (
            <span className="inline-flex items-center gap-1">
              <ExternalLink className="h-3 w-3" style={{ color: theme.primary }} />
              Portfolio
            </span>
          )}
        </div>
      </div>

      {/* Dynamic Sections */}
      <div className="mt-4 flex flex-col gap-4">
        {sectionOrder.map((sectionKey) => (
          <ModernSectionItem
            key={sectionKey}
            sectionKey={sectionKey}
            content={content}
            vis={vis}
            theme={theme}
            sizeClass={sizeClass}
          />
        ))}
      </div>
    </div>
  );
}

function ModernSectionItem({
  sectionKey,
  content,
  vis,
  theme,
  sizeClass,
}: {
  sectionKey: ResumeSectionKey;
  content: TailoredResumeContent;
  vis: ResumeDesignSettings["sectionVisibility"];
  theme: typeof COLOR_THEME_CONFIG["terracotta"];
  sizeClass: ReturnType<typeof getFontSizeClass>;
}) {
  if (sectionKey === "summary" && vis.summary !== false && content.summary) {
    return (
      <div>
        <h2
          className={`border-b pb-1 font-bold uppercase ${sizeClass.h2}`}
          style={{ borderColor: theme.border, color: theme.primary }}
        >
          Professional Summary
        </h2>
        <p className="mt-2 text-stone-700 leading-relaxed">{content.summary}</p>
      </div>
    );
  }

  if (
    sectionKey === "skills" &&
    vis.skills !== false &&
    content.highlightedSkills &&
    content.highlightedSkills.length > 0
  ) {
    return (
      <div>
        <h2
          className={`border-b pb-1 font-bold uppercase ${sizeClass.h2}`}
          style={{ borderColor: theme.border, color: theme.primary }}
        >
          Core Competencies & Skills
        </h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {content.highlightedSkills.map((s) => (
            <span
              key={s}
              className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium border"
              style={{
                backgroundColor: theme.light,
                borderColor: theme.border,
                color: theme.primary,
              }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (
    sectionKey === "experience" &&
    vis.experience !== false &&
    content.experience &&
    content.experience.length > 0
  ) {
    return (
      <div>
        <h2
          className={`border-b pb-1 font-bold uppercase ${sizeClass.h2}`}
          style={{ borderColor: theme.border, color: theme.primary }}
        >
          Work Experience
        </h2>
        <div className="mt-2.5 flex flex-col gap-3.5">
          {content.experience.map((exp, idx) => {
            const bullets = parseBulletLines(exp.tailoredDescription);
            return (
              <div key={`${exp.company}-${idx}`} className="flex flex-col gap-1">
                <div className="flex flex-wrap items-baseline justify-between gap-1">
                  <span className={`font-bold text-stone-900 ${sizeClass.h3}`}>
                    {exp.title} — <span className="font-semibold text-stone-700">{exp.company}</span>
                  </span>
                  <span className="text-xs text-stone-500 font-medium">
                    {exp.startDate ?? "—"} – {exp.endDate ?? "Present"}
                  </span>
                </div>
                <ul className="flex flex-col gap-1 pl-1">
                  {bullets.map((b, bIdx) => (
                    <li key={bIdx} className="flex items-start gap-2 text-stone-700">
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: theme.primary }}
                      />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (
    sectionKey === "projects" &&
    vis.projects !== false &&
    content.projects &&
    content.projects.length > 0
  ) {
    return (
      <div>
        <h2
          className={`border-b pb-1 font-bold uppercase ${sizeClass.h2}`}
          style={{ borderColor: theme.border, color: theme.primary }}
        >
          Selected Projects
        </h2>
        <div className="mt-2 flex flex-col gap-2.5">
          {content.projects.map((proj, pIdx) => (
            <div key={pIdx} className="flex flex-col gap-0.5">
              <span className={`font-semibold text-stone-900 ${sizeClass.h3}`}>
                {proj.name} {proj.role && <span className="text-xs font-normal text-stone-600">({proj.role})</span>}
              </span>
              {proj.description && <p className="text-xs text-stone-700">{proj.description}</p>}
              {proj.technologies && proj.technologies.length > 0 && (
                <p className="text-[11px] text-stone-500">
                  <span className="font-medium text-stone-600">Tech:</span> {proj.technologies.join(", ")}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (
    sectionKey === "education" &&
    vis.education !== false &&
    content.education &&
    content.education.length > 0
  ) {
    return (
      <div>
        <h2
          className={`border-b pb-1 font-bold uppercase ${sizeClass.h2}`}
          style={{ borderColor: theme.border, color: theme.primary }}
        >
          Education
        </h2>
        <div className="mt-2 flex flex-col gap-1.5">
          {content.education.map((edu, eIdx) => (
            <div key={eIdx} className="flex flex-wrap items-baseline justify-between gap-1 text-xs">
              <span className="font-medium text-stone-900">
                {edu.degree ? `${edu.degree} in ` : ""}
                {edu.fieldOfStudy || "Degree"} —{" "}
                <span className="text-stone-700">{edu.institution}</span>
              </span>
              {edu.graduationYear && (
                <span className="text-xs text-stone-500">{edu.graduationYear}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (
    sectionKey === "certifications" &&
    vis.certifications !== false &&
    content.certifications &&
    content.certifications.length > 0
  ) {
    return (
      <div>
        <h2
          className={`border-b pb-1 font-bold uppercase ${sizeClass.h2}`}
          style={{ borderColor: theme.border, color: theme.primary }}
        >
          Certifications
        </h2>
        <div className="mt-2 flex flex-col gap-1">
          {content.certifications.map((cert, cIdx) => (
            <div key={cIdx} className="flex flex-wrap items-baseline justify-between gap-1 text-xs">
              <span className="font-medium text-stone-900">
                {cert.name} {cert.issuer && <span className="text-stone-600">({cert.issuer})</span>}
              </span>
              {cert.issueDate && <span className="text-stone-500">{cert.issueDate}</span>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

// -------------------------------------------------------------
// 2. EXECUTIVE BRIEF TEMPLATE (Authoritative Serif Archetype)
// -------------------------------------------------------------
export function ExecutiveBriefTemplate({
  content,
  settings = DEFAULT_RESUME_DESIGN_SETTINGS,
  fallbackJobTitle,
}: TemplateProps) {
  const theme = COLOR_THEME_CONFIG[settings.colorTheme || "charcoal"];
  const sizeClass = getFontSizeClass(settings.fontSize);
  const paddingClass = getMarginPadding(settings.margins);

  const contact = content.contactInfo ?? {};
  const vis = settings.sectionVisibility ?? {};
  const sectionOrder = settings.sectionOrder ?? DEFAULT_RESUME_DESIGN_SETTINGS.sectionOrder;

  return (
    <div
      className={`relative w-full bg-white text-stone-900 font-serif shadow-sm ${sizeClass.body} ${paddingClass}`}
      style={{ color: theme.text }}
    >
      {/* Centered Dignified Header */}
      <div className="border-b-2 pb-5 text-center" style={{ borderColor: theme.primary }}>
        <h1 className={`font-bold tracking-tight text-stone-900 ${sizeClass.h1}`}>
          {contact.fullName || "Candidate"}
        </h1>

        {vis.headline !== false && (
          <p className="mt-1 font-sans text-xs font-semibold tracking-widest uppercase text-stone-600">
            {content.headline || fallbackJobTitle}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-sans text-xs text-stone-500">
          {contact.location && <span>{contact.location}</span>}
          {contact.phone && <span>• {contact.phone}</span>}
          {contact.email && <span>• {contact.email}</span>}
          {vis.contactLinks !== false && contact.linkedinUrl && (
            <span>• LinkedIn</span>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4">
        {sectionOrder.map((sectionKey) => (
          <ExecutiveSectionItem
            key={sectionKey}
            sectionKey={sectionKey}
            content={content}
            vis={vis}
            theme={theme}
            sizeClass={sizeClass}
          />
        ))}
      </div>
    </div>
  );
}

function ExecutiveSectionItem({
  sectionKey,
  content,
  vis,
  theme,
  sizeClass,
}: {
  sectionKey: ResumeSectionKey;
  content: TailoredResumeContent;
  vis: ResumeDesignSettings["sectionVisibility"];
  theme: typeof COLOR_THEME_CONFIG["charcoal"];
  sizeClass: ReturnType<typeof getFontSizeClass>;
}) {
  if (sectionKey === "summary" && vis.summary !== false && content.summary) {
    return (
      <div>
        <h2
          className={`border-b pb-1 font-bold uppercase tracking-wider font-sans text-xs`}
          style={{ borderColor: theme.primary, color: theme.primary }}
        >
          Executive Summary
        </h2>
        <p className="mt-2 text-stone-800 leading-relaxed italic">{content.summary}</p>
      </div>
    );
  }

  if (
    sectionKey === "skills" &&
    vis.skills !== false &&
    content.highlightedSkills &&
    content.highlightedSkills.length > 0
  ) {
    return (
      <div>
        <h2
          className={`border-b pb-1 font-bold uppercase tracking-wider font-sans text-xs`}
          style={{ borderColor: theme.primary, color: theme.primary }}
        >
          Areas of Expertise
        </h2>
        <p className="mt-2 text-stone-800 leading-relaxed font-sans text-xs">
          {content.highlightedSkills.join("  •  ")}
        </p>
      </div>
    );
  }

  if (
    sectionKey === "experience" &&
    vis.experience !== false &&
    content.experience &&
    content.experience.length > 0
  ) {
    return (
      <div>
        <h2
          className={`border-b pb-1 font-bold uppercase tracking-wider font-sans text-xs`}
          style={{ borderColor: theme.primary, color: theme.primary }}
        >
          Professional Experience
        </h2>
        <div className="mt-3 flex flex-col gap-4">
          {content.experience.map((exp, idx) => {
            const bullets = parseBulletLines(exp.tailoredDescription);
            return (
              <div key={`${exp.company}-${idx}`} className="flex flex-col gap-1">
                <div className="flex flex-wrap items-baseline justify-between gap-1">
                  <span className="font-bold text-stone-900 text-sm">
                    {exp.title}, <span className="font-normal italic">{exp.company}</span>
                  </span>
                  <span className="font-sans text-xs text-stone-500">
                    {exp.startDate ?? "—"} – {exp.endDate ?? "Present"}
                  </span>
                </div>
                <ul className="flex flex-col gap-1 pl-4 list-disc text-stone-700">
                  {bullets.map((b, bIdx) => (
                    <li key={bIdx} className="leading-relaxed">
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (
    sectionKey === "education" &&
    vis.education !== false &&
    content.education &&
    content.education.length > 0
  ) {
    return (
      <div>
        <h2
          className={`border-b pb-1 font-bold uppercase tracking-wider font-sans text-xs`}
          style={{ borderColor: theme.primary, color: theme.primary }}
        >
          Education & Credentials
        </h2>
        <div className="mt-2 flex flex-col gap-1">
          {content.education.map((edu, eIdx) => (
            <div key={eIdx} className="flex flex-wrap items-baseline justify-between gap-1 text-xs">
              <span className="font-bold text-stone-900">
                {edu.institution} —{" "}
                <span className="font-normal italic">
                  {edu.degree} {edu.fieldOfStudy}
                </span>
              </span>
              {edu.graduationYear && <span>{edu.graduationYear}</span>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

// -------------------------------------------------------------
// 3. TECHNICAL MATRIX TEMPLATE (Dense Engineering Format)
// -------------------------------------------------------------
export function TechnicalMatrixTemplate({
  content,
  settings = DEFAULT_RESUME_DESIGN_SETTINGS,
  fallbackJobTitle,
}: TemplateProps) {
  const theme = COLOR_THEME_CONFIG[settings.colorTheme || "navy"];
  const sizeClass = getFontSizeClass(settings.fontSize);
  const paddingClass = getMarginPadding(settings.margins);

  const contact = content.contactInfo ?? {};
  const vis = settings.sectionVisibility ?? {};
  const sectionOrder = settings.sectionOrder ?? DEFAULT_RESUME_DESIGN_SETTINGS.sectionOrder;

  return (
    <div
      className={`relative w-full bg-white text-stone-900 shadow-sm ${sizeClass.body} ${paddingClass}`}
      style={{ color: theme.text }}
    >
      <div className="flex flex-wrap items-start justify-between gap-2 border-b-2 pb-3" style={{ borderColor: theme.primary }}>
        <div>
          <h1 className={`font-mono font-bold tracking-tight text-stone-900 ${sizeClass.h1}`}>
            {contact.fullName || "Candidate"}
          </h1>
          {vis.headline !== false && (
            <p className="font-mono text-xs font-semibold text-stone-600">
              $ {content.headline || fallbackJobTitle}
            </p>
          )}
        </div>
        <div className="text-right font-mono text-[11px] text-stone-500">
          <div>{contact.location}</div>
          <div>{contact.email}</div>
          <div>{contact.phone}</div>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-3.5">
        {sectionOrder.map((sectionKey) => (
          <TechnicalSectionItem
            key={sectionKey}
            sectionKey={sectionKey}
            content={content}
            vis={vis}
            theme={theme}
            sizeClass={sizeClass}
          />
        ))}
      </div>
    </div>
  );
}

function TechnicalSectionItem({
  sectionKey,
  content,
  vis,
  theme,
  sizeClass,
}: {
  sectionKey: ResumeSectionKey;
  content: TailoredResumeContent;
  vis: ResumeDesignSettings["sectionVisibility"];
  theme: typeof COLOR_THEME_CONFIG["navy"];
  sizeClass: ReturnType<typeof getFontSizeClass>;
}) {
  if (
    sectionKey === "skills" &&
    vis.skills !== false &&
    content.highlightedSkills &&
    content.highlightedSkills.length > 0
  ) {
    return (
      <div>
        <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-stone-900 border-b border-stone-200 pb-0.5">
          {"// TECHNICAL STACK & SKILLS"}
        </h2>
        <div className="mt-1.5 flex flex-wrap gap-1 font-mono text-[11px]">
          {content.highlightedSkills.map((s) => (
            <span
              key={s}
              className="rounded px-1.5 py-0.5 border"
              style={{ backgroundColor: theme.light, borderColor: theme.border, color: theme.primary }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (sectionKey === "summary" && vis.summary !== false && content.summary) {
    return (
      <div>
        <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-stone-900 border-b border-stone-200 pb-0.5">
          {"// ARCHITECTURE & LEADERSHIP SUMMARY"}
        </h2>
        <p className="mt-1 text-stone-700 leading-normal">{content.summary}</p>
      </div>
    );
  }

  if (
    sectionKey === "experience" &&
    vis.experience !== false &&
    content.experience &&
    content.experience.length > 0
  ) {
    return (
      <div>
        <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-stone-900 border-b border-stone-200 pb-0.5">
          {"// ENGINEERING EXPERIENCE"}
        </h2>
        <div className="mt-2 flex flex-col gap-3">
          {content.experience.map((exp, idx) => {
            const bullets = parseBulletLines(exp.tailoredDescription);
            return (
              <div key={`${exp.company}-${idx}`} className="flex flex-col gap-0.5">
                <div className="flex flex-wrap items-baseline justify-between font-mono text-xs font-bold text-stone-900">
                  <span>
                    {exp.title} @ <span style={{ color: theme.primary }}>{exp.company}</span>
                  </span>
                  <span className="font-normal text-stone-500 text-[11px]">
                    [{exp.startDate ?? "—"} – {exp.endDate ?? "Present"}]
                  </span>
                </div>
                <ul className="flex flex-col gap-1 pl-2 text-stone-700">
                  {bullets.map((b, bIdx) => (
                    <li key={bIdx} className="flex items-start gap-1.5">
                      <span className="font-mono text-stone-400">&gt;</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (
    sectionKey === "education" &&
    vis.education !== false &&
    content.education &&
    content.education.length > 0
  ) {
    return (
      <div>
        <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-stone-900 border-b border-stone-200 pb-0.5">
          {"// EDUCATION"}
        </h2>
        <div className="mt-1.5 flex flex-col gap-1 text-xs">
          {content.education.map((edu, eIdx) => (
            <div key={eIdx} className="flex justify-between font-mono text-[11px]">
              <span>
                {edu.institution} | {edu.degree} {edu.fieldOfStudy}
              </span>
              <span>{edu.graduationYear}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

// -------------------------------------------------------------
// 4. PURE ATS TEMPLATE (Ultra-Safe Single Column)
// -------------------------------------------------------------
export function PureAtsTemplate({
  content,
  settings = DEFAULT_RESUME_DESIGN_SETTINGS,
  fallbackJobTitle,
}: TemplateProps) {
  const sizeClass = getFontSizeClass(settings.fontSize);
  const paddingClass = getMarginPadding(settings.margins);

  const contact = content.contactInfo ?? {};
  const vis = settings.sectionVisibility ?? {};

  return (
    <div
      className={`relative w-full bg-white text-black font-sans shadow-sm ${sizeClass.body} ${paddingClass}`}
    >
      {/* Strict ATS Header */}
      <div className="border-b border-black pb-3 text-center">
        <h1 className="text-xl font-bold tracking-normal uppercase">
          {contact.fullName || "Candidate"}
        </h1>
        {vis.headline !== false && (
          <p className="mt-0.5 text-xs font-semibold uppercase">
            {content.headline || fallbackJobTitle}
          </p>
        )}
        <p className="mt-1 text-xs">
          {[contact.location, contact.phone, contact.email, contact.linkedinUrl]
            .filter(Boolean)
            .join(" | ")}
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {vis.summary !== false && content.summary && (
          <div>
            <h2 className="border-b border-black pb-0.5 font-bold uppercase text-xs">
              PROFESSIONAL SUMMARY
            </h2>
            <p className="mt-1 text-xs leading-normal">{content.summary}</p>
          </div>
        )}

        {vis.skills !== false && content.highlightedSkills && content.highlightedSkills.length > 0 && (
          <div>
            <h2 className="border-b border-black pb-0.5 font-bold uppercase text-xs">
              CORE COMPETENCIES & SKILLS
            </h2>
            <p className="mt-1 text-xs leading-normal">
              {content.highlightedSkills.join(", ")}
            </p>
          </div>
        )}

        {vis.experience !== false && content.experience && content.experience.length > 0 && (
          <div>
            <h2 className="border-b border-black pb-0.5 font-bold uppercase text-xs">
              WORK EXPERIENCE
            </h2>
            <div className="mt-2 flex flex-col gap-2.5">
              {content.experience.map((exp, idx) => {
                const bullets = parseBulletLines(exp.tailoredDescription);
                return (
                  <div key={`${exp.company}-${idx}`} className="flex flex-col gap-0.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span>
                        {exp.company} — {exp.title}
                      </span>
                      <span>
                        {exp.startDate ?? "—"} - {exp.endDate ?? "Present"}
                      </span>
                    </div>
                    <ul className="list-disc pl-5 text-xs">
                      {bullets.map((b, bIdx) => (
                        <li key={bIdx}>{b}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {vis.education !== false && content.education && content.education.length > 0 && (
          <div>
            <h2 className="border-b border-black pb-0.5 font-bold uppercase text-xs">
              EDUCATION
            </h2>
            <div className="mt-1 flex flex-col gap-1">
              {content.education.map((edu, eIdx) => (
                <div key={eIdx} className="flex justify-between text-xs">
                  <span>
                    {edu.institution} — {edu.degree} {edu.fieldOfStudy}
                  </span>
                  <span>{edu.graduationYear}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 5. STRATEGIC SIDEBAR TEMPLATE (Two-Column Asymmetric)
// -------------------------------------------------------------
export function StrategicSidebarTemplate({
  content,
  settings = DEFAULT_RESUME_DESIGN_SETTINGS,
  fallbackJobTitle,
}: TemplateProps) {
  const theme = COLOR_THEME_CONFIG[settings.colorTheme || "forest"];
  const sizeClass = getFontSizeClass(settings.fontSize);

  const contact = content.contactInfo ?? {};
  const vis = settings.sectionVisibility ?? {};

  return (
    <div
      className={`relative w-full bg-white text-stone-900 shadow-sm grid grid-cols-12 min-h-[600px] ${sizeClass.body}`}
      style={{ color: theme.text }}
    >
      {/* Left Column Sidebar */}
      <div
        className="col-span-4 p-5 sm:p-6 border-r flex flex-col gap-4"
        style={{ backgroundColor: theme.light, borderColor: theme.border }}
      >
        <div>
          <h1 className="font-bold text-lg text-stone-900" style={{ color: theme.primary }}>
            {contact.fullName || "Candidate"}
          </h1>
          {vis.headline !== false && (
            <p className="mt-0.5 text-xs font-medium text-stone-600">
              {content.headline || fallbackJobTitle}
            </p>
          )}
        </div>

        {/* Contact info */}
        <div className="flex flex-col gap-1.5 text-xs text-stone-600 border-t pt-3" style={{ borderColor: theme.border }}>
          {contact.email && <div className="truncate">{contact.email}</div>}
          {contact.phone && <div>{contact.phone}</div>}
          {contact.location && <div>{contact.location}</div>}
          {vis.contactLinks !== false && contact.linkedinUrl && (
            <div className="text-[11px] font-medium" style={{ color: theme.primary }}>LinkedIn Profile</div>
          )}
        </div>

        {/* Skills sidebar */}
        {vis.skills !== false && content.highlightedSkills && content.highlightedSkills.length > 0 && (
          <div className="border-t pt-3" style={{ borderColor: theme.border }}>
            <h3 className="font-bold uppercase text-[11px] tracking-wider" style={{ color: theme.primary }}>
              Key Competencies
            </h3>
            <div className="mt-2 flex flex-wrap gap-1">
              {content.highlightedSkills.map((s) => (
                <span
                  key={s}
                  className="rounded bg-white px-2 py-0.5 text-[11px] font-medium border text-stone-800"
                  style={{ borderColor: theme.border }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Education sidebar */}
        {vis.education !== false && content.education && content.education.length > 0 && (
          <div className="border-t pt-3" style={{ borderColor: theme.border }}>
            <h3 className="font-bold uppercase text-[11px] tracking-wider" style={{ color: theme.primary }}>
              Education
            </h3>
            <div className="mt-1.5 flex flex-col gap-2 text-xs">
              {content.education.map((edu, eIdx) => (
                <div key={eIdx}>
                  <p className="font-semibold text-stone-900">{edu.institution}</p>
                  <p className="text-[11px] text-stone-600">
                    {edu.degree} {edu.fieldOfStudy}
                  </p>
                  {edu.graduationYear && (
                    <p className="text-[10px] text-stone-400">{edu.graduationYear}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Column Body */}
      <div className="col-span-8 p-6 sm:p-8 flex flex-col gap-4">
        {vis.summary !== false && content.summary && (
          <div>
            <h2
              className="border-b pb-1 font-bold uppercase text-xs tracking-wider"
              style={{ borderColor: theme.border, color: theme.primary }}
            >
              Executive Summary
            </h2>
            <p className="mt-2 text-stone-700 leading-relaxed text-xs">{content.summary}</p>
          </div>
        )}

        {vis.experience !== false && content.experience && content.experience.length > 0 && (
          <div>
            <h2
              className="border-b pb-1 font-bold uppercase text-xs tracking-wider"
              style={{ borderColor: theme.border, color: theme.primary }}
            >
              Professional Experience
            </h2>
            <div className="mt-3 flex flex-col gap-3.5">
              {content.experience.map((exp, idx) => {
                const bullets = parseBulletLines(exp.tailoredDescription);
                return (
                  <div key={`${exp.company}-${idx}`} className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-1 text-xs">
                      <span className="font-bold text-stone-900">
                        {exp.title} — <span className="font-semibold text-stone-700">{exp.company}</span>
                      </span>
                      <span className="text-[11px] text-stone-500">
                        {exp.startDate ?? "—"} – {exp.endDate ?? "Present"}
                      </span>
                    </div>
                    <ul className="flex flex-col gap-1 pl-2 text-xs text-stone-700">
                      {bullets.map((b, bIdx) => (
                        <li key={bIdx} className="flex items-start gap-1.5">
                          <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-stone-400" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

