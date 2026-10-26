import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import Camera from "@/models/Camera";
import Customer from "@/models/Customer";
import User from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_corewatch_key_2026";

// Helper to authenticate request and extract userId
function getUserIdFromAuth(request: Request): string | null {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    return decoded.id;
  } catch (err) {
    console.error("Auth helper error:", err);
    return null;
  }
}

// GET: Retrieve all cameras for the authenticated user
export async function GET(request: Request) {
  try {
    await dbConnect();
    
    const userId = getUserIdFromAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const cameras = await Camera.find({ userId }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, data: cameras });
  } catch (error: any) {
    console.error("GET cameras error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Register a new camera and generate a unique key
export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const userId = getUserIdFromAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    // Check camera limit from subscription
    const userDoc = await User.findById(userId).lean();
    const isTestUser = (userDoc as any)?.email === "test@gmail.com";

    const customer = await Customer.findOne({ user: userId }).lean();
    const isTrial = !isTestUser && customer?.plan === "Demo Free";
    const allowedLimit = isTestUser ? 9999 : (customer ? (customer.cameras ?? (isTrial ? 1 : 5)) : 5);

    const existingCamerasCount = await Camera.countDocuments({ userId });
    if (!isTestUser && existingCamerasCount >= allowedLimit) {
      return NextResponse.json(
        { 
          success: false, 
          error: isTrial
            ? `Trial camera limit reached (1/1 camera). You already registered your trial camera during signup. Please upgrade your plan to add more cameras.`
            : `Camera limit reached. Your current subscription allows up to ${allowedLimit} cameras. Please upgrade your plan to add another camera.` 
        },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { name, ipAddress, port, username, password, rtspUrl, manufacturer, cameraModel, locationName } = body;

    // Determine if this is a full camera registration or legacy auto-provisioning
    const isFullRegistration = !!ipAddress;

    let cameraData: any = {
      userId,
    };

    if (isFullRegistration) {
      // 1. Validation checks
      if (!name || !ipAddress || !port || !username || !password || !rtspUrl) {
        return NextResponse.json(
          { success: false, error: "Please enter all required camera details." },
          { status: 400 }
        );
      }

      // 2. Validate IP / Hostname
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      const hostRegex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;
      
      if (!ipRegex.test(ipAddress) && !hostRegex.test(ipAddress)) {
        return NextResponse.json(
          { success: false, error: "Please enter a valid IP address." },
          { status: 400 }
        );
      }

      // 3. Validate Port
      const portNum = parseInt(port, 10);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        return NextResponse.json(
          { success: false, error: "Please enter a valid port." },
          { status: 400 }
        );
      }

      // 4. Validate RTSP URL
      if (!rtspUrl.startsWith("rtsp://")) {
        return NextResponse.json(
          { success: false, error: "Please enter a valid RTSP URL." },
          { status: 400 }
        );
      }

      // 5. Duplicate Camera Check (IP + Port)
      const duplicate = await Camera.findOne({ userId, ipAddress, port: portNum });
      if (duplicate) {
        return NextResponse.json(
          { success: false, error: "This camera is already registered." },
          { status: 400 }
        );
      }

      cameraData = {
        ...cameraData,
        name,
        ipAddress,
        port: portNum,
        username,
        password, // stored as set: false so won't return in queries
        rtspUrl,
        manufacturer: manufacturer || "Other",
        cameraModel: cameraModel || "",
        locationName: locationName || name, // default to camera name if location is empty
      };
    } else {
      // Legacy auto-provisioning
      cameraData.locationName = locationName || "Default Shop Location";
      cameraData.name = cameraData.locationName;
    }

    // Generate CAM-XXXXXX key
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const cameraKey = `CAM-${randomSuffix}`;
    cameraData.cameraKey = cameraKey;

    const newCamera = await Camera.create(cameraData);

    console.log(`🎥 [Camera Registry] Provisioned new camera ${cameraKey} for user ${userId}`);

    // Return camera object (excluding password by default due to Mongoose Schema definition)
    const returnedCamera = newCamera.toObject();
    delete returnedCamera.password;

    return NextResponse.json({ success: true, data: returnedCamera }, { status: 201 });
  } catch (error: any) {
    console.error("POST camera registration error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// PUT: Update camera configuration (AI toggles, name, etc.)
export async function PUT(request: Request) {
  try {
    await dbConnect();

    const userId = getUserIdFromAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { 
      cameraKey, 
      name, 
      locationName, 
      ipAddress, 
      port, 
      username, 
      password, 
      rtspUrl, 
      manufacturer, 
      cameraModel, 
      humanDetection, 
      zoneMonitoring, 
      afterHoursSecurity, 
      suspiciousMovement, 
      cameraHealth,
      restrictedZoneEntry,
      zoneLoiteringDwell,
      valuableAreaActivity,
      cashCounterActivity,
    } = body;

    if (!cameraKey) {
      return NextResponse.json({ success: false, error: "cameraKey is required to update" }, { status: 400 });
    }

    // Update fields if provided in request using findOneAndUpdate with strict: false to bypass schema caching
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (locationName !== undefined) updateData.locationName = locationName;
    if (ipAddress !== undefined) updateData.ipAddress = ipAddress;
    if (port !== undefined) updateData.port = Number(port);
    if (username !== undefined) updateData.username = username;
    if (password && password.trim().length > 0) updateData.password = password;
    if (rtspUrl !== undefined) updateData.rtspUrl = rtspUrl;
    if (manufacturer !== undefined) updateData.manufacturer = manufacturer;
    if (cameraModel !== undefined) updateData.cameraModel = cameraModel;
    if (humanDetection !== undefined) updateData.humanDetection = humanDetection;
    if (zoneMonitoring !== undefined) updateData.zoneMonitoring = zoneMonitoring;
    if (afterHoursSecurity !== undefined) updateData.afterHoursSecurity = afterHoursSecurity;
    if (suspiciousMovement !== undefined) updateData.suspiciousMovement = suspiciousMovement;
    if (cameraHealth !== undefined) updateData.cameraHealth = cameraHealth;
    if (restrictedZoneEntry !== undefined) updateData.restrictedZoneEntry = restrictedZoneEntry;
    if (zoneLoiteringDwell !== undefined) updateData.zoneLoiteringDwell = zoneLoiteringDwell;
    if (valuableAreaActivity !== undefined) updateData.valuableAreaActivity = valuableAreaActivity;
    if (cashCounterActivity !== undefined) updateData.cashCounterActivity = cashCounterActivity;

    const userDoc = await User.findById(userId).lean();
    const isAdmin = (userDoc as any)?.role === "admin";
    const userObjId = mongoose.isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : userId;
    
    const query: any = { cameraKey };
    if (!isAdmin) {
      query.$or = [{ userId }, { userId: userObjId }];
    }

    const camera = await Camera.findOneAndUpdate(
      query,
      { $set: updateData },
      { new: true, strict: false }
    ).lean();

    if (!camera) {
      return NextResponse.json({ success: false, error: "Camera not found or unauthorized" }, { status: 404 });
    }

    console.log(`🎥 [Camera Config] Updated camera ${cameraKey} settings for user ${userId}`);

    return NextResponse.json({ success: true, data: camera });
  } catch (error: any) {
    console.error("PUT camera settings error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Remove a registered camera
export async function DELETE(request: Request) {
  try {
    await dbConnect();

    const userId = getUserIdFromAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cameraKey = searchParams.get("cameraKey");

    if (!cameraKey) {
      return NextResponse.json({ success: false, error: "cameraKey parameter is required" }, { status: 400 });
    }

    const deleted = await Camera.findOneAndDelete({ cameraKey, userId });
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Camera not found or unauthorized" }, { status: 404 });
    }

    console.log(`🎥 [Camera Registry] Removed camera ${cameraKey} for user ${userId}`);
    return NextResponse.json({ success: true, message: "Camera removed successfully" });
  } catch (error: any) {
    console.error("DELETE camera error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
