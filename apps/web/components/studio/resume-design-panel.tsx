"use client";

import React from "react";
import {
  COLOR_THEME_CONFIG,
  DEFAULT_RESUME_DESIGN_SETTINGS,
  RESUME_TEMPLATES_CATALOG,
  type ResumeColorTheme,
  type ResumeDesignSettings,
  type ResumeFontFamily,
  type ResumeFontSize,
  type ResumeMargins,
  type ResumePageFormat,
  type ResumeSectionKey,
  type ResumeTemplateId,
} from "@/lib/resume/types";
import { Card } from "@/components/ui/card";
import {
  Check,
  MoveUp,
  MoveDown,
  Eye,
  EyeOff,
  Type,
  Layout,
  Palette,
  FileCheck,
  ShieldCheck,
} from "lucide-react";

interface ResumeDesignPanelProps {
  settings: ResumeDesignSettings;
  onChange: (updated: ResumeDesignSettings) => void;
}

const SECTION_LABELS: Record<ResumeSectionKey, string> = {
  summary: "Professional Summary",
  skills: "Core Competencies & Skills",
  experience: "Work Experience",
  projects: "Selected Projects",
  education: "Education & Credentials",
  certifications: "Certifications",
};

export function ResumeDesignPanel({ settings, onChange }: ResumeDesignPanelProps) {
  const current = settings || DEFAULT_RESUME_DESIGN_SETTINGS;
  const sectionOrder = current.sectionOrder || DEFAULT_RESUME_DESIGN_SETTINGS.sectionOrder;
  const sectionVis = current.sectionVisibility || DEFAULT_RESUME_DESIGN_SETTINGS.sectionVisibility;

  function setTemplate(template: ResumeTemplateId) {
    onChange({ ...current, template });
  }

  function setFontFamily(fontFamily: ResumeFontFamily) {
    onChange({ ...current, fontFamily });
  }

  function setFontSize(fontSize: ResumeFontSize) {
    onChange({ ...current, fontSize });
  }

  function setColorTheme(colorTheme: ResumeColorTheme) {
    onChange({ ...current, colorTheme });
  }

  function setPageFormat(pageFormat: ResumePageFormat) {
    onChange({ ...current, pageFormat });
  }

  function setMargins(margins: ResumeMargins) {
    onChange({ ...current, margins });
  }

  function toggleSectionVisibility(key: keyof typeof sectionVis) {
    onChange({
      ...current,
      sectionVisibility: {
        ...sectionVis,
        [key]: !sectionVis[key],
      },
    });
  }

  function moveSection(index: number, direction: "up" | "down") {
    const newOrder = [...sectionOrder];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    const currentItem = newOrder[index];
    const targetItem = newOrder[targetIndex];
    if (currentItem && targetItem) {
      newOrder[index] = targetItem;
      newOrder[targetIndex] = currentItem;
      onChange({ ...current, sectionOrder: newOrder });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Template Archetype Selection */}
      <Card className="p-5">
        <div className="flex items-center gap-2 border-b border-ui-border pb-3">
          <Layout className="h-4 w-4 text-ui-teal" />
          <h3 className="text-sm font-bold text-ui-ink">
            1. Select Resume Archetype Template
          </h3>
        </div>
        <p className="mt-1 text-xs text-ui-muted">
          Choose a layout engineered for your career focus. Each template is rigorously tested against automated ATS parsers.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {RESUME_TEMPLATES_CATALOG.map((tpl) => {
            const isSelected = current.template === tpl.id;
            return (
              <div
                key={tpl.id}
                onClick={() => setTemplate(tpl.id)}
                className={`relative flex cursor-pointer flex-col justify-between rounded-xl border p-4 transition-all ${
                  isSelected
                    ? "border-ui-teal bg-ui-teal-soft/30 ring-2 ring-ui-teal/30 shadow-sm"
                    : "border-ui-border bg-white hover:border-stone-300 hover:shadow-xs"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-ui-ink">
                      {tpl.name}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-semibold text-stone-700">
                      <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      ATS {tpl.atsSafetyScore}%
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-ui-teal">
                    {tpl.tagline}
                  </p>
                  <p className="mt-1.5 text-xs text-ui-muted">
                    {tpl.description}
                  </p>
                </div>

                <div className="mt-3 border-t border-stone-200/60 pt-2 text-[11px] text-stone-500">
                  <span className="font-semibold text-stone-700">Best for:</span> {tpl.bestFor}
                </div>

                {isSelected && (
                  <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-ui-teal text-white">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* 2. Typography & Colors */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Typography */}
        <Card className="p-5">
          <div className="flex items-center gap-2 border-b border-ui-border pb-3">
            <Type className="h-4 w-4 text-ui-teal" />
            <h3 className="text-sm font-bold text-ui-ink">2. Typography & Scale</h3>
          </div>

          <div className="mt-4 flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-ui-ink">Font Family</label>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {[
                  { id: "sans", label: "Clean Sans", sample: "Inter / Sans" },
                  { id: "serif", label: "Executive Serif", sample: "Georgia / Serif" },
                  { id: "mono", label: "Technical Mono", sample: "Code / Mono" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFontFamily(f.id as ResumeFontFamily)}
                    className={`rounded-lg border p-2.5 text-left text-xs transition-all ${
                      current.fontFamily === f.id
                        ? "border-ui-teal bg-ui-teal-soft/40 font-bold text-ui-teal"
                        : "border-ui-border bg-white text-ui-ink hover:bg-stone-50"
                    }`}
                  >
                    <div>{f.label}</div>
                    <div className="mt-0.5 text-[10px] text-ui-muted">{f.sample}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-ui-ink">Density & Font Scale</label>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {[
                  { id: "compact", label: "Compact", sub: "9.5pt (1-Page Fit)" },
                  { id: "standard", label: "Standard", sub: "10.5pt (Balanced)" },
                  { id: "comfortable", label: "Comfortable", sub: "11.5pt (Spacious)" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setFontSize(s.id as ResumeFontSize)}
                    className={`rounded-lg border p-2 text-left text-xs transition-all ${
                      current.fontSize === s.id
                        ? "border-ui-teal bg-ui-teal-soft/40 font-bold text-ui-teal"
                        : "border-ui-border bg-white text-ui-ink hover:bg-stone-50"
                    }`}
                  >
                    <div>{s.label}</div>
                    <div className="text-[10px] text-ui-muted">{s.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Color Palette */}
        <Card className="p-5">
          <div className="flex items-center gap-2 border-b border-ui-border pb-3">
            <Palette className="h-4 w-4 text-ui-teal" />
            <h3 className="text-sm font-bold text-ui-ink">3. Color Accent Palette</h3>
          </div>
          <p className="mt-1 text-xs text-ui-muted">
            Curated, high-contrast palettes that remain fully legible in monochrome print.
          </p>

          <div className="mt-4 flex flex-col gap-2.5">
            {(Object.keys(COLOR_THEME_CONFIG) as ResumeColorTheme[]).map((themeKey) => {
              const cfg = COLOR_THEME_CONFIG[themeKey];
              const isSelected = current.colorTheme === themeKey;
              return (
                <button
                  key={themeKey}
                  type="button"
                  onClick={() => setColorTheme(themeKey)}
                  className={`flex items-center justify-between rounded-lg border p-2.5 text-xs transition-all ${
                    isSelected
                      ? "border-ui-teal bg-ui-teal-soft/40 font-bold text-ui-ink"
                      : "border-ui-border bg-white text-ui-ink hover:bg-stone-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-5 w-5 rounded-full border shadow-2xs"
                      style={{ backgroundColor: cfg.primary }}
                    />
                    <span>{cfg.name}</span>
                  </div>
                  {isSelected && <Check className="h-4 w-4 text-ui-teal" />}
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* 3. Paper Format & Margin Padding */}
      <Card className="p-5">
        <div className="flex items-center gap-2 border-b border-ui-border pb-3">
          <FileCheck className="h-4 w-4 text-ui-teal" />
          <h3 className="text-sm font-bold text-ui-ink">4. Page Standard & Margins</h3>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-ui-ink">Paper Standard</label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPageFormat("letter")}
                className={`rounded-lg border p-2 text-xs transition-all ${
                  current.pageFormat === "letter"
                    ? "border-ui-teal bg-ui-teal-soft/40 font-bold text-ui-teal"
                    : "border-ui-border bg-white text-ui-ink hover:bg-stone-50"
                }`}
              >
                <div>US Letter</div>
                <div className="text-[10px] text-ui-muted">8.5 × 11 in (North America)</div>
              </button>
              <button
                type="button"
                onClick={() => setPageFormat("a4")}
                className={`rounded-lg border p-2 text-xs transition-all ${
                  current.pageFormat === "a4"
                    ? "border-ui-teal bg-ui-teal-soft/40 font-bold text-ui-teal"
                    : "border-ui-border bg-white text-ui-ink hover:bg-stone-50"
                }`}
              >
                <div>ISO A4</div>
                <div className="text-[10px] text-ui-muted">210 × 297 mm (Global)</div>
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-ui-ink">Page Margins</label>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {[
                { id: "compact", label: "Compact", sub: "0.5 in" },
                { id: "standard", label: "Standard", sub: "0.75 in" },
                { id: "spacious", label: "Spacious", sub: "1.0 in" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMargins(m.id as ResumeMargins)}
                  className={`rounded-lg border p-2 text-left text-xs transition-all ${
                    current.margins === m.id
                      ? "border-ui-teal bg-ui-teal-soft/40 font-bold text-ui-teal"
                      : "border-ui-border bg-white text-ui-ink hover:bg-stone-50"
                  }`}
                >
                  <div>{m.label}</div>
                  <div className="text-[10px] text-ui-muted">{m.sub}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* 4. Section Reordering & Visibility Toggles */}
      <Card className="p-5">
        <div className="flex items-center justify-between border-b border-ui-border pb-3">
          <div>
            <h3 className="text-sm font-bold text-ui-ink">
              5. Section Structure & Reordering
            </h3>
            <p className="mt-0.5 text-xs text-ui-muted">
              Reorder sections to prioritize your strongest assets (e.g. skills before experience for career pivots). Toggle sections off if not needed for this application.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {sectionOrder.map((key, index) => {
            const isVisible = sectionVis[key] !== false;
            return (
              <div
                key={key}
                className={`flex items-center justify-between rounded-lg border p-2.5 text-xs transition-all ${
                  isVisible
                    ? "border-ui-border bg-white"
                    : "border-stone-200 bg-stone-100 text-stone-400"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-stone-400 text-xs w-4">
                    {index + 1}.
                  </span>
                  <span className={`font-semibold ${isVisible ? "text-ui-ink" : "text-stone-400 line-through"}`}>
                    {SECTION_LABELS[key]}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => toggleSectionVisibility(key)}
                    className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100"
                    title={isVisible ? "Hide section on resume" : "Show section on resume"}
                  >
                    {isVisible ? (
                      <>
                        <Eye className="h-3.5 w-3.5 text-emerald-600" />
                        Visible
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3.5 w-3.5 text-stone-400" />
                        Hidden
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-0.5 border-l pl-2 border-stone-200">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveSection(index, "up")}
                      className="rounded p-1 text-stone-500 hover:bg-stone-100 disabled:opacity-30"
                      title="Move Up"
                    >
                      <MoveUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === sectionOrder.length - 1}
                      onClick={() => moveSection(index, "down")}
                      className="rounded p-1 text-stone-500 hover:bg-stone-100 disabled:opacity-30"
                      title="Move Down"
                    >
                      <MoveDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
