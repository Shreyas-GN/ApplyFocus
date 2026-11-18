"use client";

import Link from "next/link";
import { Wordmark } from "@/components/brand/logo";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { updateProfileSchema, hasAllowedResumeExtension, RESUME_MAX_FILE_SIZE_BYTES } from "@applypilot/validators";
import { FileUp } from "lucide-react";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { api, ApiError } from "@/lib/api-client";
import type { ProfileDto, ResumeDto } from "@/lib/types";

type WizardStep = 1 | 2;
type ResumePhase = "idle" | "uploading" | "processing" | "review" | "confirmed" | "failed";

const PROCESSING_STATUSES = new Set(["uploaded", "extracting", "extracted", "parsing"]);

function resolveResumePhase(resume: ResumeDto): ResumePhase {
  if (resume.reviewStatus === "confirmed") return "confirmed";
  if (resume.processingStatus === "parsed") return "review";
  if (PROCESSING_STATUSES.has(resume.processingStatus)) return "processing";
  if (resume.processingStatus === "failed") return "failed";
  return "processing";
}

export default function OnboardingPage() {
  return (
    <ProtectedRoute>
      <OnboardingWizard />
    </ProtectedRoute>
  );
}

function OnboardingWizard() {
  const router = useRouter();

  const [initLoading, setInitLoading] = useState(true);
  const [step, setStep] = useState<WizardStep>(1);

  // Step 1 state
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Step 2 state
  const [resumePhase, setResumePhase] = useState<ResumePhase>("idle");
  const [currentResume, setCurrentResume] = useState<ResumeDto | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // On mount: fetch profile + resumes to decide where to start
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const [profile, resumes] = await Promise.all([
          api.get<ProfileDto>("/profile"),
          api.get<ResumeDto[]>("/resumes"),
        ]);
        if (cancelled) return;

        // Already fully onboarded — go straight to dashboard
        const confirmedResume = resumes.find((r) => r.reviewStatus === "confirmed");
        if (profile.fullName && confirmedResume) {
          router.replace("/dashboard");
          return;
        }

        // Name is set but no confirmed resume — start at step 2
        if (profile.fullName) {
          setFullName(profile.fullName);
          setHeadline(profile.headline ?? "");
          setLocation(profile.location ?? "");
          const latest = resumes.find((r) => r.isPrimary) ?? resumes[0] ?? null;
          if (latest) {
            setCurrentResume(latest);
            setResumePhase(resolveResumePhase(latest));
          }
          setStep(2);
        } else {
          // Fresh user — pre-fill what we have and show step 1
          setFullName(profile.fullName ?? "");
          setHeadline(profile.headline ?? "");
          setLocation(profile.location ?? "");
        }
      } catch {
        // Fetch failed — show onboarding from step 1
      } finally {
        if (!cancelled) setInitLoading(false);
      }
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Poll while resume is processing
  useEffect(() => {
    if (resumePhase !== "processing" || !currentResume) return;
    const interval = setInterval(async () => {
      try {
        const updated = await api.get<ResumeDto>(`/resumes/${currentResume.id}`);
        setCurrentResume(updated);
        const phase = resolveResumePhase(updated);
        if (phase !== "processing") setResumePhase(phase);
      } catch {
        // Silently retry on next tick
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [resumePhase, currentResume]);

  async function handleProfileSave(event: FormEvent) {
    event.preventDefault();
    const result = updateProfileSchema.safeParse({
      fullName: fullName || undefined,
      headline: headline || undefined,
      location: location || undefined,
    });
    if (!result.success) {
      setProfileError(result.error.issues[0]?.message ?? "Invalid input.");
      return;
    }
    setProfileError(null);
    setSavingProfile(true);
    try {
      await api.patch("/profile", result.data);
      setStep(2);
    } catch (err) {
      setProfileError(err instanceof ApiError ? err.detail : "Something went wrong.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleFileSelected(file: File) {
    setUploadError(null);
    if (!hasAllowedResumeExtension(file.name)) {
      setUploadError("Only .pdf and .docx files are supported.");
      return;
    }
    if (file.size > RESUME_MAX_FILE_SIZE_BYTES) {
      setUploadError(
        `File is too large (max ${RESUME_MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB).`
      );
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    setResumePhase("uploading");
    try {
      const uploaded = await api.upload<ResumeDto>("/resumes/upload", formData);
      setCurrentResume(uploaded);
      setResumePhase("processing");
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.detail : "Upload failed. Please try again.");
      setResumePhase("idle");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (initLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ui-canvas">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-ui-teal border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ui-canvas px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2.5">
          <Wordmark className="h-7 w-auto text-ui-ink" />
        </Link>

        <Card>
          {/* Progress bar */}
          <div className="mb-6">
            <div className="mb-2 flex gap-1.5">
              <div
                className={`h-1 flex-1 rounded-full transition-colors ${step >= 1 ? "bg-ui-teal" : "bg-slate-200"}`}
              />
              <div
                className={`h-1 flex-1 rounded-full transition-colors ${step >= 2 ? "bg-ui-teal" : "bg-slate-200"}`}
              />
            </div>
            <p className="text-xs text-ui-muted">
              Step {step} of 2 —{" "}
              {step === 1 ? "About you" : "Upload your resume"}
            </p>
          </div>

          {/* Hidden file input — shared by all resume upload triggers */}
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

          {step === 1 ? (
            <Step1BasicInfo
              fullName={fullName}
              headline={headline}
              location={location}
              onFullNameChange={setFullName}
              onHeadlineChange={setHeadline}
              onLocationChange={setLocation}
              onSubmit={handleProfileSave}
              onSkip={() => setStep(2)}
              error={profileError}
              submitting={savingProfile}
            />
          ) : (
            <Step2Resume
              phase={resumePhase}
              resume={currentResume}
              uploadError={uploadError}
              onUploadClick={() => fileInputRef.current?.click()}
              onGoToDashboard={() => router.push("/dashboard")}
            />
          )}
        </Card>
      </div>
    </div>
  );
}

function Step1BasicInfo({
  fullName,
  headline,
  location,
  onFullNameChange,
  onHeadlineChange,
  onLocationChange,
  onSubmit,
  onSkip,
  error,
  submitting,
}: {
  fullName: string;
  headline: string;
  location: string;
  onFullNameChange: (v: string) => void;
  onHeadlineChange: (v: string) => void;
  onLocationChange: (v: string) => void;
  onSubmit: (e: FormEvent) => void;
  onSkip: () => void;
  error: string | null;
  submitting: boolean;
}) {
  return (
    <>
      <h1 className="mb-1 text-xl font-semibold text-ui-ink">Tell us about yourself</h1>
      <p className="mb-6 text-sm text-ui-muted">
        Your name and headline help us personalize job matches. All fields are optional — you can
        fill in more later.
      </p>

      {error && (
        <div className="mb-4">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <TextField
          label="Full name"
          name="fullName"
          autoComplete="name"
          value={fullName}
          onChange={(e) => onFullNameChange(e.target.value)}
        />
        <div>
          <TextField
            label="Headline"
            name="headline"
            placeholder="e.g. Senior Software Engineer"
            value={headline}
            onChange={(e) => onHeadlineChange(e.target.value)}
          />
          <p className="mt-1 text-xs text-ui-muted">Shown in job match summaries.</p>
        </div>
        <div>
          <TextField
            label="Location"
            name="location"
            placeholder="e.g. San Francisco, CA"
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
          />
          <p className="mt-1 text-xs text-ui-muted">Used to rank local and hybrid roles.</p>
        </div>
        <Button type="submit" loading={submitting} className="mt-2 w-full">
          Save and continue →
        </Button>
      </form>

      <button
        type="button"
        onClick={onSkip}
        className="mt-4 w-full text-center text-sm text-ui-muted hover:text-ui-ink hover:underline"
      >
        Skip for now
      </button>
    </>
  );
}

function Step2Resume({
  phase,
  resume,
  uploadError,
  onUploadClick,
  onGoToDashboard,
}: {
  phase: ResumePhase;
  resume: ResumeDto | null;
  uploadError: string | null;
  onUploadClick: () => void;
  onGoToDashboard: () => void;
}) {
  return (
    <>
      <h1 className="mb-1 text-xl font-semibold text-ui-ink">Upload your resume</h1>
      <p className="mb-5 text-sm text-ui-muted">
        We&apos;ll automatically extract your experience, skills, and education. You review and
        confirm everything before it&apos;s saved to your profile.
      </p>

      {uploadError && (
        <div className="mb-4">
          <Alert tone="error">{uploadError}</Alert>
        </div>
      )}

      {phase === "idle" && (
        <button
          type="button"
          onClick={onUploadClick}
          className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed border-ui-border bg-ui-linen/40 px-6 py-8 text-center transition hover:border-ui-teal hover:bg-ui-teal-soft/20"
        >
          <FileUp className="h-8 w-8 text-ui-teal" aria-hidden="true" />
          <div>
            <p className="font-medium text-ui-ink">Click to upload a resume</p>
            <p className="mt-0.5 text-xs text-ui-muted">PDF or DOCX, up to 4 MB</p>
          </div>
        </button>
      )}

      {phase === "uploading" && (
        <div className="flex items-center gap-3 rounded-xl border border-ui-border bg-ui-linen/40 p-4">
          <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-ui-teal border-t-transparent" />
          <p className="text-sm text-ui-body">Uploading your resume…</p>
        </div>
      )}

      {phase === "processing" && (
        <div className="flex items-start gap-3 rounded-xl border border-ui-border bg-ui-linen/40 p-4">
          <span className="mt-0.5 h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-ui-teal border-t-transparent" />
          <div>
            <p className="text-sm font-medium text-ui-ink">Analyzing your resume…</p>
            <p className="mt-0.5 text-xs text-ui-muted">
              Extracting experience, skills, and education. This takes a few seconds.
            </p>
          </div>
        </div>
      )}

      {phase === "review" && resume && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
          <div className="mb-3 flex items-start gap-3">
            <span className="mt-0.5 text-lg text-emerald-600" aria-hidden="true">
              ✓
            </span>
            <div>
              <p className="text-sm font-semibold text-ui-ink">Resume parsed — review extracted data</p>
              <p className="mt-0.5 text-xs text-ui-muted">{resume.versionLabel}</p>
              <p className="mt-1.5 text-xs text-ui-body">
                Check what we found, correct anything that looks wrong, then confirm to apply it to
                your profile.
              </p>
            </div>
          </div>
          <Link
            href={`/resumes/${resume.id}/review`}
            className="inline-flex w-full items-center justify-center rounded-[10px] bg-ui-teal px-4 py-2.5 text-sm font-medium text-white transition hover:bg-ui-teal-hover"
          >
            Review extracted data →
          </Link>
        </div>
      )}

      {phase === "confirmed" && resume && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
          <div className="mb-3 flex items-start gap-3">
            <span className="mt-0.5 text-lg text-emerald-600" aria-hidden="true">
              ✓
            </span>
            <div>
              <p className="text-sm font-semibold text-emerald-700">Resume data confirmed</p>
              <p className="mt-0.5 text-xs text-ui-muted">{resume.versionLabel}</p>
              <p className="mt-1.5 text-xs text-ui-body">
                Your profile is ready. Head to your dashboard to explore matched jobs.
              </p>
            </div>
          </div>
          <Button onClick={onGoToDashboard} className="w-full">
            Go to your dashboard →
          </Button>
        </div>
      )}

      {phase === "failed" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">Resume parsing failed</p>
          <p className="mt-1 text-xs text-red-700">
            {resume?.processingError ??
              "We couldn't process this file. Try a different version or format."}
          </p>
          <button
            type="button"
            onClick={onUploadClick}
            className="mt-3 text-sm font-medium text-red-700 underline"
          >
            Try another file
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={onGoToDashboard}
        className="mt-5 w-full text-center text-sm text-ui-muted hover:text-ui-ink hover:underline"
      >
        I&apos;ll do this later
      </button>
    </>
  );
}
