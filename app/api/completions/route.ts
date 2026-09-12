import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { Habit } from "@/lib/models/Habit";
import { HabitCompletion } from "@/lib/models/HabitCompletion";
import { Goal } from "@/lib/models/Goal";
import { logActivity } from "@/lib/services/activity";
import { calculateGoalProgress, syncGoalCompletionIfTargetReached } from "@/lib/services/goal";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const url = new URL(req.url);
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const habitId = url.searchParams.get("habitId");

    const query: any = { userId: user._id };
    if (habitId) query.habitId = habitId;
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.date = { $gte: startDate };
    } else if (endDate) {
      query.date = { $lte: endDate };
    }

    const completions = await HabitCompletion.find(query).sort({ date: -1 });

    return NextResponse.json({ success: true, completions });
  } catch (error) {
    console.error("GET /api/completions error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch completions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const { habitId, date, status = "completed", notes = "", action } = body;

    if (!habitId || !date) {
      return NextResponse.json(
        { success: false, message: "habitId and date are required" },
        { status: 400 }
      );
    }

    // Verify habit ownership
    const habit = await Habit.findOne({ _id: habitId, userId: user._id });
    if (!habit) {
      return NextResponse.json({ success: false, message: "Habit not found" }, { status: 404 });
    }

    const existing = await HabitCompletion.findOne({
      userId: user._id,
      habitId,
      date,
    });

    // If client requested unmark/toggle off or explicit uncomplete
    if (action === "toggle" && existing && existing.status === status) {
      await HabitCompletion.deleteOne({ _id: existing._id });

      // Synchronize associated active goals
      const goals = await Goal.find({
        userId: user._id,
        $or: [{ habitIds: habit._id }, { associatedHabitIds: habit._id }],
      });

      const timezone = user.timezone || "UTC";
      const remainingCompletions = await HabitCompletion.find({
        userId: user._id,
        status: "completed",
      }).select("habitId date status");

      for (const g of goals) {
        if (g.trackingMode === "automatic") {
          const prog = calculateGoalProgress(g, remainingCompletions, timezone);
          g.currentValue = prog.currentValue;
          if (g.status === "completed" && prog.currentValue < g.targetValue) {
            g.status = "active";
          }
          await g.save();
        }
      }

      return NextResponse.json({
        success: true,
        action: "removed",
        completion: null,
        message: "Habit uncompleted",
      });
    }

    if (action === "remove" || status === "pending" || status === "uncompleted") {
      if (existing) {
        await HabitCompletion.deleteOne({ _id: existing._id });

        const goals = await Goal.find({
          userId: user._id,
          $or: [{ habitIds: habit._id }, { associatedHabitIds: habit._id }],
        });

        const timezone = user.timezone || "UTC";
        const remainingCompletions = await HabitCompletion.find({
          userId: user._id,
          status: "completed",
        }).select("habitId date status");

        for (const g of goals) {
          if (g.trackingMode === "automatic") {
            const prog = calculateGoalProgress(g, remainingCompletions, timezone);
            g.currentValue = prog.currentValue;
            if (g.status === "completed" && prog.currentValue < g.targetValue) {
              g.status = "active";
            }
            await g.save();
          }
        }
      }
      return NextResponse.json({
        success: true,
        action: "removed",
        completion: null,
        message: "Habit uncompleted",
      });
    }

    // Upsert completion record
    const completion = await HabitCompletion.findOneAndUpdate(
      { userId: user._id, habitId, date },
      {
        $set: {
          status,
          notes,
          completedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    // Update associated goals dynamically from completions
    const goals = await Goal.find({
      userId: user._id,
      $or: [{ habitIds: habit._id }, { associatedHabitIds: habit._id }],
    });

    const timezone = user.timezone || "UTC";
    const currentCompletions = await HabitCompletion.find({
      userId: user._id,
      status: "completed",
    }).select("habitId date status");

    for (const g of goals) {
      if (g.trackingMode === "automatic") {
        const prog = calculateGoalProgress(g, currentCompletions, timezone);
        g.currentValue = prog.currentValue;
        if (prog.effectiveStatus === "completed" && g.status === "active") {
          await syncGoalCompletionIfTargetReached(g, prog.currentValue, user._id);
        } else {
          await g.save();
        }
      }
    }

    if (status === "completed" && (!existing || existing.status !== "completed")) {
      await logActivity({
        userId: user._id,
        type: "habit_completed",
        entityId: habit._id,
        entityType: "habit",
        metadata: { habitName: habit.name, date },
      });
    } else if (status === "skipped") {
      await logActivity({
        userId: user._id,
        type: "habit_skipped",
        entityId: habit._id,
        entityType: "habit",
        metadata: { habitName: habit.name, date },
      });
    }

    return NextResponse.json({
      success: true,
      action: "saved",
      completion,
      message: status === "completed" ? "Habit completed!" : "Habit marked as skipped",
    });
  } catch (error) {
    console.error("POST /api/completions error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to record completion" },
      { status: 500 }
    );
  }
}
