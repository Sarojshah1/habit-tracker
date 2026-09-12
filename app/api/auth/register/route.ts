import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/lib/models/User";
import { registerSchema } from "@/lib/validations/auth";
import { signToken, setAuthCookie } from "@/lib/auth/jwt";
import { logActivity } from "@/lib/services/activity";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, password, timezone } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    await connectToDatabase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      timezone: timezone || "UTC",
    });

    const token = signToken({
      userId: newUser._id.toString(),
      email: newUser.email,
    });

    await setAuthCookie(token);

    await logActivity({
      userId: newUser._id,
      type: "note_created",
      metadata: { message: "Welcome to HabitTrack! Account created successfully." },
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          timezone: newUser.timezone,
          avatar: newUser.avatar,
          preferences: newUser.preferences,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error during registration" },
      { status: 500 }
    );
  }
}
