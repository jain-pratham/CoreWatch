import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import dbConnect from "@/lib/dbConnect";
import Alert from "@/models/Alert";
import Camera from "@/models/Camera";
import User from "@/models/User";
import { alertEmitter } from "@/lib/alertEvents";

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

// GET: Retrieve alerts with rich security incident filters and pagination
export async function GET(request: Request) {
  try {
    await dbConnect();
    
    const userId = getUserIdFromAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status"); // ALL, NEW, ACKNOWLEDGED, RESOLVED, UNRESOLVED
    const severityParam = searchParams.get("severity"); // ALL, CRITICAL, HIGH, MEDIUM, LOW
    const cameraKeyParam = searchParams.get("cameraKey");
    const categoryParam = searchParams.get("category");
    const searchParam = searchParams.get("search")?.trim();
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10), 1), 200);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const skip = (page - 1) * limit;

    const userObjId = mongoose.isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : userId;

    // Resolve all linked user IDs (e.g. across test sessions or camera mappings)
    const userDoc: any = await User.findById(userObjId).lean();
    const linkedUserIdsSet = new Set<string>();
    linkedUserIdsSet.add(userId.toString());
    if (mongoose.isValidObjectId(userId)) linkedUserIdsSet.add(userObjId.toString());

    if (userDoc?.email) {
      const matchingUsers = await User.find({ email: userDoc.email }).select('_id').lean();
      matchingUsers.forEach(u => linkedUserIdsSet.add(u._id.toString()));
    }

    // Also include cameras belonging to this user
    const userCameras = await Camera.find({
      $or: Array.from(linkedUserIdsSet).map(id => ({ userId: mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : id }))
    }).select('userId').lean();
    userCameras.forEach(c => {
      if (c.userId) linkedUserIdsSet.add(c.userId.toString());
    });

    const userMatchConditions = Array.from(linkedUserIdsSet).flatMap(id => [
      { userId: id },
      ...(mongoose.isValidObjectId(id) ? [{ userId: new mongoose.Types.ObjectId(id) }] : [])
    ]);

    const conditions: any[] = [
      { $or: userMatchConditions }
    ];

    // Status filter
    if (statusParam && statusParam !== "ALL") {
      if (statusParam === "UNRESOLVED") {
        conditions.push({ status: { $in: ["NEW", "ACKNOWLEDGED"] } });
      } else if (["NEW", "ACKNOWLEDGED", "RESOLVED"].includes(statusParam)) {
        conditions.push({ status: statusParam });
      }
    }

    // Severity filter
    if (severityParam && severityParam !== "ALL") {
      if (["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(severityParam)) {
        conditions.push({ severity: severityParam });
      }
    }

    // Camera filter
    if (cameraKeyParam && cameraKeyParam !== "ALL") {
      conditions.push({ cameraKey: cameraKeyParam });
    }

    // Category filter
    if (categoryParam && categoryParam !== "ALL") {
      conditions.push({ category: categoryParam });
    }

    // Free text search
    if (searchParam) {
      const searchRegex = new RegExp(searchParam, "i");
      conditions.push({
        $or: [
          { message: searchRegex },
          { reason: searchRegex },
          { description: searchRegex },
          { cameraKey: searchRegex },
          { cameraName: searchRegex },
          { category: searchRegex },
          { zoneName: searchRegex },
          { resolutionNotes: searchRegex }
        ]
      });
    }

    const query = conditions.length === 1 ? conditions[0] : { $and: conditions };

    const [alerts, total, unackCount, criticalCount] = await Promise.all([
      Alert.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
      Alert.countDocuments(query),
      Alert.countDocuments({ $or: userMatchConditions, status: "NEW" }),
      Alert.countDocuments({ $or: userMatchConditions, severity: "CRITICAL", status: { $ne: "RESOLVED" } })
    ]);

    return NextResponse.json({
      success: true,
      count: alerts.length,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      unacknowledgedCount: unackCount,
      activeCriticalCount: criticalCount,
      data: alerts
    });
  } catch (error: any) {
    console.error("GET alerts query error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Helper to derive a clear, professional incident reason / cause if not provided
function deriveIncidentReason({
  eventType,
  category,
  zoneName,
  message,
  duration,
  trackId,
  metadata
}: {
  eventType?: string;
  category?: string;
  zoneName?: string;
  message?: string;
  duration?: number;
  trackId?: string | number;
  metadata?: any;
}): string {
  const cleanZone = zoneName && zoneName.trim() ? zoneName.trim() : "Monitored Zone";
  const cleanType = (eventType || "").toUpperCase();
  const cleanCat = (category || "").toUpperCase();

  if (cleanType === "ZONE_ENTRY" || cleanCat.includes("RESTRICTED_ZONE")) {
    return `Unauthorized individual entered restricted security boundary [${cleanZone}]. Physical zone violation.`;
  }
  if (cleanType === "ZONE_DWELL" || cleanCat.includes("LOITERING")) {
    const dwellSec = duration || metadata?.dwellTime || 15;
    return `Subject remained stationary inside [${cleanZone}] for ${dwellSec} seconds, exceeding the maximum allowed loitering threshold.`;
  }
  if (cleanType === "VALUABLE_AREA_ACTIVITY" || cleanCat.includes("VALUABLE")) {
    return `High-security breach: Physical movement detected inside high-value asset storage area [${cleanZone}].`;
  }
  if (cleanType === "CASH_COUNTER_ACTIVITY" || cleanCat.includes("CASH_COUNTER")) {
    return `Cash counter security alert: Person detected behind billing register / cash drawer in [${cleanZone}].`;
  }
  if (cleanType === "SUSPICIOUS_MOVEMENT_PATTERN" || cleanCat.includes("SUSPICIOUS")) {
    return `Abnormal behavioral pattern detected: Repeated erratic pacing or scouting observed within camera view.`;
  }
  if (cleanType === "AFTER_HOURS_PRESENCE" || cleanCat.includes("AFTER_HOURS")) {
    return `After-hours security alert: Human presence detected on premises outside scheduled business operational hours.`;
  }
  if (cleanType === "CAMERA_OFFLINE" || cleanCat.includes("CAMERA_HEALTH")) {
    return `Hardware failure: Video feed connection timeout or camera power disconnect detected.`;
  }
  if (cleanType === "CAMERA_TAMPERING") {
    return `Tamper alarm: Sudden obstruction, severe occlusion, or physical redirection of camera lens detected.`;
  }
  if (cleanType === "CAMERA_ONLINE") {
    return `Camera feed successfully re-established and operational status verified.`;
  }
  if (message && message.length > 10) {
    return message;
  }
  return `Security policy violation detected on [${cleanZone}].`;
}

// POST: Accepts secure alerts from Python camera client with idempotency and severity classification
export async function POST(request: Request) {
  try {
    await dbConnect();

    const body = await request.json().catch(() => ({}));
    const { cameraKey, imageUrl, timestamp, message, category, eventType, zoneName, reason, description, trackId, duration, metadata } = body;

    if (!cameraKey) {
      return NextResponse.json({ success: false, error: "cameraKey is required" }, { status: 400 });
    }

    // Validate camera in Camera database
    const camera = await Camera.findOne({ cameraKey }).lean();
    if (!camera) {
      console.warn(`⚠️ [Alerts API] Rejected alert: Camera Key ${cameraKey} is not registered in DB`);
      return NextResponse.json({ success: false, error: "Invalid Camera Key. Camera is not registered." }, { status: 404 });
    }

    const userId = camera.userId;

    // 1. Categorize alert message and verify toggle status strictly independently
    let isFeatureEnabled = true;
    let featureCategory = "";

    // A. Suspicious Movement Detection
    if (category === "SUSPICIOUS_MOVEMENT" || eventType === "SUSPICIOUS_MOVEMENT_PATTERN") {
      featureCategory = "Suspicious Movement";
      isFeatureEnabled = camera.suspiciousMovement !== false;
    } 
    // B. Zone Monitoring Alerts (All zone events)
    else if (
      category === "ZONE_MONITORING" || 
      category === "RESTRICTED_ZONE_ENTRY" ||
      category === "ZONE_LOITERING_DWELL" ||
      category === "VALUABLE_AREA_ACTIVITY" ||
      category === "CASH_COUNTER_ACTIVITY" ||
      (eventType && eventType.startsWith("ZONE_")) ||
      eventType === "VALUABLE_AREA_ACTIVITY" ||
      eventType === "CASH_COUNTER_ACTIVITY" ||
      eventType === "DOOR_AREA_ACTIVITY"
    ) {
      featureCategory = "Zone Monitoring Alerts";
      isFeatureEnabled = camera.zoneMonitoring !== false;
    } 
    // C. Camera Health & Hardware Security
    else if (category === "CAMERA_HEALTH" || (eventType && eventType.startsWith("CAMERA_"))) {
      featureCategory = "Camera Health & Hardware Security";
      isFeatureEnabled = camera.cameraHealth !== false;
    } 
    // D. After-Hours Security
    else if (category === "AFTER_HOURS" || eventType === "AFTER_HOURS_PRESENCE") {
      featureCategory = "After-Hours Security";
      isFeatureEnabled = camera.afterHoursSecurity !== false;
    } 
    else {
      // Substring matching fallback
      const lowerMessage = (message || "").toLowerCase();
      if (
        lowerMessage.includes("dropped") || 
        lowerMessage.includes("recovered") || 
        lowerMessage.includes("tampering") ||
        lowerMessage.includes("hardware") ||
        lowerMessage.includes("offline") ||
        lowerMessage.includes("health")
      ) {
        featureCategory = "Camera Health & Hardware Security";
        isFeatureEnabled = camera.cameraHealth !== false;
      } else if (lowerMessage.includes("pacing") || lowerMessage.includes("suspicious")) {
        featureCategory = "Suspicious Movement";
        isFeatureEnabled = camera.suspiciousMovement !== false;
      } else if (lowerMessage.includes("after-hours") || lowerMessage.includes("after hours")) {
        featureCategory = "After-Hours Security";
        isFeatureEnabled = camera.afterHoursSecurity !== false;
      } else if (
        lowerMessage.includes("zone") || 
        lowerMessage.includes("cash counter") || 
        lowerMessage.includes("valuable") || 
        lowerMessage.includes("dwell") || 
        lowerMessage.includes("loitering") || 
        lowerMessage.includes("entered") || 
        lowerMessage.includes("restricted")
      ) {
        featureCategory = "Zone Monitoring Alerts";
        isFeatureEnabled = camera.zoneMonitoring !== false;
      } else {
        featureCategory = "Human Detection & Tracking";
        isFeatureEnabled = camera.humanDetection !== false;
      }
    }

    if (!isFeatureEnabled) {
      console.log(`ℹ️ [Alerts API] Alert from camera ${cameraKey} filtered out. Category '${featureCategory}' is disabled.`);
      return NextResponse.json({
        success: true,
        message: `Alert filtered out. Category '${featureCategory}' is disabled for this camera.`,
        filtered: true
      }, { status: 200 });
    }

    // 2. Deterministic Severity Classification (CRITICAL, HIGH, MEDIUM, LOW)
    let severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" = "HIGH";
    if (body.severity && ["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(body.severity)) {
      severity = body.severity;
    } else {
      const lowerMsg = (message || "").toLowerCase();
      if (
        eventType === "ZONE_ENTRY" ||
        category === "RESTRICTED_ZONE_ENTRY" ||
        eventType === "VALUABLE_AREA_ACTIVITY" ||
        lowerMsg.includes("restricted area") ||
        lowerMsg.includes("vault") ||
        lowerMsg.includes("safe box")
      ) {
        severity = "CRITICAL";
      } else if (
        eventType === "SUSPICIOUS_MOVEMENT_PATTERN" ||
        eventType === "AFTER_HOURS_PRESENCE" ||
        eventType === "ZONE_DWELL" ||
        eventType === "CASH_COUNTER_ACTIVITY" ||
        lowerMsg.includes("after-hours") ||
        lowerMsg.includes("loitering")
      ) {
        severity = "HIGH";
      } else if (
        eventType === "CAMERA_OFFLINE" ||
        eventType === "CAMERA_TAMPERING" ||
        lowerMsg.includes("tampering") ||
        lowerMsg.includes("offline")
      ) {
        severity = "MEDIUM";
      } else if (eventType === "CAMERA_ONLINE" || lowerMsg.includes("recovered")) {
        severity = "LOW";
      }
    }

    // 3. Backend Idempotency & Deduplication Check
    // A. Zone Monitoring 30-second suppression: Prevent spamming multiple alerts for the same person/incident in a zone
    if (
      featureCategory === "Zone Monitoring Alerts" ||
      (eventType && (eventType.startsWith("ZONE_") || eventType === "VALUABLE_AREA_ACTIVITY" || eventType === "CASH_COUNTER_ACTIVITY"))
    ) {
      const thirtySecondsAgo = new Date(Date.now() - 30000);
      const zoneQuery: any = {
        cameraKey,
        category: "Zone Monitoring Alerts",
        $or: [
          { createdAt: { $gte: thirtySecondsAgo } },
          { timestamp: { $gte: thirtySecondsAgo } }
        ]
      };
      if (zoneName && zoneName.trim()) {
        zoneQuery.zoneName = zoneName.trim();
      }
      const existingZoneAlert = await Alert.findOne(zoneQuery).lean();

      if (existingZoneAlert) {
        console.log(`🛡️ [Alerts API] Suppressed repeat zone alert for camera ${cameraKey} in zone '${zoneName || 'monitored'}' within 30s cooldown`);
        return NextResponse.json({
          success: true,
          message: "Repeat zone alert suppressed within active 30s cooldown window.",
          duplicate: true,
          data: existingZoneAlert
        }, { status: 200 });
      }
    }

    // B. General Idempotency window (15 seconds)
    const cleanEventType = eventType || featureCategory;
    const fingerprint = `${cameraKey}:${cleanEventType}:${(zoneName || message || "").trim().toLowerCase()}`;
    const fifteenSecondsAgo = new Date(Date.now() - 15000);

    const existingRecentAlert = await Alert.findOne({
      cameraKey,
      fingerprint,
      $or: [
        { createdAt: { $gte: fifteenSecondsAgo } },
        { timestamp: { $gte: fifteenSecondsAgo } }
      ]
    }).lean();

    if (existingRecentAlert) {
      console.log(`🛡️ [Alerts API] Idempotency suppressed duplicate alert within 15s window for camera ${cameraKey}`);
      return NextResponse.json({
        success: true,
        message: "Duplicate alert suppressed by backend idempotency window.",
        duplicate: true,
        data: existingRecentAlert
      }, { status: 200 });
    }

    const cameraDisplayName = camera.name || camera.locationName || cameraKey;

    // Derive clear, context-aware reason for the alert
    const finalReason = (reason && typeof reason === "string" && reason.trim())
      ? reason.trim()
      : deriveIncidentReason({
          eventType,
          category: featureCategory || category,
          zoneName,
          message,
          duration,
          trackId,
          metadata
        });

    const finalDescription = (description && typeof description === "string" && description.trim())
      ? description.trim()
      : finalReason;

    // 4. Create the incident record in MongoDB
    const newAlert = await Alert.create({
      cameraKey,
      userId,
      imageUrl: imageUrl || "",
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      message: message || "Security incident detected!",
      reason: finalReason,
      description: finalDescription,
      category: featureCategory,
      eventType: eventType || "",
      severity,
      status: "NEW",
      cameraName: cameraDisplayName,
      zoneName: zoneName || "",
      fingerprint,
      isRead: false,
    });

    console.log(`🚨 [Alerts API] Logged [${severity}] security incident for camera ${cameraKey} (${cameraDisplayName}) - Reason: ${finalReason}`);

    // 5. Emit real-time incident event via Server-Sent Events (SSE)
    try {
      alertEmitter.emit(`alert:${userId}`, newAlert);
    } catch (emitterErr) {
      console.warn("Failed to broadcast SSE alert:", emitterErr);
    }

    return NextResponse.json({
      success: true,
      message: "Security incident logged successfully!",
      data: newAlert
    }, { status: 201 });

  } catch (error: any) {
    console.error("POST alerts processing error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Security incident lifecycle management (Acknowledge and Resolve with notes)
export async function PUT(request: Request) {
  try {
    await dbConnect();

    const userId = getUserIdFromAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { alertId, action, notes } = body;

    if (!alertId || !action) {
      return NextResponse.json({ success: false, error: "alertId and action ('ACKNOWLEDGE' or 'RESOLVE') are required" }, { status: 400 });
    }

    const userObjId = mongoose.isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : userId;
    const alertDoc = await Alert.findOne({
      _id: alertId,
      $or: [{ userId }, { userId: userObjId }]
    });

    if (!alertDoc) {
      return NextResponse.json({ success: false, error: "Alert incident not found or unauthorized" }, { status: 404 });
    }

    const now = new Date();

    const validUserObjectId = mongoose.isValidObjectId(userId) ? new mongoose.Types.ObjectId(userId) : null;

    if (action === "ACKNOWLEDGE") {
      alertDoc.status = "ACKNOWLEDGED";
      alertDoc.acknowledgedAt = now;
      alertDoc.acknowledgedBy = validUserObjectId as any;
      console.log(`🛡️ [Alerts API] Incident ${alertId} ACKNOWLEDGED by user ${userId}`);
    } else if (action === "RESOLVE") {
      alertDoc.status = "RESOLVED";
      alertDoc.resolvedAt = now;
      alertDoc.resolvedBy = validUserObjectId as any;
      if (notes && typeof notes === "string") {
        alertDoc.resolutionNotes = notes.trim();
      }
      console.log(`✅ [Alerts API] Incident ${alertId} RESOLVED by user ${userId}. Notes: ${alertDoc.resolutionNotes}`);
    } else {
      return NextResponse.json({ success: false, error: "Invalid action. Supported: ACKNOWLEDGE, RESOLVE" }, { status: 400 });
    }

    await alertDoc.save();

    // Broadcast status update event to all connected clients for real-time multi-tab sync
    try {
      alertEmitter.emit(`alert:${userId}`, {
        isUpdate: true,
        alertId: alertDoc._id,
        status: alertDoc.status,
        acknowledgedAt: alertDoc.acknowledgedAt,
        resolvedAt: alertDoc.resolvedAt,
        resolutionNotes: alertDoc.resolutionNotes,
        updatedDoc: alertDoc
      });
    } catch (emitterErr) {
      console.warn("Failed to broadcast SSE alert update:", emitterErr);
    }

    return NextResponse.json({
      success: true,
      message: `Incident ${action.toLowerCase()}d successfully`,
      data: alertDoc
    });

  } catch (error: any) {
    console.error("PUT alerts update error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
