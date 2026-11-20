"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { AtsAnalysisResult, ResumeDto } from "@/lib/types";
import { hasAllowedResumeExtension, RESUME_MAX_FILE_SIZE_BYTES } from "@applypilot/validators";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/badge";
import { api, ApiError } from "@/lib/api-client";
import { useApi } from "@/lib/use-api";
import { AtsIntelligenceBreakdown } from "@/components/jobs/ats-intelligence-breakdown";

const PROCESSING_STATUSES = new Set(["uploaded", "extracting", "extracted", "parsing"]);

export function MyResumesPanel({ embedded = false }: { embedded?: boolean }) {
  const { data: resumes, loading, error, refetch } = useApi<ResumeDto[]>("/resumes");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inspectingResumeId, setInspectingResumeId] = useState<string | null>(null);
  const [atsReport, setAtsReport] = useState<AtsAnalysisResult | null>(null);
  const [atsLoading, setAtsLoading] = useState(false);

  async function handleInspectAts(resumeId: string) {
    if (inspectingResumeId === resumeId) {
      setInspectingResumeId(null);
      setAtsReport(null);
      return;
    }
    setInspectingResumeId(resumeId);
    setAtsLoading(true);
    try {
      const res = await api.get<AtsAnalysisResult>(`/resumes/${resumeId}/ats`);
      setAtsReport(res);
    } catch (err) {
      console.warn("Failed to load ATS analysis:", err);
    } finally {
      setAtsLoading(false);
    }
  }

  const stillProcessing = resumes?.some((r) => PROCESSING_STATUSES.has(r.processingStatus));

  useEffect(() => {
    if (!stillProcessing) return;
    const interval = setInterval(refetch, 2000);
    return () => clearInterval(interval);
  }, [stillProcessing, refetch]);

  async function handleFileSelected(file: File) {
    setUploadError(null);
    if (!hasAllowedResumeExtension(file.name)) {
      setUploadError("Only .pdf and .docx files are supported.");
      return;
    }
    if (file.size > RESUME_MAX_FILE_SIZE_BYTES) {
      setUploadError(`File is too large (max ${RESUME_MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB).`);
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      await api.upload("/resumes/upload", formData);
      refetch();
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.detail : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSetPrimary(id: string) {
    await api.patch(`/resumes/${id}/primary`);
    refetch();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this resume? This can't be undone.")) return;
    await api.delete(`/resumes/${id}`);
    refetch();
  }

  async function handleDownload(id: string) {
    const { url } = await api.get<{ url: string }>(`/resumes/${id}/download-url`);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const uploadControl = (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFileSelected(file);
        }}
      />
      <Button onClick={() => fileInputRef.current?.click()} loading={uploading}>
        Upload resume
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {!embedded && (
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-ui-ink">Resumes</h1>
          {uploadControl}
        </div>
      )}

      {uploadError && <Alert tone="error">{uploadError}</Alert>}

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <CardHeader
            title="Your resumes"
            description="Upload a PDF or DOCX. We'll extract the text and suggest a structured profile for you to review."
          />
          {embedded && uploadControl}
        </div>
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-ui-linen" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-ui-error">Couldn&apos;t load your resumes.</p>
        ) : !resumes || resumes.length === 0 ? (
          <p className="text-sm text-ui-muted">
            No resumes yet. Upload one to get started — we&apos;ll do the rest.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-ui-border">
            {resumes.map((resume) => (
              <li key={resume.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-ui-ink">{resume.versionLabel}</p>
                    {resume.isPrimary && (
                      <span className="rounded-full bg-ui-teal-soft px-2 py-0.5 text-xs font-medium text-ui-teal">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ui-muted">
                    Uploaded {new Date(resume.createdAt).toLocaleDateString()} ·{" "}
                    {(resume.fileSizeBytes / 1024).toFixed(0)} KB
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <StatusBadge status={resume.processingStatus} />
                    {resume.processingStatus === "parsed" && resume.reviewStatus !== "confirmed" && (
                      <StatusBadge status="pending_review" />
                    )}
                    {resume.reviewStatus === "confirmed" && <StatusBadge status="confirmed" />}
                  </div>
                  {resume.processingError && (
                    <p className="mt-1 text-xs text-ui-error">{resume.processingError}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {resume.processingStatus === "parsed" && (
                    <>
                      <Button
                        variant={inspectingResumeId === resume.id ? "secondary" : "ghost"}
                        onClick={() => handleInspectAts(resume.id)}
                      >
                        ATS Check
                      </Button>
                      <Link href={`/resumes/${resume.id}/review`}>
                        <Button variant="secondary">Review</Button>
                      </Link>
                    </>
                  )}
                  <Button variant="ghost" onClick={() => handleDownload(resume.id)}>
                    Download
                  </Button>
                  {!resume.isPrimary && (
                    <Button variant="ghost" onClick={() => handleSetPrimary(resume.id)}>
                      Set primary
                    </Button>
                  )}
                  <Button variant="danger" onClick={() => handleDelete(resume.id)}>
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {inspectingResumeId && (
        <div className="flex flex-col gap-4 rounded-xl border border-ui-border bg-ui-surface p-6">
          <div className="flex items-center justify-between border-b border-ui-border pb-3">
            <div>
              <h3 className="text-base font-bold text-ui-ink">Base Resume ATS Audit</h3>
              <p className="text-xs text-ui-muted">
                Document readability, structural organization, and standard ATS parsing health.
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                setInspectingResumeId(null);
                setAtsReport(null);
              }}
            >
              Close
            </Button>
          </div>

          {atsLoading ? (
            <div className="flex flex-col gap-3 py-6">
              <div className="h-20 animate-pulse rounded-lg bg-ui-linen" />
              <div className="h-44 animate-pulse rounded-lg bg-ui-linen" />
            </div>
          ) : (
            <AtsIntelligenceBreakdown analysis={atsReport} />
          )}
        </div>
      )}
    </div>
  );
}

