import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { TimeBlock } from "@/lib/models/TimeBlock";
import { Task } from "@/lib/models/Task";
import { timeBlockSchema } from "@/lib/validations/timeblock";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const url = new URL(req.url);
    const date = url.searchParams.get("date"); // YYYY-MM-DD
    const startStr = url.searchParams.get("start"); // ISO date
    const endStr = url.searchParams.get("end"); // ISO date

    let query: any = { userId: user._id };

    if (date) {
      const dayStart = new Date(`${date}T00:00:00.000Z`);
      const dayEnd = new Date(`${date}T23:59:59.999Z`);
      query.start = { $gte: dayStart, $lte: dayEnd };
    } else if (startStr && endStr) {
      query.start = { $gte: new Date(startStr), $lte: new Date(endStr) };
    }

    const [blocks, scheduledTasks] = await Promise.all([
      TimeBlock.find(query)
        .populate("taskId", "title priority status")
        .populate("habitId", "name icon color")
        .populate("goalId", "title icon color")
        .sort({ start: 1 }),
      // Automatically include scheduled tasks for this time frame
      Task.find({
        userId: user._id,
        scheduledStart: { $exists: true, $ne: null },
        scheduledEnd: { $exists: true, $ne: null },
        ...(date && {
          scheduledStart: {
            $gte: new Date(`${date}T00:00:00.000Z`),
            $lte: new Date(`${date}T23:59:59.999Z`),
          },
        }),
      }).sort({ scheduledStart: 1 }),
    ]);

    // Convert scheduled tasks to time block representations if not already covered by a block
    const taskBlocks = scheduledTasks.map((t) => ({
      _id: `task-block-${t._id}`,
      userId: user._id,
      title: t.title,
      start: t.scheduledStart,
      end: t.scheduledEnd,
      type: "task" as const,
      taskId: t,
      isAutoTask: true,
      color: "#2563EB",
      notes: t.description || "",
    }));

    return NextResponse.json({
      success: true,
      blocks: [...blocks, ...taskBlocks],
    });
  } catch (error) {
    console.error("GET /api/time-blocks error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch time blocks" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const parsed = timeBlockSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.errors[0]?.message || "Invalid time block" },
        { status: 400 }
      );
    }

    const block = await TimeBlock.create({
      ...parsed.data,
      userId: user._id,
      start: new Date(parsed.data.start),
      end: new Date(parsed.data.end),
    });

    return NextResponse.json({ success: true, block }, { status: 201 });
  } catch (error) {
    console.error("POST /api/time-blocks error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create time block" },
      { status: 500 }
    );
  }
}
