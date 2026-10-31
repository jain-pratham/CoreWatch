import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import Event from "../models/Event";
import User from "../models/User";
import { emitToUser } from "../config/socket";
import { CloudStorageHelper } from "../services/cloudStorageHelper";

// Helper to sanitize base64 strings and save as JPEG
const saveBase64Image = (base64String: string, outputDir: string): string => {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Strip metadata prefix if exists (e.g. "data:image/jpeg;base64,")
  const matches = base64String.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  const buffer = matches
    ? Buffer.from(matches[2], "base64")
    : Buffer.from(base64String, "base64");

  const fileName = `event_${Date.now()}_${crypto.randomBytes(4).toString("hex")}.jpg`;
  const filePath = path.join(outputDir, fileName);

  fs.writeFileSync(filePath, buffer);
  return `/uploads/${fileName}`;
};

/**
 * Creates an event from AI Service or Camera trigger.
 */
export const createEvent = async (req: Request, res: Response): Promise<void> => {
  const { apiKey, customerId, type, severity, snapshotBase64 } = req.body;

  try {
    let targetCustomerId = customerId;

    if (!targetCustomerId && apiKey) {
      const user = await User.findOne({ email: apiKey });
      if (user) {
        targetCustomerId = user._id;
      }
    }

    if (!targetCustomerId) {
      res.status(400).json({ success: false, message: "Valid customerId or apiKey required" });
      return;
    }

    let snapshotUrl = "";
    let cloudResult: any = null;
    if (snapshotBase64) {
      try {
        const matches = snapshotBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        const buffer = matches
          ? Buffer.from(matches[2], "base64")
          : Buffer.from(snapshotBase64, "base64");

        // ONLY upload if an active cloud drive (Google Drive / OneDrive) is connected.
        // No local images are saved to disk as per policy.
        cloudResult = await CloudStorageHelper.uploadAlertEvidence({
          userId: targetCustomerId.toString(),
          category: type || "Safety Violation",
          cameraKey: req.body.cameraId || "General-Feed",
          filename: `evidence_${Date.now()}.jpg`,
          buffer,
          mimeType: "image/jpeg",
        });

        if (cloudResult && cloudResult.success && cloudResult.webViewLink) {
          snapshotUrl = cloudResult.webViewLink;
        }
      } catch (cloudErr) {
        console.warn("Evidence cloud upload skipped or unavailable:", cloudErr);
      }
    }

    const event = await Event.create({
      customerId: targetCustomerId,
      cameraId: req.body.cameraId || "CAM-DEFAULT",
      type: type || "Safety Violation",
      severity: severity || "medium",
      snapshotUrl, // Empty if no cloud drive connected!
      snapshotPath: snapshotUrl,
      cloudFileId: cloudResult?.fileId || null,
      cloudViewLink: cloudResult?.webViewLink || null,
      cloudProvider: cloudResult?.provider || null,
      status: "unread",
      timestamp: new Date(),
    });

    try {
      emitToUser(targetCustomerId.toString(), "new_event", event);
    } catch (socketErr) {
      console.warn("Socket emission warning:", socketErr);
    }

    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error: any) {
    console.error("Error creating event:", error);
    res.status(500).json({ success: false, message: "Failed to create event" });
  }
};

/**
 * Retrieves all events for the logged-in customer.
 */
export const getEvents = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // req.user._id is populated by JWT auth middleware (protect)
    const events = await Event.find({ customerId: req.user._id }).sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error: any) {
    console.error("Error retrieving events:", error);
    res.status(500).json({ success: false, message: "Failed to retrieve events" });
  }
};

/**
 * Marks a specific event as read.
 */
export const markRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const event = await Event.findById(id);

    if (!event) {
      res.status(404).json({ success: false, message: "Event not found" });
      return;
    }

    // Security check: ensure event belongs to logged-in user
    if (event.customerId.toString() !== req.user._id.toString()) {
      res.status(403).json({ success: false, message: "Unauthorized access to this event" });
      return;
    }

    event.status = "read";
    await event.save();

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error: any) {
    console.error("Error marking event as read:", error);
    res.status(500).json({ success: false, message: "Failed to update event" });
  }
};

/**
 * Marks all unread events for the logged-in customer as read.
 */
export const markAllRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await Event.updateMany(
      { customerId: req.user._id, status: "unread" },
      { status: "read" }
    );

    res.status(200).json({
      success: true,
      message: "All events marked as read",
    });
  } catch (error: any) {
    console.error("Error marking all events as read:", error);
    res.status(500).json({ success: false, message: "Failed to update events" });
  }
};
