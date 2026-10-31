import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
import Camera from "@/models/Camera";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_corewatch_key_2026";

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

export async function POST(request: Request) {
  try {
    await dbConnect();

    const userId = getUserIdFromAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { streamUrl, name, cameraKey: requestedKey, createNew } = body;

    if (!streamUrl || typeof streamUrl !== "string" || !streamUrl.trim()) {
      return NextResponse.json({ success: false, error: "Camera stream URL is required." }, { status: 400 });
    }

    const cleanStreamUrl = streamUrl.trim();
    const cameraName = (name && name.trim()) ? name.trim() : "Direct Camera Feed";

    // 1. Check if user already owns any camera with this exact stream URL or RTSP URL
    const existingCameraWithUrl = await Camera.findOne({
      userId,
      $or: [
        { streamUrl: cleanStreamUrl },
        { rtspUrl: cleanStreamUrl }
      ]
    });

    let camera: any = null;

    if (createNew) {
      // If user is trying to add as a new camera but URL is identical to an existing one, prevent duplicate
      if (existingCameraWithUrl) {
        return NextResponse.json({
          success: false,
          isExisting: true,
          existingCamera: existingCameraWithUrl.toObject(),
          error: `This Camera Stream URL already exists as "${existingCameraWithUrl.name || 'Camera'}" (${existingCameraWithUrl.cameraKey}). To add a new camera, please enter a different stream URL.`
        }, { status: 400 });
      }

      const generatedKey = `CAM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      camera = await Camera.create({
        cameraKey: generatedKey,
        userId,
        name: cameraName,
        locationName: cameraName,
        rtspUrl: cleanStreamUrl,
        streamUrl: cleanStreamUrl,
        streamType: cleanStreamUrl.startsWith("rtsp://") ? "RTSP" : "IP_WEBCAM",
        status: "ONLINE",
        humanDetection: true,
        zoneMonitoring: true,
        afterHoursSecurity: true,
        suspiciousMovement: true,
        cameraHealth: true,
        restrictedZoneEntry: true,
        zoneLoiteringDwell: true,
        valuableAreaActivity: true,
        cashCounterActivity: true,
      });
      console.log(`🎥 [Camera Direct Connect] Provisioned new camera ${camera.cameraKey} with stream URL: ${cleanStreamUrl}`);
    } else {
      // If an existing camera already has this exact URL, simply re-use and activate that camera
      if (existingCameraWithUrl) {
        camera = existingCameraWithUrl;
        camera.status = "ONLINE";
        await camera.save();
        console.log(`🎥 [Camera Direct Connect] Re-activated existing camera ${camera.cameraKey} for stream URL: ${cleanStreamUrl}`);
      } else {
        const cleanKey = (requestedKey && requestedKey.trim()) ? requestedKey.trim() : "CAM-1F8IPF";

        // Check if camera with requestedKey exists for user, or find first camera for user
        camera = await Camera.findOne({ userId, cameraKey: cleanKey }) || await Camera.findOne({ userId });

        // If user doesn't own a camera yet, check if cleanKey exists in collection
        if (!camera && cleanKey) {
          camera = await Camera.findOne({ cameraKey: cleanKey });
        }

        if (camera) {
          // Re-assign or update camera for current user
          camera.userId = userId as any;
          camera.rtspUrl = cleanStreamUrl;
          (camera as any).streamUrl = cleanStreamUrl;
          camera.name = camera.name || cameraName;
          camera.locationName = camera.locationName || cameraName;
          camera.status = "ONLINE";
          await camera.save();
          console.log(`🎥 [Camera Direct Connect] Updated camera ${camera.cameraKey} with stream URL: ${cleanStreamUrl}`);
        } else {
          // Create new camera record
          const newKey = cleanKey || `CAM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          camera = await Camera.create({
            cameraKey: newKey,
            userId,
            name: cameraName,
            locationName: cameraName,
            rtspUrl: cleanStreamUrl,
            streamUrl: cleanStreamUrl,
            streamType: cleanStreamUrl.startsWith("rtsp://") ? "RTSP" : "IP_WEBCAM",
            status: "ONLINE",
            humanDetection: true,
            zoneMonitoring: true,
            afterHoursSecurity: true,
            suspiciousMovement: true,
            cameraHealth: true,
            restrictedZoneEntry: true,
            zoneLoiteringDwell: true,
            valuableAreaActivity: true,
            cashCounterActivity: true,
          });
          console.log(`🎥 [Camera Direct Connect] Provisioned camera ${camera.cameraKey} with stream URL: ${cleanStreamUrl}`);
        }
      }
    }

    // Notify local AI service running on port 8000
    try {
      await fetch("http://localhost:8000/api/camera/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cameraKey: camera.cameraKey,
          streamUrl: cleanStreamUrl,
        }),
        signal: AbortSignal.timeout(2000), // 2s quick timeout
      });
      console.log(`🎥 [Camera Direct Connect] AI service informed to stream from ${cleanStreamUrl}`);
    } catch (aiErr: any) {
      console.warn(`[Camera Direct Connect] Note: AI service not responding on port 8000 (is it started?): ${aiErr.message}`);
    }

    return NextResponse.json({
      success: true,
      message: "Camera stream connected successfully!",
      data: camera.toObject(),
    });
  } catch (error: any) {
    console.error("Direct camera connect error:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}
