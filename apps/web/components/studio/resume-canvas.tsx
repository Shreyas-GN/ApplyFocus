"use client";

import React, { useState } from "react";
import type { TailoredResumeContent } from "@/lib/types";
import {
  RESUME_TEMPLATES_CATALOG,
  type ResumeDesignSettings,
  type ResumeTemplateId,
} from "@/lib/resume/types";
import { ResumeRenderer } from "./resume-templates";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  FileText,
  Check,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResumeCanvasProps {
  content: TailoredResumeContent;
  settings: ResumeDesignSettings;
  onUpdateSettings: (newSettings: ResumeDesignSettings) => void;
  fallbackJobTitle?: string;
  fallbackCompany?: string;
  onNavigateToDesign?: () => void;
}

export function ResumeCanvas({
  content,
  settings,
  onUpdateSettings,
  fallbackJobTitle,
  fallbackCompany,
  onNavigateToDesign,
}: ResumeCanvasProps) {
  const [zoom, setZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  function handleZoomChange(delta: number) {
    setZoom((prev) => Math.max(60, Math.min(150, prev + delta)));
  }

  function handleSelectTemplate(id: ResumeTemplateId) {
    onUpdateSettings({
      ...settings,
      template: id,
    });
  }

  // Paper aspect ratio styling:
  // US Letter: 8.5 x 11 (ratio ~1.294)
  // A4: 210 x 297 mm (ratio ~1.414)
  const isA4 = settings.pageFormat === "a4";
  const paperMinHeight = isA4 ? "min-h-[1050px]" : "min-h-[1000px]";

  return (
    <div
      className={`flex flex-col gap-3 ${
        isFullscreen
          ? "fixed inset-0 z-50 overflow-y-auto bg-stone-900/90 p-4 sm:p-8 backdrop-blur-sm"
          : "relative"
      }`}
    >
      {/* Canvas Toolbar & Template Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-ui-border bg-white px-3 py-2 shadow-sm">
        {/* Template Quick Switcher */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-ui-muted mr-1">Template:</span>
          {RESUME_TEMPLATES_CATALOG.map((tpl) => {
            const isSelected = settings.template === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleSelectTemplate(tpl.id)}
                className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-ui-teal text-white shadow-xs"
                    : "bg-ui-canvas text-ui-ink hover:bg-stone-200/70"
                }`}
                title={tpl.description}
              >
                {isSelected && <Check className="h-3 w-3" />}
                {tpl.name}
              </button>
            );
          })}
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-1">
          {onNavigateToDesign && (
            <Button
              variant="secondary"
              className="px-2 py-1 text-xs font-medium text-ui-ink"
              onClick={onNavigateToDesign}
            >
              <Palette className="mr-1 h-3.5 w-3.5 text-ui-teal" />
              Customize Style
            </Button>
          )}

          <div className="flex items-center rounded-md border border-ui-border bg-ui-canvas px-1 py-0.5">
            <button
              type="button"
              onClick={() => handleZoomChange(-10)}
              className="rounded p-1 text-ui-muted hover:text-ui-ink"
              title="Zoom out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] font-medium text-ui-ink">
              {zoom}%
            </span>
            <button
              type="button"
              onClick={() => handleZoomChange(10)}
              className="rounded p-1 text-ui-muted hover:text-ui-ink"
              title="Zoom in"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(100)}
              className="ml-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-ui-muted hover:text-ui-ink"
              title="Reset Zoom to 100%"
            >
              Reset
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="rounded-md border border-ui-border bg-white p-1.5 text-ui-ink hover:bg-ui-canvas"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Preview"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="flex justify-center overflow-x-auto rounded-xl border border-ui-border bg-stone-200/50 p-4 sm:p-8">
        <div
          className="transition-transform duration-150 origin-top"
          style={{ transform: `scale(${zoom / 100})` }}
        >
          {/* Paper Sheet Container */}
          <div
            className={`w-[780px] max-w-full ${paperMinHeight} rounded-sm border border-stone-300 bg-white shadow-xl`}
          >
            <ResumeRenderer
              content={content}
              settings={settings}
              fallbackJobTitle={fallbackJobTitle}
              fallbackCompany={fallbackCompany}
            />
          </div>
        </div>
      </div>

      {/* Page indicator info */}
      <div className="flex items-center justify-between px-2 text-[11px] text-ui-muted">
        <span className="inline-flex items-center gap-1">
          <FileText className="h-3.5 w-3.5" />
          {settings.pageFormat === "a4" ? "ISO A4 (210 × 297 mm)" : "US Letter (8.5 × 11 in)"} •{" "}
          {settings.margins} margins
        </span>
        <span>Live Canvas with Real-Time Style Sync</span>
      </div>
    </div>
  );
}

