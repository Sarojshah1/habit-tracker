import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { getUserBadges } from "@/lib/services/badges";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const result = await getUserBadges(user._id, user.timezone || "UTC");

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("GET /api/badges error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch badges" },
      { status: 500 }
    );
  }
}
