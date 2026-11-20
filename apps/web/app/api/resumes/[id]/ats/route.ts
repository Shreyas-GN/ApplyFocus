import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/auth/session";
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

  const { id: resumeId } = await params;
  if (!uuidSchema.safeParse(resumeId).success) {
    return NextResponse.json({ detail: "Invalid resume ID" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId");
  if (jobId && !uuidSchema.safeParse(jobId).success) {
    return NextResponse.json({ detail: "Invalid job ID" }, { status: 400 });
  }

  try {
    const analysis = await getOrComputeAtsAnalysis(user.id, resumeId, jobId);
    return NextResponse.json(analysis);
  } catch (error: unknown) {
    console.error("[Resume ATS GET] error:", error);
    const message = error instanceof Error ? error.message : "Failed to analyze resume.";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const { id: resumeId } = await params;
  if (!uuidSchema.safeParse(resumeId).success) {
    return NextResponse.json({ detail: "Invalid resume ID" }, { status: 400 });
  }

  let jobId: string | null = null;
  try {
    const body = await request.json().catch(() => ({}));
    if (body.jobId && uuidSchema.safeParse(body.jobId).success) {
      jobId = body.jobId;
    }
  } catch {
    // optional body
  }

  try {
    const analysis = await getOrComputeAtsAnalysis(user.id, resumeId, jobId);
    return NextResponse.json(analysis);
  } catch (error: unknown) {
    console.error("[Resume ATS POST] error:", error);
    const message = error instanceof Error ? error.message : "Failed to analyze resume.";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}

