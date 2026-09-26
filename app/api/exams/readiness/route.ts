import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { calculateStudyReadiness } from "@/lib/services/readiness";

export const dynamic = "force-dynamic";

// GET /api/exams/readiness - Calculate target exam countdown and study readiness matrix
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const readiness = await calculateStudyReadiness(
      user._id,
      user.timezone || "Asia/Kathmandu"
    );

    return NextResponse.json({
      success: true,
      data: readiness,
    });
  } catch (error: any) {
    console.error("GET /api/exams/readiness error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to calculate study readiness" },
      { status: 500 }
    );
  }
}
