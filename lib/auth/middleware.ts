import { NextRequest, NextResponse } from "next/server";
import { getAuthToken, verifyToken, TokenPayload } from "./jwt";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User, IUser } from "@/lib/models/User";

export async function getAuthenticatedUser(req?: NextRequest): Promise<IUser | null> {
  let token: string | undefined;

  if (req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
    if (!token) {
      token = req.cookies.get("habittrack_auth_token")?.value;
    }
  }

  if (!token) {
    token = await getAuthToken();
  }

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload || !payload.userId) {
    return null;
  }

  await connectToDatabase();
  const user = await User.findById(payload.userId).select("-passwordHash");
  return user;
}

export function unauthorizedResponse(message: string = "Unauthorized. Please log in.") {
  return NextResponse.json(
    { success: false, message },
    { status: 401 }
  );
}
