import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/auth/session";
import { listResumes } from "@/lib/server/resumes";
import { getOrComputeAtsAnalysis } from "@/lib/server/ats/service";

const uuidSchema = z.string().uuid();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { id: jobId } = await params;
  if (!uuidSchema.safeParse(jobId).success) {
    return NextResponse.json({ detail: "Invalid job ID" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  let resumeId = searchParams.get("resumeId");

  try {
    if (!resumeId) {
      const userResumes = await listResumes(user.id);
      const primary = userResumes.find((r) => r.isPrimary) ?? userResumes[0];
      if (!primary) {
        return NextResponse.json(
          { detail: "No resume found. Please upload a base resume to evaluate ATS readiness." },
          { status: 404 }
        );
      }
      resumeId = primary.id;
    }

    const analysis = await getOrComputeAtsAnalysis(user.id, resumeId, jobId);
    return NextResponse.json({ analysis, resumeId });
  } catch (error: unknown) {
    console.error("[Job ATS GET] error:", error);
    const message = error instanceof Error ? error.message : "Failed to load ATS analysis.";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}

