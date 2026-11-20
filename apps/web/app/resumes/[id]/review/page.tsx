"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { ResumeDto, ResumeParsedDataDto, SkillEvidenceCategory } from "@/lib/types";
import { resumeParsedDataSchema } from "@applypilot/validators";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  ControlledEntryList,
  type ControlledEntry,
} from "@/components/profile/controlled-entry-list";
import { api, ApiError } from "@/lib/api-client";
import { calculateProfileStrength } from "@/lib/profile-strength";
import { identifyCandidateTransferableSkills } from "@/lib/transferable-skills";

type PersonalForm = Record<string, string>;

export interface SkillItemState {
  name: string;
  category: string;
  confidence: number;
  source: "ai" | "user";
  evidenceCategory: SkillEvidenceCategory;
  evidenceSentence: string;
  connectedExperience: string;
  connectedProject: string;
}

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
  const [personal, setPersonal] = useState<PersonalForm>({});
  const [experience, setExperience] = useState<ControlledEntry[]>([]);
  const [education, setEducation] = useState<ControlledEntry[]>([]);
  const [skills, setSkills] = useState<SkillItemState[]>([]);
  const [projects, setProjects] = useState<ControlledEntry[]>([]);
  const [certifications, setCertifications] = useState<ControlledEntry[]>([]);
  const [overallConfidence, setOverallConfidence] = useState<number | undefined>();

  const [editingSkillIdx, setEditingSkillIdx] = useState<number | null>(null);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState("");
  const [showAddSkill, setShowAddSkill] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [resumeData, parsed] = await Promise.all([
          api.get<ResumeDto>(`/resumes/${id}`),
          api.get<ResumeParsedDataDto>(`/resumes/${id}/parsed-data`),
        ]);
        if (cancelled) return;
        setResume(resumeData);
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
          yearsOfExperience:
            parsed.personal.yearsOfExperience !== undefined &&
            parsed.personal.yearsOfExperience !== null
              ? String(parsed.personal.yearsOfExperience)
              : "",
          currentRole: parsed.personal.currentRole ?? "",
          careerDomain: parsed.personal.careerDomain ?? "",
          seniorityEstimate: parsed.personal.seniorityEstimate ?? "",
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
              technologies: (e.technologies ?? []).join(", "),
              achievements: (e.achievements ?? []).join("\n"),
              evidenceSentences: (e.evidenceSentences ?? []).join("\n"),
            },
          }))
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
              graduationYear: e.graduationYear ? String(e.graduationYear) : "",
              description: e.description ?? "",
            },
          }))
        );

        setSkills(
          parsed.skills.map((s) => ({
            name: s.name,
            category: s.category ?? "technical",
            confidence: s.confidence ?? 0.85,
            source: s.source,
            evidenceCategory:
              s.evidenceCategory ??
              (s.source === "user" ? "USER_CONFIRMED" : "AI_EXTRACTED"),
            evidenceSentence: s.evidenceSentence ?? "",
            connectedExperience: s.connectedExperience ?? "",
            connectedProject: s.connectedProject ?? "",
          }))
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
              technologies: (p.technologies ?? []).join(", "),
              measurableOutcomes: (p.measurableOutcomes ?? []).join("\n"),
              skillsDemonstrated: (p.skillsDemonstrated ?? []).join(", "),
            },
          }))
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
          }))
        );
        setOverallConfidence(parsed.overallConfidence);
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof ApiError ? err.detail : "Couldn't load this resume's parsed data."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  function splitStringList(val: unknown): string[] {
    if (!val || typeof val !== "string") return [];
    return val
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function buildPayload() {
    const rawYears = personal.yearsOfExperience?.trim();
    const parsedYears = rawYears && !isNaN(Number(rawYears)) ? Number(rawYears) : undefined;

    return resumeParsedDataSchema.parse({
      personal: {
        fullName: personal.fullName || undefined,
        email: personal.email || undefined,
        phone: personal.phone || undefined,
        location: personal.location || undefined,
        linkedinUrl: personal.linkedinUrl || undefined,
        githubUrl: personal.githubUrl || undefined,
        portfolioUrl: personal.portfolioUrl || undefined,
        headline: personal.headline || undefined,
        summary: personal.summary || undefined,
        yearsOfExperience: parsedYears,
        currentRole: personal.currentRole || undefined,
        careerDomain: personal.careerDomain || undefined,
        seniorityEstimate: personal.seniorityEstimate || undefined,
      },
      experience: experience.map((e) => ({
        company: String(e.values.company || ""),
        title: String(e.values.title || ""),
        location: String(e.values.location || "") || undefined,
        startDate: String(e.values.startDate || "") || undefined,
        endDate: String(e.values.endDate || "") || undefined,
        isCurrent: Boolean(e.values.isCurrent),
        description: String(e.values.description || "") || undefined,
        technologies: splitStringList(e.values.technologies),
        achievements: splitStringList(e.values.achievements),
        evidenceSentences: splitStringList(e.values.evidenceSentences),
        confidence: e.confidence ?? 1,
        source: e.source,
      })),
      education: education.map((e) => {
        const gradRaw = String(e.values.graduationYear || "").trim();
        const gradYear = gradRaw && !isNaN(Number(gradRaw)) ? Number(gradRaw) : undefined;
        return {
          institution: String(e.values.institution || ""),
          degree: String(e.values.degree || "") || undefined,
          fieldOfStudy: String(e.values.fieldOfStudy || "") || undefined,
          startDate: String(e.values.startDate || "") || undefined,
          endDate: String(e.values.endDate || "") || undefined,
          graduationYear: gradYear,
          description: String(e.values.description || "") || undefined,
          confidence: e.confidence ?? 1,
          source: e.source,
        };
      }),
      skills: skills.map((s) => ({
        name: s.name,
        category: s.category || undefined,
        confidence: s.confidence ?? 1,
        source: s.source,
        evidenceCategory: s.evidenceCategory,
        evidenceSentence: s.evidenceSentence || undefined,
        connectedExperience: s.connectedExperience || undefined,
        connectedProject: s.connectedProject || undefined,
      })),
      projects: projects.map((p) => ({
        name: String(p.values.name || ""),
        description: String(p.values.description || "") || undefined,
        url: String(p.values.url || "") || undefined,
        startDate: String(p.values.startDate || "") || undefined,
        endDate: String(p.values.endDate || "") || undefined,
        technologies: splitStringList(p.values.technologies),
        measurableOutcomes: splitStringList(p.values.measurableOutcomes),
        skillsDemonstrated: splitStringList(p.values.skillsDemonstrated),
        confidence: p.confidence ?? 1,
        source: p.source,
      })),
      certifications: certifications.map((c) => ({
        name: String(c.values.name || ""),
        issuer: String(c.values.issuer || "") || undefined,
        issueDate: String(c.values.issueDate || "") || undefined,
        expiryDate: String(c.values.expiryDate || "") || undefined,
        credentialUrl: String(c.values.credentialUrl || "") || undefined,
        confidence: c.confidence ?? 1,
        source: c.source,
      })),
      overallConfidence,
    });
  }

  // Profile strength calculation
  const profileStrength = useMemo(() => {
    const rawYears = personal.yearsOfExperience?.trim();
    const parsedYears = rawYears && !isNaN(Number(rawYears)) ? Number(rawYears) : null;

    return calculateProfileStrength({
      personal: {
        fullName: personal.fullName || null,
        email: personal.email || null,
        phone: personal.phone || null,
        location: personal.location || null,
        linkedinUrl: personal.linkedinUrl || null,
        githubUrl: personal.githubUrl || null,
        portfolioUrl: personal.portfolioUrl || null,
        headline: personal.headline || null,
        summary: personal.summary || null,
        yearsOfExperience: parsedYears,
      },
      skills: skills.map((s) => ({
        name: s.name,
        category: s.category,
        evidenceCategory: s.evidenceCategory,
        evidenceSentence: s.evidenceSentence,
        source: s.source,
      })),
      experience: experience.map((e) => ({
        company: String(e.values.company || ""),
        title: String(e.values.title || ""),
        location: String(e.values.location || "") || null,
        startDate: String(e.values.startDate || "") || null,
        endDate: String(e.values.endDate || "") || null,
        isCurrent: Boolean(e.values.isCurrent),
        description: String(e.values.description || "") || null,
        technologies: splitStringList(e.values.technologies),
        achievements: splitStringList(e.values.achievements),
        evidenceSentences: splitStringList(e.values.evidenceSentences),
        source: e.source,
      })),
      projects: projects.map((p) => ({
        name: String(p.values.name || ""),
        description: String(p.values.description || "") || null,
        url: String(p.values.url || "") || null,
        technologies: splitStringList(p.values.technologies),
        measurableOutcomes: splitStringList(p.values.measurableOutcomes),
        skillsDemonstrated: splitStringList(p.values.skillsDemonstrated),
        source: p.source,
      })),
      education: education.map((e) => {
        const gradRaw = String(e.values.graduationYear || "").trim();
        const gradYear = gradRaw && !isNaN(Number(gradRaw)) ? Number(gradRaw) : null;
        return {
          institution: String(e.values.institution || ""),
          degree: String(e.values.degree || "") || null,
          fieldOfStudy: String(e.values.fieldOfStudy || "") || null,
          graduationYear: gradYear,
        };
      }),
    });
  }, [personal, skills, experience, projects, education]);

  // Transferable skills analysis
  const transferableAnalysis = useMemo(() => {
    return identifyCandidateTransferableSkills(
      skills.map((s) => ({
        name: s.name,
        evidenceCategory: s.evidenceCategory,
        evidenceSentence: s.evidenceSentence,
        source: s.source,
      }))
    );
  }, [skills]);

  function handleConfirmSkill(index: number) {
    setSkills((prev) =>
      prev.map((s, idx) =>
        idx === index
          ? {
              ...s,
              evidenceCategory: "USER_CONFIRMED" as const,
              source: "user" as const,
            }
          : s
      )
    );
  }

  function handleRejectSkill(index: number) {
    setSkills((prev) => prev.filter((_, idx) => idx !== index));
    if (editingSkillIdx === index) {
      setEditingSkillIdx(null);
    }
  }

  function handleUpdateSkill(
    index: number,
    updates: Partial<SkillItemState>
  ) {
    setSkills((prev) =>
      prev.map((s, idx) => (idx === index ? { ...s, ...updates } : s))
    );
  }

  function handleAddMissingSkill() {
    if (!newSkillName.trim()) return;
    setSkills((prev) => [
      ...prev,
      {
        name: newSkillName.trim(),
        category: newSkillCategory.trim() || "technical",
        confidence: 1,
        source: "user",
        evidenceCategory: "USER_CONFIRMED",
        evidenceSentence: "Explicitly added by candidate during profile review.",
        connectedExperience: "",
        connectedProject: "",
      },
    ]);
    setNewSkillName("");
    setNewSkillCategory("");
    setShowAddSkill(false);
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

  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl bg-ui-linen" />;
  }

  if (loadError) {
    return <Alert tone="error">{loadError}</Alert>;
  }

  const alreadyConfirmed = resume?.reviewStatus === "confirmed";

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-ui-ink">
            Candidate Understanding Workspace
          </h1>
          <Badge tone="neutral" className="uppercase tracking-wider">
            Phase 2 Engine
          </Badge>
        </div>
        <p className="mt-1.5 text-sm text-ui-muted">
          {resume?.versionLabel} — Review extracted competencies, verify skill provenance, and confirm
          evidence-backed profile intelligence.
        </p>
      </div>

      {alreadyConfirmed && (
        <Alert tone="success">
          This resume&apos;s data has already been confirmed and applied to your profile. You can
          update corrections and re-confirm at any time.
        </Alert>
      )}
      {saveError && <Alert tone="error">{saveError}</Alert>}
      {saved && !saveError && <Alert tone="success">Corrections saved successfully.</Alert>}

      {/* Feature E: Candidate Profile Strength Dashboard */}
      <Card className="border-ui-border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ui-border pb-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-ui-muted">
                Candidate Profile Strength
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-ui-ink">
                  {profileStrength.overallScore}
                </span>
                <span className="text-sm font-medium text-ui-muted">/ 100</span>
                <span
                  className={`ml-2 text-xs font-semibold uppercase tracking-wider ${
                    profileStrength.overallScore >= 80
                      ? "text-ui-success"
                      : profileStrength.overallScore >= 55
                        ? "text-ui-warning"
                        : "text-ui-error"
                  }`}
                >
                  {profileStrength.overallScore >= 80
                    ? "Strong Candidate Signal"
                    : profileStrength.overallScore >= 55
                      ? "Adequate Baseline"
                      : "Needs Attention"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {profileStrength.categoryScores.map((cat) => (
                <div
                  key={cat.category}
                  className="rounded-lg border border-ui-border bg-ui-linen/60 px-2.5 py-1 text-center"
                >
                  <div className="text-[10px] font-semibold uppercase text-ui-muted">
                    {cat.label}
                  </div>
                  <div className="text-xs font-bold text-ui-ink">
                    {cat.score}/{cat.maxScore}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-ui-linen">
            <div
              className={`h-full transition-all duration-300 ${
                profileStrength.overallScore >= 80
                  ? "bg-ui-success"
                  : profileStrength.overallScore >= 55
                    ? "bg-ui-warning"
                    : "bg-[#C6533B]"
              }`}
              style={{ width: `${profileStrength.overallScore}%` }}
            />
          </div>

          {/* Suggestions and Missing Info */}
          {profileStrength.missingInformation.length > 0 && (
            <div className="grid gap-3 pt-1 text-xs sm:grid-cols-2">
              <div className="rounded-md border border-ui-border/70 bg-ui-linen/30 p-3">
                <span className="font-semibold text-ui-ink">Missing from Candidate Profile:</span>
                <ul className="mt-1 list-inside list-disc space-y-0.5 text-ui-muted">
                  {profileStrength.missingInformation.slice(0, 4).map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-md border border-ui-border/70 bg-ui-linen/30 p-3">
                <span className="font-semibold text-ui-ink">Recommended Actions:</span>
                <ul className="mt-1 space-y-1 text-ui-muted">
                  {profileStrength.suggestions.slice(0, 2).map((s) => (
                    <li key={s.id}>
                      <span className="font-medium text-ui-ink">{s.title}:</span> {s.description}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <p className="text-[11px] text-ui-muted italic">{profileStrength.disclaimer}</p>
        </div>
      </Card>

      {/* Feature A: Personal & Professional Profile */}
      <Card>
        <CardHeader
          title="Personal & Professional Positioning"
          description="High-level identity, domain scope, and seniority extracted from your career history."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ["fullName", "Full name"],
              ["headline", "Professional headline"],
              ["currentRole", "Current or most recent role"],
              ["careerDomain", "Career domain"],
              ["seniorityEstimate", "Seniority level"],
              ["yearsOfExperience", "Years of experience (calculable)"],
              ["email", "Contact email"],
              ["phone", "Phone"],
              ["location", "Resident / Target location"],
              ["linkedinUrl", "LinkedIn URL"],
              ["githubUrl", "GitHub URL"],
              ["portfolioUrl", "Portfolio URL"],
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
            <label className="text-xs font-semibold text-ui-ink">Short Professional Summary</label>
            <textarea
              className="mt-1 w-full rounded-md border border-ui-border bg-white p-2.5 text-sm text-ui-ink focus:border-ui-teal focus:outline-none"
              rows={3}
              value={personal.summary ?? ""}
              onChange={(e) => setPersonal((prev) => ({ ...prev, summary: e.target.value }))}
            />
          </div>
        </div>
      </Card>

      {/* Feature B & C: Evidence-Backed Skills Review */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ui-border p-4">
          <div>
            <h2 className="text-base font-semibold text-ui-ink">Evidence-Backed Skills</h2>
            <p className="mt-0.5 text-xs text-ui-muted">
              Every extracted skill is paired with provenance: confirm verified skills, edit details, or reject inaccuracies.
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => setShowAddSkill(!showAddSkill)}
          >
            {showAddSkill ? "Cancel" : "Add Missing Skill"}
          </Button>
        </div>

        <div className="p-4">
          {showAddSkill && (
            <div className="mb-4 rounded-lg border border-ui-teal/30 bg-ui-teal-soft/20 p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-ui-teal">
                Add Missing Skill (Direct Candidate Confirmation)
              </h4>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <TextField
                  name="newSkillName"
                  label="Skill Name"
                  placeholder="e.g. PostgreSQL, Distributed Systems"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                />
                <TextField
                  name="newSkillCategory"
                  label="Category"
                  placeholder="e.g. languages, databases, cloud"
                  value={newSkillCategory}
                  onChange={(e) => setNewSkillCategory(e.target.value)}
                />
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setShowAddSkill(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddMissingSkill}>Save Skill</Button>
              </div>
            </div>
          )}

          {skills.length === 0 ? (
            <p className="text-sm text-ui-muted">No skills extracted yet. Add a skill above.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {skills.map((skill, idx) => {
                const isEditing = editingSkillIdx === idx;
                const isConfirmed = skill.evidenceCategory === "USER_CONFIRMED";
                const isExtracted = skill.evidenceCategory === "AI_EXTRACTED";

                return (
                  <div
                    key={idx}
                    className="flex flex-col gap-2 rounded-lg border border-ui-border bg-white p-3.5 transition-all hover:border-ui-border/80"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ui-ink">{skill.name}</span>
                        {skill.category && (
                          <span className="rounded bg-ui-linen px-2 py-0.5 text-xs text-ui-muted">
                            {skill.category}
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium border ${
                            isConfirmed
                              ? "bg-ui-success-soft text-ui-success border-ui-success/30"
                              : isExtracted
                                ? "bg-ui-teal-soft text-ui-teal border-ui-teal/30"
                                : "bg-ui-warning-soft text-ui-warning border-ui-warning/30"
                          }`}
                        >
                          {isConfirmed
                            ? "USER CONFIRMED"
                            : isExtracted
                              ? "AI EXTRACTED"
                              : "AI SUGGESTED"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isConfirmed && (
                          <Button
                            variant="secondary"
                            onClick={() => handleConfirmSkill(idx)}
                          >
                            Confirm
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          onClick={() => setEditingSkillIdx(isEditing ? null : idx)}
                        >
                          {isEditing ? "Close" : "Edit"}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleRejectSkill(idx)}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>

                    {/* Evidence Provenance Quote & Context */}
                    {!isEditing && (
                      <div className="mt-1 flex flex-col gap-1 text-xs text-ui-muted">
                        {skill.evidenceSentence ? (
                          <div className="flex items-start gap-1">
                            <span className="font-medium text-ui-ink">Evidence:</span>
                            <span className="italic text-ui-body">
                              &ldquo;{skill.evidenceSentence}&rdquo;
                            </span>
                          </div>
                        ) : (
                          <span className="italic text-ui-muted/80">
                            No direct textual quote attached.
                          </span>
                        )}

                        <div className="flex flex-wrap gap-4 pt-0.5 text-[11px]">
                          {skill.connectedExperience && (
                            <span>
                              <strong className="text-ui-ink">Role:</strong>{" "}
                              {skill.connectedExperience}
                            </span>
                          )}
                          {skill.connectedProject && (
                            <span>
                              <strong className="text-ui-ink">Project:</strong>{" "}
                              {skill.connectedProject}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Inline Edit Form */}
                    {isEditing && (
                      <div className="mt-2 grid gap-2.5 rounded-md border border-ui-border bg-ui-linen/40 p-3 text-xs">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <TextField
                            name={`skill-name-${idx}`}
                            label="Skill Name"
                            value={skill.name}
                            onChange={(e) => handleUpdateSkill(idx, { name: e.target.value })}
                          />
                          <TextField
                            name={`skill-category-${idx}`}
                            label="Category"
                            value={skill.category}
                            onChange={(e) => handleUpdateSkill(idx, { category: e.target.value })}
                          />
                        </div>
                        <TextField
                          name={`skill-evidence-${idx}`}
                          label="Resume Evidence Quote"
                          value={skill.evidenceSentence}
                          onChange={(e) =>
                            handleUpdateSkill(idx, { evidenceSentence: e.target.value })
                          }
                        />
                        <div className="grid gap-2 sm:grid-cols-2">
                          <TextField
                            name={`skill-exp-${idx}`}
                            label="Connected Experience / Employer"
                            value={skill.connectedExperience}
                            onChange={(e) =>
                              handleUpdateSkill(idx, { connectedExperience: e.target.value })
                            }
                          />
                          <TextField
                            name={`skill-project-${idx}`}
                            label="Connected Project"
                            value={skill.connectedProject}
                            onChange={(e) =>
                              handleUpdateSkill(idx, { connectedProject: e.target.value })
                            }
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => setEditingSkillIdx(null)}
                          >
                            Done Editing
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Feature D: Transferable Skills Intelligence Preview */}
      {transferableAnalysis.highConfidenceBridges.length > 0 && (
        <Card className="border-ui-border bg-white p-5">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-ui-ink">
                Transferable Skills Intelligence
              </h3>
              <Badge tone="neutral">Deterministic Taxonomy</Badge>
            </div>
            <p className="text-xs text-ui-muted">
              Identified competencies that bridge directly from your confirmed background to adjacent roles.
              These are suggestions and are not automatically added as confirmed candidate skills.
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {transferableAnalysis.highConfidenceBridges.slice(0, 4).map((bridge, i) => (
                <div
                  key={i}
                  className="flex flex-col justify-between rounded-lg border border-ui-border/80 bg-ui-linen/30 p-3.5"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[#C6533B]">
                        {bridge.sourceSkill} → {bridge.transferableSkill}
                      </span>
                      <span className="text-ui-muted">
                        {Math.round(bridge.confidence * 100)}% confidence
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] font-medium text-ui-muted">
                      {bridge.relationship} ({bridge.category})
                    </div>
                    <p className="mt-1.5 text-xs text-ui-body">{bridge.evidence}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Feature A: Work Experience Review */}
      <Card>
        <CardHeader
          title="Work Experience"
          description="Review roles, responsibilities, quantifiable achievements, and demonstrated technologies."
        />
        <ControlledEntryList
          items={experience}
          onChange={setExperience}
          emptyLabel="No experience extracted — add experience manually."
          blankValues={{
            company: "",
            title: "",
            location: "",
            startDate: "",
            endDate: "",
            isCurrent: false,
            description: "",
            technologies: "",
            achievements: "",
            evidenceSentences: "",
          }}
          fields={[
            { name: "company", label: "Company", type: "text" },
            { name: "title", label: "Title", type: "text" },
            { name: "location", label: "Location", type: "text" },
            { name: "startDate", label: "Start date", type: "text", placeholder: "YYYY-MM" },
            { name: "endDate", label: "End date", type: "text", placeholder: "YYYY-MM" },
            { name: "isCurrent", label: "Currently work here", type: "checkbox" },
            {
              name: "technologies",
              label: "Technologies Used (comma separated)",
              type: "text",
              placeholder: "e.g. React, TypeScript, PostgreSQL",
            },
            {
              name: "achievements",
              label: "Measurable Achievements & Outcomes",
              type: "textarea",
              placeholder: "Bullet points detailing quantified impact and results.",
            },
            {
              name: "evidenceSentences",
              label: "Evidence Sentences Supporting Skills",
              type: "textarea",
              placeholder: "Resume sentences that prove your skill proficiency.",
            },
            { name: "description", label: "General Role Scope & Description", type: "textarea" },
          ]}
        />
      </Card>

      {/* Feature A: Projects Review */}
      <Card>
        <CardHeader
          title="Projects & Technical Demonstrations"
          description="Technical projects with live URLs, technologies, measurable outcomes, and skills demonstrated."
        />
        <ControlledEntryList
          items={projects}
          onChange={setProjects}
          emptyLabel="No projects extracted."
          blankValues={{
            name: "",
            description: "",
            url: "",
            startDate: "",
            endDate: "",
            technologies: "",
            measurableOutcomes: "",
            skillsDemonstrated: "",
          }}
          fields={[
            { name: "name", label: "Project name", type: "text" },
            { name: "url", label: "Repository or Live URL", type: "text" },
            { name: "startDate", label: "Start date", type: "text", placeholder: "YYYY-MM" },
            { name: "endDate", label: "End date", type: "text", placeholder: "YYYY-MM" },
            {
              name: "technologies",
              label: "Technologies Used (comma separated)",
              type: "text",
            },
            {
              name: "measurableOutcomes",
              label: "Measurable Outcomes / Metrics",
              type: "textarea",
            },
            {
              name: "skillsDemonstrated",
              label: "Skills Demonstrated (comma separated)",
              type: "text",
            },
            { name: "description", label: "Description", type: "textarea" },
          ]}
        />
      </Card>

      {/* Feature A: Education Review */}
      <Card>
        <CardHeader
          title="Education"
          description="Academic credentials, graduation year, and degree specializations."
        />
        <ControlledEntryList
          items={education}
          onChange={setEducation}
          emptyLabel="No education history extracted."
          blankValues={{
            institution: "",
            degree: "",
            fieldOfStudy: "",
            startDate: "",
            endDate: "",
            graduationYear: "",
            description: "",
          }}
          fields={[
            { name: "institution", label: "Institution", type: "text" },
            { name: "degree", label: "Degree", type: "text" },
            { name: "fieldOfStudy", label: "Field of study", type: "text" },
            { name: "graduationYear", label: "Graduation year", type: "text", placeholder: "YYYY" },
            { name: "startDate", label: "Start date", type: "text", placeholder: "YYYY-MM" },
            { name: "endDate", label: "End date", type: "text", placeholder: "YYYY-MM" },
            { name: "description", label: "Description", type: "textarea" },
          ]}
        />
      </Card>

      {/* Certifications Review */}
      <Card>
        <CardHeader title="Certifications" />
        <ControlledEntryList
          items={certifications}
          onChange={setCertifications}
          emptyLabel="No certifications extracted."
          blankValues={{ name: "", issuer: "", issueDate: "", expiryDate: "", credentialUrl: "" }}
          fields={[
            { name: "name", label: "Certification name", type: "text" },
            { name: "issuer", label: "Issuer", type: "text" },
            { name: "issueDate", label: "Issue date", type: "text", placeholder: "YYYY-MM" },
            { name: "expiryDate", label: "Expiry date", type: "text", placeholder: "YYYY-MM" },
            { name: "credentialUrl", label: "Credential URL", type: "text" },
          ]}
        />
      </Card>

      {/* Action Footer */}
      <div className="sticky bottom-4 z-20 flex justify-end gap-3 rounded-xl border border-ui-border bg-white p-4 shadow-xl">
        <Button variant="secondary" onClick={handleSaveCorrections} loading={saving}>
          Save corrections
        </Button>
        <Button onClick={handleConfirm} loading={confirming}>
          Confirm and Apply to Profile
        </Button>
      </div>
    </div>
  );
}
