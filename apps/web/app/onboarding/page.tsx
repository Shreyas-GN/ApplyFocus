"use client";

import { Wordmark } from "@/components/brand/logo";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { api, ApiError } from "@/lib/api-client";
import type { ProfileDto, ResumeDto } from "@/lib/types";
import {
  hasAllowedResumeExtension,
  RESUME_MAX_FILE_SIZE_BYTES,
} from "@applypilot/validators";
import {
  ArrowLeft,
  Briefcase,
  Check,
  ChevronRight,
  FileUp,
  GraduationCap,
  MapPin,
  Sparkles,
  Target,
  X
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type OnboardingStep = 1 | 2 | 3 | 4 | 5;
type CareerStage = "fresher" | "experienced";
type WorkMode = "remote" | "hybrid" | "onsite";
type Currency = "INR" | "USD";

const POPULAR_ROLES = [
  "Full Stack Developer",
  "Frontend Engineer",
  "Backend Engineer",
  "Software Engineer",
  "DevOps Engineer",
  "Data Engineer",
  "Data Analyst",
  "React / Next.js Specialist",
  "Python Developer",
  "Product Manager",
  "Mobile Engineer (Flutter / React Native)",
  "Cloud Solutions Architect",
];

const POPULAR_LOCATIONS = [
  "Bangalore",
  "Hyderabad",
  "Pune",
  "Delhi NCR / Gurgaon",
  "Mumbai",
  "Chennai",
  "Remote India",
  "United States (Remote)",
  "Worldwide / Anywhere",
];

const INR_PRESET_SALARIES = [
  { label: "₹4 LPA", value: 400000 },
  { label: "₹8 LPA", value: 800000 },
  { label: "₹15 LPA", value: 1500000 },
  { label: "₹25 LPA", value: 2500000 },
  { label: "₹40+ LPA", value: 4000000 },
];

const USD_PRESET_SALARIES = [
  { label: "$60k", value: 60000 },
  { label: "$90k", value: 90000 },
  { label: "$120k", value: 120000 },
  { label: "$160k", value: 160000 },
  { label: "$200k+", value: 200000 },
];

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
  const [step, setStep] = useState<OnboardingStep>(1);
  const [saving, setSaving] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Step 1: Career Stage & Identity
  const [fullName, setFullName] = useState("");
  const [careerStage, setCareerStage] = useState<CareerStage>("fresher");
  // If experienced:
  const [currentRole, setCurrentRole] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(0);
  // If fresher:
  const [graduationYear, setGraduationYear] = useState<number>(new Date().getFullYear());
  const [degree, setDegree] = useState("B.Tech / B.E");
  const [institution, setInstitution] = useState("");

  // Step 2: Target Roles
  const [desiredRoles, setDesiredRoles] = useState<string[]>([]);
  const [roleInput, setRoleInput] = useState("");

  // Step 3: Locations & Work Mode
  const [preferredLocations, setPreferredLocations] = useState<string[]>(["Bangalore"]);
  const [locationInput, setLocationInput] = useState("");
  const [workModes, setWorkModes] = useState<WorkMode[]>(["remote", "hybrid"]);

  // Step 4: Salary Floor
  const [currency, setCurrency] = useState<Currency>("INR");
  const [salaryFloor, setSalaryFloor] = useState<number>(800000);
  const [targetSalary, setTargetSalary] = useState<number>(1500000);

  // Step 5: Resume
  const [resumePhase, setResumePhase] = useState<ResumePhase>("idle");
  const [currentResume, setCurrentResume] = useState<ResumeDto | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial load: populate existing profile if available
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const [profile, resumes] = await Promise.all([
          api.get<ProfileDto>("/profile"),
          api.get<ResumeDto[]>("/resumes"),
        ]);
        if (cancelled) return;

        if (profile.fullName) setFullName(profile.fullName);
        if (profile.careerStage === "student" || profile.careerStage === "early_career") {
          setCareerStage("fresher");
        } else if (profile.careerStage) {
          setCareerStage("experienced");
        }

        if (profile.yearsOfExperience !== null && profile.yearsOfExperience !== undefined) {
          setYearsOfExperience(profile.yearsOfExperience);
          if (profile.yearsOfExperience > 0) setCareerStage("experienced");
        }

        if (profile.headline) setCurrentRole(profile.headline);

        const roles = [
          ...(profile.preferredTitles || []),
          ...(profile.desiredRoles || []),
        ];
        if (roles.length > 0) {
          setDesiredRoles(Array.from(new Set(roles)));
        }

        if (profile.preferredLocations && profile.preferredLocations.length > 0) {
          setPreferredLocations(profile.preferredLocations);
        }

        if (profile.workMode) {
          setWorkModes([profile.workMode as WorkMode]);
        }

        if (profile.expectedSalaryMin) {
          setSalaryFloor(profile.expectedSalaryMin);
          if (profile.expectedSalaryMin < 250000) {
            setCurrency("USD");
          }
        }
        if (profile.expectedSalaryMax) {
          setTargetSalary(profile.expectedSalaryMax);
        }

        const latest = resumes.find((r) => r.isPrimary) ?? resumes[0] ?? null;
        if (latest) {
          setCurrentResume(latest);
          setResumePhase(resolveResumePhase(latest));
        }
      } catch {
        // Fall back gracefully
      } finally {
        if (!cancelled) setInitLoading(false);
      }
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, []);

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
        // Silently retry
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [resumePhase, currentResume]);

  function addRole(role: string) {
    const trimmed = role.trim();
    if (!trimmed) return;
    if (!desiredRoles.includes(trimmed)) {
      setDesiredRoles((prev) => [...prev, trimmed]);
    }
    setRoleInput("");
  }

  function removeRole(role: string) {
    setDesiredRoles((prev) => prev.filter((r) => r !== role));
  }

  function addLocation(loc: string) {
    const trimmed = loc.trim();
    if (!trimmed) return;
    if (!preferredLocations.includes(trimmed)) {
      setPreferredLocations((prev) => [...prev, trimmed]);
    }
    setLocationInput("");
  }

  function removeLocation(loc: string) {
    setPreferredLocations((prev) => prev.filter((l) => l !== loc));
  }

  function toggleWorkMode(mode: WorkMode) {
    setWorkModes((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]
    );
  }

  async function persistProgress() {
    setSaving(true);
    setGeneralError(null);
    try {
      // 1. Update basic profile info
      const mappedStage =
        careerStage === "fresher"
          ? "student"
          : yearsOfExperience >= 5
            ? "senior"
            : "mid_level";

      await api.patch("/profile", {
        fullName: fullName || undefined,
        headline:
          careerStage === "fresher"
            ? `Aspiring ${desiredRoles[0] || "Software Engineer"} | ${degree} (${graduationYear})`
            : currentRole || undefined,
        careerStage: mappedStage,
        yearsOfExperience: careerStage === "fresher" ? 0 : yearsOfExperience,
        location: preferredLocations[0] || undefined,
      });

      // 2. Update preferences
      const primaryWorkMode = workModes.length > 0 ? workModes[0] : "remote";
      await api.put("/profile/preferences", {
        preferredTitles: desiredRoles,
        desiredRoles: desiredRoles,
        preferredLocations: preferredLocations,
        workMode: primaryWorkMode,
        expectedSalaryMin: salaryFloor,
        expectedSalaryMax: targetSalary,
      });
    } catch (err) {
      setGeneralError(
        err instanceof ApiError ? err.detail : "Failed to save preferences."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleNextStep() {
    if (step < 5) {
      await persistProgress();
      setStep((s) => (s + 1) as OnboardingStep);
    } else {
      await persistProgress();
      router.push("/jobs?tab=for_you");
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
      setUploadError(
        err instanceof ApiError ? err.detail : "Upload failed. Please try again."
      );
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
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="mx-auto max-w-2xl">
        {/* Brand header */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Wordmark className="h-6 w-auto text-ui-ink" />
          </Link>
          <button
            onClick={() => router.push("/jobs")}
            className="text-xs font-medium text-ui-muted hover:text-ui-ink hover:underline"
          >
            Skip to Jobs feed →
          </button>
        </div>

        {/* Global Progress Indicators */}
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between text-xs font-medium text-ui-muted">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-ui-teal text-[10px] font-bold text-white">
                {step}
              </span>
              <span>
                {step === 1 && "Career Stage & Identity"}
                {step === 2 && "Target Roles & Focus"}
                {step === 3 && "Locations & Work Mode"}
                {step === 4 && "Salary Floor & Currency"}
                {step === 5 && "Resume & Experience"}
              </span>
            </div>
            <span>Step {step} of 5</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? "bg-ui-teal" : "bg-slate-200"
                  }`}
              />
            ))}
          </div>
        </div>

        {generalError && (
          <div className="mb-6">
            <Alert tone="error">{generalError}</Alert>
          </div>
        )}

        <Card className="border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
          {/* STEP 1: CAREER STAGE & IDENTITY */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Where are you in your career journey?
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  This customizes your job stream and prevents irrelevant seniority mismatches.
                </p>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Your Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex Johnson"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-ui-teal focus:outline-none focus:ring-1 focus:ring-ui-teal"
                />
              </div>

              {/* Stage Selection Cards */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Select Experience Tier
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCareerStage("fresher");
                      setYearsOfExperience(0);
                    }}
                    className={`flex flex-col items-start rounded-xl border p-4 text-left transition-all ${careerStage === "fresher"
                        ? "border-ui-teal bg-ui-teal/5 ring-1 ring-ui-teal"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <span className="mt-3 text-sm font-semibold text-slate-900">
                      Fresher / College Student
                    </span>
                    <span className="mt-1 text-xs text-slate-500 leading-relaxed">
                      0-1 years of experience, graduating soon, or transitioning into tech.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCareerStage("experienced");
                      if (yearsOfExperience === 0) setYearsOfExperience(2);
                    }}
                    className={`flex flex-col items-start rounded-xl border p-4 text-left transition-all ${careerStage === "experienced"
                        ? "border-ui-teal bg-ui-teal/5 ring-1 ring-ui-teal"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <span className="mt-3 text-sm font-semibold text-slate-900">
                      Experienced Professional
                    </span>
                    <span className="mt-1 text-xs text-slate-500 leading-relaxed">
                      1+ years in full-time industry roles, looking for career acceleration.
                    </span>
                  </button>
                </div>
              </div>

              {/* Dynamic sub-form */}
              {careerStage === "fresher" ? (
                <div className="rounded-xl bg-slate-50/80 p-4 border border-slate-200/60 space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-700">
                        Degree / Qualification
                      </label>
                      <select
                        value={degree}
                        onChange={(e) => setDegree(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-ui-teal focus:outline-none focus:ring-1 focus:ring-ui-teal"
                      >
                        <option value="B.Tech / B.E">B.Tech / B.E (Engineering)</option>
                        <option value="BCA / MCA">BCA / MCA</option>
                        <option value="B.Sc / M.Sc Computer Science">B.Sc / M.Sc Computer Science</option>
                        <option value="MBA / Business">MBA / Business</option>
                        <option value="Self-Taught / Bootcamp">Self-Taught / Bootcamp</option>
                        <option value="Other Degree">Other Degree</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700">
                        Graduation Year
                      </label>
                      <select
                        value={graduationYear}
                        onChange={(e) => setGraduationYear(Number(e.target.value))}
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-ui-teal focus:outline-none focus:ring-1 focus:ring-ui-teal"
                      >
                        {[2022, 2023, 2024, 2025, 2026, 2027].map((yr) => (
                          <option key={yr} value={yr}>
                            {yr} {yr >= new Date().getFullYear() ? "(Upcoming)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      College / University Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. National Institute of Technology"
                      value={institution}
                      onChange={(e) => setInstitution(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-ui-teal focus:outline-none focus:ring-1 focus:ring-ui-teal"
                    />
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50/80 p-4 border border-slate-200/60 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      Current or Most Recent Job Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Frontend Engineer"
                      value={currentRole}
                      onChange={(e) => setCurrentRole(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-ui-teal focus:outline-none focus:ring-1 focus:ring-ui-teal"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium text-slate-700">
                        Total Years of Industry Experience
                      </label>
                      <span className="text-xs font-bold text-ui-teal">
                        {yearsOfExperience} {yearsOfExperience === 1 ? "year" : "years"}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {[1, 2, 3, 5, 8, 10].map((yr) => (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => setYearsOfExperience(yr)}
                          className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold transition ${yearsOfExperience === yr
                              ? "border-ui-teal bg-ui-teal text-white"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                            }`}
                        >
                          {yr === 10 ? "10+y" : `${yr}y`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: TARGET ROLES & FOCUS */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  What roles are you actively targeting?
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Select or type the titles you want on your feed. We will rank these highest.
                </p>
              </div>

              {/* Tag Input */}
              <div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Full Stack Developer, DevOps..."
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addRole(roleInput);
                      }
                    }}
                    className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-ui-teal focus:outline-none focus:ring-1 focus:ring-ui-teal"
                  />
                  <Button
                    type="button"
                    onClick={() => addRole(roleInput)}
                    className="px-4 text-xs font-semibold"
                  >
                    + Add
                  </Button>
                </div>

                {/* Selected Roles */}
                {desiredRoles.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {desiredRoles.map((role) => (
                      <span
                        key={role}
                        className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800"
                      >
                        <Target className="h-3 w-3 text-teal-600" />
                        {role}
                        <button
                          type="button"
                          onClick={() => removeRole(role)}
                          className="hover:text-red-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Suggestions */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Popular Roles for {careerStage === "fresher" ? "Freshers" : "Experienced Engineers"}
                </label>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {POPULAR_ROLES.map((role) => {
                    const isSelected = desiredRoles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => (isSelected ? removeRole(role) : addRole(role))}
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition ${isSelected
                            ? "border-ui-teal bg-ui-teal text-white"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                          }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                        {role}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: LOCATIONS & WORK MODE */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Where would you like to work?
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Filter out unworkable locations and configure your preferred work mode.
                </p>
              </div>

              {/* Work Mode Toggle Cards */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Acceptable Work Modes (Select all that apply)
                </label>
                <div className="mt-2 grid grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { id: "remote", label: "Remote", sub: "Work anywhere" },
                    { id: "hybrid", label: "Hybrid", sub: "1-3 days in office" },
                    { id: "onsite", label: "On-site", sub: "Full-time office" },
                  ].map((m) => {
                    const isSelected = workModes.includes(m.id as WorkMode);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleWorkMode(m.id as WorkMode)}
                        className={`rounded-xl border p-3 text-center transition ${isSelected
                            ? "border-ui-teal bg-ui-teal/5 ring-1 ring-ui-teal"
                            : "border-slate-200 hover:bg-slate-50"
                          }`}
                      >
                        <div className="text-sm font-semibold text-slate-900">{m.label}</div>
                        <div className="mt-0.5 text-[11px] text-slate-500">{m.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Location Input & Selected Locations */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Target Cities or Regions
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Bangalore, Pune, Remote..."
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addLocation(locationInput);
                      }
                    }}
                    className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-ui-teal focus:outline-none focus:ring-1 focus:ring-ui-teal"
                  />
                  <Button
                    type="button"
                    onClick={() => addLocation(locationInput)}
                    className="px-4 text-xs font-semibold"
                  >
                    + Add
                  </Button>
                </div>

                {preferredLocations.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {preferredLocations.map((loc) => (
                      <span
                        key={loc}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-800"
                      >
                        <MapPin className="h-3 w-3 text-slate-500" />
                        {loc}
                        <button
                          type="button"
                          onClick={() => removeLocation(loc)}
                          className="hover:text-red-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Popular Location Chips */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Quick-Add Major Tech Hubs
                </label>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {POPULAR_LOCATIONS.map((loc) => {
                    const isSelected = preferredLocations.includes(loc);
                    return (
                      <button
                        key={loc}
                        type="button"
                        onClick={() =>
                          isSelected ? removeLocation(loc) : addLocation(loc)
                        }
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition ${isSelected
                            ? "border-ui-teal bg-ui-teal text-white"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                          }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                        {loc}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SALARY FLOOR & EXPECTATIONS */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  What is your minimum salary expectation?
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  We use this as a strict filter to hide underpaid listings and low-ball offers.
                </p>
              </div>

              {/* Currency Switcher */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Currency:
                </span>
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrency("INR");
                      if (salaryFloor < 100000) setSalaryFloor(800000);
                      if (targetSalary < 200000) setTargetSalary(1500000);
                    }}
                    className={`rounded-md px-3 py-1 text-xs font-semibold transition ${currency === "INR"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    ₹ INR (Lakhs)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrency("USD");
                      if (salaryFloor > 500000) setSalaryFloor(90000);
                      if (targetSalary > 1000000) setTargetSalary(130000);
                    }}
                    className={`rounded-md px-3 py-1 text-xs font-semibold transition ${currency === "USD"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    $ USD (Annual)
                  </button>
                </div>
              </div>

              {/* Presets */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Quick Minimum Floor Presets
                </label>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {(currency === "INR" ? INR_PRESET_SALARIES : USD_PRESET_SALARIES).map((p) => {
                    const isSelected = salaryFloor === p.value;
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => {
                          setSalaryFloor(p.value);
                          if (targetSalary <= p.value) {
                            setTargetSalary(Math.round(p.value * 1.5));
                          }
                        }}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${isSelected
                            ? "border-ui-teal bg-ui-teal text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                          }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Exact Numbers */}
              <div className="grid grid-cols-1 gap-4 rounded-xl bg-slate-50 p-4 border border-slate-200 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Minimum Starting Floor ({currency})
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      {currency === "INR" ? "₹" : "$"}
                    </span>
                    <input
                      type="number"
                      step={currency === "INR" ? 50000 : 5000}
                      value={salaryFloor}
                      onChange={(e) => setSalaryFloor(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2 text-sm font-semibold text-slate-900 focus:border-ui-teal focus:outline-none focus:ring-1 focus:ring-ui-teal"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {currency === "INR"
                      ? `₹${(salaryFloor / 100000).toFixed(1)} Lakhs / year minimum`
                      : `$${(salaryFloor / 1000).toFixed(0)}k / year minimum`}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    Target / Aspirational Package ({currency})
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      {currency === "INR" ? "₹" : "$"}
                    </span>
                    <input
                      type="number"
                      step={currency === "INR" ? 50000 : 5000}
                      value={targetSalary}
                      onChange={(e) => setTargetSalary(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2 text-sm font-semibold text-slate-900 focus:border-ui-teal focus:outline-none focus:ring-1 focus:ring-ui-teal"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Used to award &quot;High Value Match&quot; badges on jobs.
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-teal-50/70 p-3 border border-teal-100 flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 text-teal-600 shrink-0" />
                <p className="text-xs text-teal-900">
                  You can change or adjust these thresholds anytime in <strong>Settings → Job Preferences</strong>.
                </p>
              </div>
            </div>
          )}

          {/* STEP 5: RESUME & FINISH */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Upload your resume to calibrate matches
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Our parser extracts your verified skills and experience to calculate 95%+ accurate match scores.
                </p>
              </div>

              {uploadError && (
                <Alert tone="error">{uploadError}</Alert>
              )}

              {/* Hidden file input */}
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

              {resumePhase === "idle" && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 px-6 py-10 text-center transition hover:border-ui-teal hover:bg-teal-50/30"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                    <FileUp className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Click to upload your resume
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      PDF or DOCX format (up to 4 MB)
                    </p>
                  </div>
                </button>
              )}

              {resumePhase === "uploading" && (
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-ui-teal border-t-transparent" />
                  <p className="text-sm font-medium text-slate-700">Uploading resume document…</p>
                </div>
              )}

              {resumePhase === "processing" && (
                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <span className="mt-0.5 h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-ui-teal border-t-transparent" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Extracting verified career data…</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Parsing technical stack, roles, and company affiliations. Almost ready!
                    </p>
                  </div>
                </div>
              )}

              {(resumePhase === "review" || resumePhase === "confirmed") && (
                <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white">
                      <Check className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Resume parsed successfully!
                      </p>
                      <p className="mt-0.5 text-xs text-slate-600">
                        {currentResume?.versionLabel ?? "Primary Resume"}
                      </p>
                      <p className="mt-2 text-xs text-teal-800">
                        Your profile has been seeded with your technical evidence. You can fine-tune or review extracted details in Profile anytime.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {resumePhase === "failed" && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-semibold text-red-900">Parsing failed</p>
                  <p className="mt-1 text-xs text-red-700">
                    {currentResume?.processingError ?? "Could not parse this file format. You can try another file or proceed."}
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 text-xs font-semibold text-red-800 underline"
                  >
                    Try another file
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Action buttons footer */}
          <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as OnboardingStep)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              {step < 5 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s + 1) as OnboardingStep)}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800"
                >
                  Skip this step
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push("/jobs?tab=for_you")}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800"
                >
                  I&apos;ll upload later
                </button>
              )}

              <Button
                type="button"
                loading={saving}
                onClick={handleNextStep}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold shadow-sm"
              >
                {step === 5 ? (
                  <>Explore Matching Jobs →</>
                ) : (
                  <>
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
