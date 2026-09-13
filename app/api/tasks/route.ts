import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { taskSchema } from "@/lib/validations/task";
import { createTask, getUserTasks } from "@/lib/services/task";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "all";
    const priority = url.searchParams.get("priority") || undefined;
    const goalId = url.searchParams.get("goalId") || undefined;
    const habitId = url.searchParams.get("habitId") || undefined;
    const search = url.searchParams.get("search") || undefined;

    const result = await getUserTasks(
      user._id,
      { status, priority, goalId, habitId, search },
      user.timezone || "UTC"
    );

    return NextResponse.json({
      success: true,
      tasks: result.tasks,
      counts: result.counts,
      todayDate: result.todayDate,
    });
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const parsed = taskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.errors[0]?.message || "Invalid task input" },
        { status: 400 }
      );
    }

    const task = await createTask(user._id, parsed.data);

    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/tasks error:", error);
    const status = error.message?.includes("Unauthorized") ? 403 : 500;
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create task" },
      { status }
    );
  }
}
