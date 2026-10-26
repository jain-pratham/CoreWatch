import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_corewatch_key_2026";

function getUserIdFromAuth(request: Request): string | null {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    return decoded.id;
  } catch {
    return null;
  }
}

const DEFAULT_PREFERENCES = {
  nativeNotificationsEnabled: true,
  soundEnabled: true,
  criticalSound: true,
  highSound: true,
  mediumSound: true,
  lowSound: false,
  masterVolume: 80,
  criticalAlarmRepeatInterval: 8,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  escalationTimeoutMinutes: 5,
  escalationSupervisorEmail: "",
};

// GET: Retrieve user notification preferences
export async function GET(request: Request) {
  try {
    await dbConnect();
    const userId = getUserIdFromAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userObjId = mongoose.isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : userId;
    let userDoc: any = await User.findById(userObjId).lean();

    if (!userDoc) {
      userDoc = await User.findOne({ $or: [{ _id: userObjId }, { email: "test@gmail.com" }] }).lean();
    }

    const prefs = {
      ...DEFAULT_PREFERENCES,
      ...(userDoc?.notificationPreferences || {})
    };

    return NextResponse.json({ success: true, data: prefs, preferences: prefs });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT: Update user notification preferences
export async function PUT(request: Request) {
  try {
    await dbConnect();
    const userId = getUserIdFromAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const newPrefs = body.preferences || body;
    const userObjId = mongoose.isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : userId;

    let userDoc: any = await User.findById(userObjId);
    if (!userDoc) {
      userDoc = await User.findOne({ $or: [{ _id: userObjId }, { email: "test@gmail.com" }] });
    }

    if (!userDoc) {
      userDoc = new User({
        _id: userObjId,
        name: "Security Operator",
        email: `operator_${userId}@corewatch.ai`,
        password: "password_stub",
        notificationPreferences: { ...DEFAULT_PREFERENCES, ...newPrefs }
      });
    } else {
      userDoc.notificationPreferences = {
        ...(userDoc.notificationPreferences || DEFAULT_PREFERENCES),
        ...newPrefs
      };
      userDoc.markModified("notificationPreferences");
    }

    await userDoc.save();

    console.log(`🔔 [Notification Prefs] Updated preferences for user ${userId}`);

    return NextResponse.json({
      success: true,
      data: userDoc.notificationPreferences,
      preferences: userDoc.notificationPreferences
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
