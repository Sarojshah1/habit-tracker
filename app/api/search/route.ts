import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { Habit } from "@/lib/models/Habit";
import { Note } from "@/lib/models/Note";
import { Goal } from "@/lib/models/Goal";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const url = new URL(req.url);
    const query = url.searchParams.get("q")?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        results: { habits: [], notes: [], goals: [] },
      });
    }

    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    const [habits, notes, goals] = await Promise.all([
      Habit.find({
        userId: user._id,
        $or: [{ name: regex }, { description: regex }],
      })
        .limit(5)
        .select("name description icon color"),
      Note.find({
        userId: user._id,
        $or: [{ title: regex }, { content: regex }],
      })
        .limit(5)
        .select("title content updatedAt"),
      Goal.find({
        userId: user._id,
        $or: [{ title: regex }, { description: regex }],
      })
        .limit(5)
        .select("title description targetValue currentValue unit status"),
    ]);

    return NextResponse.json({
      success: true,
      results: {
        habits: habits.map((h) => ({
          id: h._id.toString(),
          title: h.name,
          subtitle: h.description || "Habit",
          icon: h.icon,
          color: h.color,
          url: `/habits?id=${h._id}`,
          type: "habit",
        })),
        notes: notes.map((n) => ({
          id: n._id.toString(),
          title: n.title,
          subtitle: n.content ? n.content.slice(0, 60) + "..." : "Note",
          url: `/notes?id=${n._id}`,
          type: "note",
        })),
        goals: goals.map((g) => ({
          id: g._id.toString(),
          title: g.title,
          subtitle: `${g.currentValue}/${g.targetValue} ${g.unit} (${g.status})`,
          url: `/goals/${g._id}`,
          type: "goal",
        })),
      },
    });
  } catch (error) {
    console.error("GET /api/search error:", error);
    return NextResponse.json(
      { success: false, message: "Search failed" },
      { status: 500 }
    );
  }
}
