"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { ResumeDto, ResumeParsedDataDto } from "@/lib/types";
import { resumeParsedDataSchema } from "@applypilot/validators";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextField, TextAreaField } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import {
  ControlledEntryList,
  type ControlledEntry,
} from "@/components/profile/controlled-entry-list";
import { api, ApiError } from "@/lib/api-client";

type PersonalForm = Record<string, string>;
type Phase = "loading" | "parsing" | "failed" | "ready" | "error";

const PROCESSING_STATUSES = new Set(["uploaded", "extracting", "extracted", "parsing"]);

const PHASE_LABELS: Record<string, string> = {
  uploaded: "Preparing your resume...",
  extracting: "Extracting text from your resume...",
  extracted: "Text extracted — starting AI analysis...",
  parsing: "AI is reading your resume...",
};

export default function ResumeReviewPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <ReviewContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function ReviewContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [resume, setResume] = useState<ResumeDto | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [phaseLabel, setPhaseLabel] = useState<string>("");
  const [parseError, setParseError] = useState<string | null>(null);

  const [personal, setPersonal] = useState<PersonalForm>({});
  const [experience, setExperience] = useState<ControlledEntry[]>([]);
  const [education, setEducation] = useState<ControlledEntry[]>([]);
  const [skills, setSkills] = useState<ControlledEntry[]>([]);
  const [projects, setProjects] = useState<ControlledEntry[]>([]);
  const [certifications, setCertifications] = useState<ControlledEntry[]>([]);
  const [overallConfidence, setOverallConfidence] = useState<number | undefined>();

  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reparsing, setReparsing] = useState(false);

  const populateParsedData = useCallback((parsed: ResumeParsedDataDto) => {
    setPersonal({
      fullName: parsed.personal.fullName ?? "",
      email: parsed.personal.email ?? "",
      phone: parsed.personal.phone ?? "",
      location: parsed.personal.location ?? "",
      linkedinUrl: parsed.personal.linkedinUrl ?? "",
      githubUrl: parsed.personal.githubUrl ?? "",
      portfolioUrl: parsed.personal.portfolioUrl ?? "",
      headline: parsed.personal.headline ?? "",
      summary: parsed.personal.summary ?? "",
    });
    setExperience(
      parsed.experience.map((e) => ({
        source: e.source,
        confidence: e.confidence,
        values: {
          company: e.company,
          title: e.title,
          location: e.location ?? "",
          startDate: e.startDate ?? "",
          endDate: e.endDate ?? "",
          isCurrent: e.isCurrent ?? false,
          description: e.description ?? "",
        },
      })),
    );
    setEducation(
      parsed.education.map((e) => ({
        source: e.source,
        confidence: e.confidence,
        values: {
          institution: e.institution,
          degree: e.degree ?? "",
          fieldOfStudy: e.fieldOfStudy ?? "",
          startDate: e.startDate ?? "",
          endDate: e.endDate ?? "",
          description: e.description ?? "",
        },
      })),
    );
    setSkills(
      parsed.skills.map((s) => ({
        source: s.source,
        confidence: s.confidence,
        values: { name: s.name, category: s.category ?? "" },
      })),
    );
    setProjects(
      parsed.projects.map((p) => ({
        source: p.source,
        confidence: p.confidence,
        values: {
          name: p.name,
          description: p.description ?? "",
          url: p.url ?? "",
          startDate: p.startDate ?? "",
          endDate: p.endDate ?? "",
        },
      })),
    );
    setCertifications(
      parsed.certifications.map((c) => ({
        source: c.source,
        confidence: c.confidence,
        values: {
          name: c.name,
          issuer: c.issuer ?? "",
          issueDate: c.issueDate ?? "",
          expiryDate: c.expiryDate ?? "",
          credentialUrl: c.credentialUrl ?? "",
        },
      })),
    );
    setOverallConfidence(parsed.overallConfidence);
  }, []);

  const loadParsedData = useCallback(async () => {
    try {
      const parsed = await api.get<ResumeParsedDataDto>(`/resumes/${id}/parsed-data`);
      populateParsedData(parsed);
      setPhase("ready");
    } catch (err) {
      setParseError(err instanceof ApiError ? err.detail : "Couldn't load parsed data.");
      setPhase("error");
    }
  }, [id, populateParsedData]);

  // Initial resume load
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const resumeData = await api.get<ResumeDto>(`/resumes/${id}`);
        if (cancelled) return;
        setResume(resumeData);

        if (resumeData.processingStatus === "failed") {
          setParseError(resumeData.processingError ?? "Parsing failed.");
          setPhase("failed");
        } else if (resumeData.processingStatus === "parsed") {
          await loadParsedData();
        } else if (PROCESSING_STATUSES.has(resumeData.processingStatus)) {
          setPhaseLabel(PHASE_LABELS[resumeData.processingStatus] ?? "Processing...");
          setPhase("parsing");
        } else {
          setParseError("Unexpected processing status.");
          setPhase("error");
        }
      } catch (err) {
        if (!cancelled) {
          setParseError(err instanceof ApiError ? err.detail : "Couldn't load this resume.");
          setPhase("error");
        }
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [id, loadParsedData]);

  // Status polling while parsing
  useEffect(() => {
    if (phase !== "parsing") return;

    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const status = await api.get<{ processingStatus: string; error: string | null }>(
          `/resumes/${id}/status`,
        );
        if (cancelled) return;

        const label = PHASE_LABELS[status.processingStatus];
        if (label) setPhaseLabel(label);

        if (status.processingStatus === "parsed") {
          clearInterval(interval);
          await loadParsedData();
        } else if (status.processingStatus === "failed") {
          clearInterval(interval);
          setParseError(status.error ?? "Parsing failed. You can try again.");
          setPhase("failed");
        }
      } catch {
        // Silently ignore transient poll errors
      }
    }, 2000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [phase, id, loadParsedData]);

  function buildPayload() {
    return resumeParsedDataSchema.parse({
      personal: Object.fromEntries(Object.entries(personal).filter(([, v]) => v !== "")),
      experience: experience.map((e) => ({
        company: e.values.company,
        title: e.values.title,
        location: e.values.location || undefined,
        startDate: e.values.startDate || undefined,
        endDate: e.values.endDate || undefined,
        isCurrent: Boolean(e.values.isCurrent),
        description: e.values.description || undefined,
        confidence: e.confidence ?? 1,
        source: e.source,
      })),
      education: education.map((e) => ({
        institution: e.values.institution,
        degree: e.values.degree || undefined,
        fieldOfStudy: e.values.fieldOfStudy || undefined,
        startDate: e.values.startDate || undefined,
        endDate: e.values.endDate || undefined,
        description: e.values.description || undefined,
        confidence: e.confidence ?? 1,
        source: e.source,
      })),
      skills: skills.map((s) => ({
        name: s.values.name,
        category: s.values.category || undefined,
        confidence: s.confidence ?? 1,
        source: s.source,
      })),
      projects: projects.map((p) => ({
        name: p.values.name,
        description: p.values.description || undefined,
        url: p.values.url || undefined,
        startDate: p.values.startDate || undefined,
        endDate: p.values.endDate || undefined,
        confidence: p.confidence ?? 1,
        source: p.source,
      })),
      certifications: certifications.map((c) => ({
        name: c.values.name,
        issuer: c.values.issuer || undefined,
        issueDate: c.values.issueDate || undefined,
        expiryDate: c.values.expiryDate || undefined,
        credentialUrl: c.values.credentialUrl || undefined,
        confidence: c.confidence ?? 1,
        source: c.source,
      })),
      overallConfidence,
    });
  }

  async function handleSaveCorrections() {
    setSaveError(null);
    setSaved(false);
    setSaving(true);
    try {
      const payload = buildPayload();
      await api.patch(`/resumes/${id}/parsed-data`, payload);
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.detail : "Failed to save your corrections.");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirm() {
    setSaveError(null);
    setConfirming(true);
    try {
      const payload = buildPayload();
      await api.patch(`/resumes/${id}/parsed-data`, payload);
      await api.post(`/resumes/${id}/confirm`);
      router.push("/profile");
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.detail : "Failed to confirm this resume.");
    } finally {
      setConfirming(false);
    }
  }

  async function handleReparse() {
    setReparsing(true);
    setSaveError(null);
    try {
      await api.post(`/resumes/${id}/reparse`);
      setParseError(null);
      setPhase("parsing");
      setPhaseLabel("Reparsing your resume...");
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.detail : "Couldn't start reparse.");
      setReparsing(false);
    }
  }

  // ── Loading skeleton ──────────────────────────────────────────
  if (phase === "loading") {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-44 animate-pulse rounded-2xl bg-ui-linen" />
        ))}
      </div>
    );
  }

  // ── Parsing in progress ───────────────────────────────────────
  if (phase === "parsing") {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-6 rounded-2xl border border-ui-border bg-ui-surface p-8 text-center">
        <div
          aria-label="Parsing in progress"
          className="h-10 w-10 animate-spin rounded-full border-4 border-ui-lilac border-t-ui-violet"
        />
        <div>
          <p className="font-semibold text-ui-ink">Analysing your resume</p>
          <p className="mt-1 text-sm text-ui-muted">
            {phaseLabel || "This usually takes 10–30 seconds."}
          </p>
        </div>
        {resume && (
          <p className="rounded-lg bg-ui-linen px-4 py-2 font-mono text-xs text-ui-muted">
            {resume.versionLabel}
          </p>
        )}
      </div>
    );
  }

  // ── Parsing failed ────────────────────────────────────────────
  if (phase === "failed") {
    return (
      <div className="flex flex-col gap-4">
        <Alert tone="error">
          <p className="font-medium">Parsing failed</p>
          {parseError && <p className="mt-1 text-xs">{parseError}</p>}
        </Alert>
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleReparse} loading={reparsing}>
            Try again
          </Button>
          <Button variant="ghost" onClick={() => router.push("/resumes")}>
            Back to resumes
          </Button>
        </div>
        {saveError && <Alert tone="error">{saveError}</Alert>}
      </div>
    );
  }

  // ── Load error ────────────────────────────────────────────────
  if (phase === "error") {
    return (
      <div className="flex flex-col gap-4">
        <Alert tone="error">{parseError ?? "Something went wrong."}</Alert>
        <Button variant="ghost" onClick={() => router.push("/resumes")}>
          Back to resumes
        </Button>
      </div>
    );
  }

  // ── Ready — editable form ─────────────────────────────────────
  const alreadyConfirmed = resume?.reviewStatus === "confirmed";

  return (
    <div className="flex flex-col gap-6 pb-28">
      <div>
        <h1 className="text-2xl font-semibold text-ui-ink">Review parsed resume</h1>
        <p className="mt-1 text-sm text-ui-muted">
          {resume?.versionLabel} — check what we extracted, correct anything that&apos;s wrong,
          then confirm to update your profile.
        </p>
      </div>

      {alreadyConfirmed && (
        <Alert tone="success">
          This resume has already been confirmed. You can edit below and re-confirm to update your
          profile again.
        </Alert>
      )}
      {saveError && <Alert tone="error">{saveError}</Alert>}
      {saved && !saveError && <Alert tone="success">Corrections saved.</Alert>}

      <Card>
        <CardHeader title="Personal information" />
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["fullName", "Full name"],
              ["email", "Email"],
              ["phone", "Phone"],
              ["location", "Location"],
              ["linkedinUrl", "LinkedIn URL"],
              ["githubUrl", "GitHub URL"],
              ["portfolioUrl", "Portfolio URL"],
              ["headline", "Headline"],
            ] as const
          ).map(([key, label]) => (
            <TextField
              key={key}
              name={key}
              label={label}
              value={personal[key] ?? ""}
              onChange={(e) => setPersonal((prev) => ({ ...prev, [key]: e.target.value }))}
            />
          ))}
          <div className="sm:col-span-2">
            <TextAreaField
              name="summary"
              label="Professional summary"
              rows={4}
              value={personal.summary ?? ""}
              onChange={(e) => setPersonal((prev) => ({ ...prev, summary: e.target.value }))}
            />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Work experience" />
        <ControlledEntryList
          items={experience}
          onChange={setExperience}
          emptyLabel="Nothing extracted — add experience manually if you'd like."
          blankValues={{
            company: "",
            title: "",
            location: "",
            startDate: "",
            endDate: "",
            isCurrent: false,
            description: "",
          }}
          fields={[
            { name: "company", label: "Company", type: "text" },
            { name: "title", label: "Title", type: "text" },
            { name: "location", label: "Location", type: "text" },
            { name: "startDate", label: "Start date", type: "text", placeholder: "YYYY-MM" },
            { name: "endDate", label: "End date", type: "text", placeholder: "YYYY-MM" },
            { name: "isCurrent", label: "Currently work here", type: "checkbox" },
            { name: "description", label: "Description", type: "textarea" },
          ]}
        />
      </Card>

      <Card>
        <CardHeader title="Education" />
        <ControlledEntryList
          items={education}
          onChange={setEducation}
          emptyLabel="Nothing extracted — add education manually if you'd like."
          blankValues={{
            institution: "",
            degree: "",
            fieldOfStudy: "",
            startDate: "",
            endDate: "",
            description: "",
          }}
          fields={[
            { name: "institution", label: "Institution", type: "text" },
            { name: "degree", label: "Degree", type: "text" },
            { name: "fieldOfStudy", label: "Field of study", type: "text" },
            { name: "startDate", label: "Start date", type: "text", placeholder: "YYYY-MM" },
            { name: "endDate", label: "End date", type: "text", placeholder: "YYYY-MM" },
            { name: "description", label: "Description", type: "textarea" },
          ]}
        />
      </Card>

      <Card>
        <CardHeader title="Skills" />
        <ControlledEntryList
          items={skills}
          onChange={setSkills}
          emptyLabel="No skills extracted."
          blankValues={{ name: "", category: "" }}
          fields={[
            { name: "name", label: "Skill", type: "text" },
            { name: "category", label: "Category", type: "text" },
          ]}
        />
      </Card>

      <Card>
        <CardHeader title="Projects" />
        <ControlledEntryList
          items={projects}
          onChange={setProjects}
          emptyLabel="Nothing extracted."
          blankValues={{ name: "", description: "", url: "", startDate: "", endDate: "" }}
          fields={[
            { name: "name", label: "Project name", type: "text" },
            { name: "url", label: "URL", type: "text" },
            { name: "startDate", label: "Start date", type: "text", placeholder: "YYYY-MM" },
            { name: "endDate", label: "End date", type: "text", placeholder: "YYYY-MM" },
            { name: "description", label: "Description", type: "textarea" },
          ]}
        />
      </Card>

      <Card>
        <CardHeader title="Certifications" />
        <ControlledEntryList
          items={certifications}
          onChange={setCertifications}
          emptyLabel="Nothing extracted."
          blankValues={{
            name: "",
            issuer: "",
            issueDate: "",
            expiryDate: "",
            credentialUrl: "",
          }}
          fields={[
            { name: "name", label: "Certification name", type: "text" },
            { name: "issuer", label: "Issuer", type: "text" },
            { name: "issueDate", label: "Issue date", type: "text", placeholder: "YYYY-MM" },
            { name: "expiryDate", label: "Expiry date", type: "text", placeholder: "YYYY-MM" },
            { name: "credentialUrl", label: "Credential URL", type: "text" },
          ]}
        />
      </Card>

      {/* Sticky action bar — offset by sidebar on desktop */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-ui-border bg-white/95 shadow-lg backdrop-blur-sm md:left-64">
        <div className="px-4 py-4 sm:px-8">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            <Button
              variant="secondary"
              onClick={handleSaveCorrections}
              loading={saving}
              disabled={confirming}
            >
              Save corrections
            </Button>
            <Button onClick={handleConfirm} loading={confirming} disabled={saving}>
              Confirm and update my profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
