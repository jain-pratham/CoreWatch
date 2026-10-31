import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { GoogleDriveService } from "../services/googleDriveService";
import { OneDriveService } from "../services/oneDriveService";
import { CloudStorageHelper } from "../services/cloudStorageHelper";
import User from "../models/User";
import Customer from "../models/Customer";

// Configure Multer for temporary upload holding
const tempUploadDir = path.join(process.cwd(), "uploads", "temp");
if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

export const uploadTemp = multer({
  dest: tempUploadDir,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
});

/**
 * Helper to encode state parameter for OAuth
 */
function encodeState(data: object): string {
  return Buffer.from(JSON.stringify(data)).toString("base64");
}

/**
 * Helper to decode state parameter
 */
function decodeState(stateStr?: string): any {
  if (!stateStr) return {};
  try {
    const jsonStr = Buffer.from(stateStr, "base64").toString("utf8");
    return JSON.parse(jsonStr);
  } catch (e) {
    return {};
  }
}

/**
 * GET /api/integrations/status
 * Returns connection and active status for both Google Drive and OneDrive
 */
export const getIntegrationsStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?._id;
    const userEmail = (req as any).user?.email || (req.headers["x-user-email"] as string);

    const record = await CloudStorageHelper.findUserOrCustomer(userId, userEmail);
    if (!record) {
      res.status(404).json({ success: false, message: "User account not found" });
      return;
    }

    const doc: any = record.doc;
    const gDrive = doc.googleDriveSettings || {};
    const oDrive = doc.oneDriveSettings || {};

    let activeProvider: "google_drive" | "onedrive" | null = null;
    if (gDrive.isEnabled && gDrive.refreshToken) {
      activeProvider = "google_drive";
    } else if (oDrive.isEnabled && oDrive.refreshToken) {
      activeProvider = "onedrive";
    }

    res.json({
      success: true,
      activeProvider,
      googleDrive: {
        isConnected: Boolean(gDrive.refreshToken),
        isEnabled: Boolean(gDrive.isEnabled && gDrive.refreshToken),
        userEmail: gDrive.userEmail || null,
        rootFolderId: gDrive.rootFolderId || null,
        folderPath: "CoreWatch Evidence",
      },
      oneDrive: {
        isConnected: Boolean(oDrive.refreshToken),
        isEnabled: Boolean(oDrive.isEnabled && oDrive.refreshToken),
        userEmail: oDrive.userEmail || null,
        rootFolderId: oDrive.rootFolderId || null,
        folderPath: "CoreWatch Evidence",
      },
    });
  } catch (error: any) {
    console.error("Error fetching integration status:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to get integration status" });
  }
};

/**
 * GET /api/integrations/google-drive/auth-url
 */
export const getGoogleDriveAuthUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?._id;
    const userEmail = (req as any).user?.email || (req.headers["x-user-email"] as string);

    const state = encodeState({
      userId,
      userEmail,
      provider: "google_drive",
      timestamp: Date.now(),
    });

    const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/integrations/google-drive/callback";
    const authUrl = GoogleDriveService.getAuthUrl(state, redirectUri);

    res.json({ success: true, url: authUrl });
  } catch (error: any) {
    console.error("Error generating Google Drive auth URL:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/integrations/google-drive/callback
 * Handles OAuth callback from Google
 */
export const handleGoogleDriveCallback = async (req: Request, res: Response): Promise<void> => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  try {
    const { code, state, error } = req.query;

    if (error) {
      res.redirect(`${frontendUrl}/dashboard?tab=integrations&status=error&message=${encodeURIComponent(String(error))}`);
      return;
    }

    if (!code) {
      res.redirect(`${frontendUrl}/dashboard?tab=integrations&status=error&message=${encodeURIComponent("No authorization code provided")}`);
      return;
    }

    const stateData = decodeState(String(state));
    const userId = stateData.userId;
    const userEmail = stateData.userEmail;

    const record = await CloudStorageHelper.findUserOrCustomer(userId, userEmail);
    if (!record) {
      res.redirect(`${frontendUrl}/dashboard?tab=integrations&status=error&message=${encodeURIComponent("User account not found for state")}`);
      return;
    }

    const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/integrations/google-drive/callback";
    const { tokens, userEmail: driveEmail } = await GoogleDriveService.exchangeCodeForTokens(
      String(code),
      redirectUri
    );

    const doc: any = record.doc;

    // Save tokens and enforce mutual exclusion (turn OFF OneDrive)
    doc.googleDriveSettings = {
      isEnabled: true,
      refreshToken: tokens.refreshToken || doc.googleDriveSettings?.refreshToken,
      accessToken: tokens.accessToken,
      tokenExpiry: tokens.tokenExpiry,
      rootFolderId: doc.googleDriveSettings?.rootFolderId || null,
      userEmail: driveEmail || userEmail || null,
    };

    if (doc.oneDriveSettings) {
      doc.oneDriveSettings.isEnabled = false;
    }

    // Try creating/verifying root folder right away
    if (tokens.refreshToken) {
      try {
        const authClient = GoogleDriveService.getAuthenticatedClient(tokens.refreshToken, tokens.accessToken);
        const rootFolderId = await GoogleDriveService.getOrCreateFolder(authClient, "CoreWatch Evidence");
        doc.googleDriveSettings.rootFolderId = rootFolderId;
      } catch (fErr) {
        console.warn("Could not immediately create CoreWatch Evidence folder on Google Drive:", fErr);
      }
    }

    await doc.save();

    res.redirect(`${frontendUrl}/dashboard?tab=integrations&status=success&integration=googledrive`);
  } catch (error: any) {
    console.error("Google Drive OAuth callback error:", error);
    res.redirect(`${frontendUrl}/dashboard?tab=integrations&status=error&message=${encodeURIComponent(error.message || "Failed to connect Google Drive")}`);
  }
};

/**
 * POST /api/integrations/google-drive/disconnect
 */
export const disconnectGoogleDrive = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?._id;
    const userEmail = (req as any).user?.email || (req.headers["x-user-email"] as string);

    const record = await CloudStorageHelper.findUserOrCustomer(userId, userEmail);
    if (!record) {
      res.status(404).json({ success: false, message: "User account not found" });
      return;
    }

    const doc: any = record.doc;
    doc.googleDriveSettings = {
      isEnabled: false,
      refreshToken: null,
      accessToken: null,
      tokenExpiry: null,
      rootFolderId: null,
      userEmail: null,
    };

    await doc.save();
    res.json({ success: true, message: "Google Drive disconnected successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/integrations/onedrive/auth-url
 */
export const getOneDriveAuthUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?._id;
    const userEmail = (req as any).user?.email || (req.headers["x-user-email"] as string);

    const state = encodeState({
      userId,
      userEmail,
      provider: "onedrive",
      timestamp: Date.now(),
    });

    const redirectUri = process.env.ONEDRIVE_REDIRECT_URI || "http://localhost:5000/api/integrations/onedrive/callback";
    const authUrl = OneDriveService.getAuthUrl(state, redirectUri);

    res.json({ success: true, url: authUrl });
  } catch (error: any) {
    console.error("Error generating OneDrive auth URL:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/integrations/onedrive/callback
 */
export const handleOneDriveCallback = async (req: Request, res: Response): Promise<void> => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  try {
    const { code, state, error, error_description } = req.query;

    if (error) {
      res.redirect(
        `${frontendUrl}/dashboard?tab=integrations&status=error&message=${encodeURIComponent(
          String(error_description || error)
        )}`
      );
      return;
    }

    if (!code) {
      res.redirect(`${frontendUrl}/dashboard?tab=integrations&status=error&message=${encodeURIComponent("No authorization code provided")}`);
      return;
    }

    const stateData = decodeState(String(state));
    const userId = stateData.userId;
    const userEmail = stateData.userEmail;

    const record = await CloudStorageHelper.findUserOrCustomer(userId, userEmail);
    if (!record) {
      res.redirect(`${frontendUrl}/dashboard?tab=integrations&status=error&message=${encodeURIComponent("User account not found for state")}`);
      return;
    }

    const redirectUri = process.env.ONEDRIVE_REDIRECT_URI || "http://localhost:5000/api/integrations/onedrive/callback";
    const { tokens, userEmail: msEmail } = await OneDriveService.exchangeCodeForTokens(
      String(code),
      redirectUri
    );

    const doc: any = record.doc;

    // Save tokens and enforce mutual exclusion (turn OFF Google Drive)
    doc.oneDriveSettings = {
      isEnabled: true,
      refreshToken: tokens.refreshToken,
      accessToken: tokens.accessToken,
      tokenExpiry: tokens.tokenExpiry,
      rootFolderId: doc.oneDriveSettings?.rootFolderId || null,
      userEmail: msEmail || userEmail || null,
    };

    if (doc.googleDriveSettings) {
      doc.googleDriveSettings.isEnabled = false;
    }

    // Pre-create root folder
    try {
      const rootFolderId = await OneDriveService.getOrCreateRootFolder(tokens.accessToken, "CoreWatch Evidence");
      doc.oneDriveSettings.rootFolderId = rootFolderId;
    } catch (fErr) {
      console.warn("Could not immediately create CoreWatch Evidence folder on OneDrive:", fErr);
    }

    await doc.save();

    res.redirect(`${frontendUrl}/dashboard?tab=integrations&status=success&integration=onedrive`);
  } catch (error: any) {
    console.error("OneDrive OAuth callback error:", error);
    res.redirect(`${frontendUrl}/dashboard?tab=integrations&status=error&message=${encodeURIComponent(error.message || "Failed to connect OneDrive")}`);
  }
};

/**
 * POST /api/integrations/onedrive/disconnect
 */
export const disconnectOneDrive = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?._id;
    const userEmail = (req as any).user?.email || (req.headers["x-user-email"] as string);

    const record = await CloudStorageHelper.findUserOrCustomer(userId, userEmail);
    if (!record) {
      res.status(404).json({ success: false, message: "User account not found" });
      return;
    }

    const doc: any = record.doc;
    doc.oneDriveSettings = {
      isEnabled: false,
      refreshToken: null,
      accessToken: null,
      tokenExpiry: null,
      rootFolderId: null,
      userEmail: null,
    };

    await doc.save();
    res.json({ success: true, message: "OneDrive disconnected successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/integrations/upload
 * Handles document or snapshot upload and routes to active cloud provider
 */
export const uploadDocument = async (req: Request, res: Response): Promise<void> => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ success: false, message: "No file provided for upload" });
    return;
  }

  try {
    const userId = (req as any).user?._id;
    const userEmail = (req as any).user?.email;
    const category = req.body.category || "General";
    const cameraKey = req.body.cameraKey || "System";

    const uploadRes = await CloudStorageHelper.uploadAlertEvidence({
      userId,
      userEmail,
      category,
      cameraKey,
      filename: file.originalname || file.filename,
      localFilePath: file.path,
      mimeType: file.mimetype,
    });

    if (!uploadRes.success) {
      res.status(400).json({ success: false, message: uploadRes.error });
      return;
    }

    res.json({
      success: true,
      provider: uploadRes.provider,
      fileId: uploadRes.fileId,
      webViewLink: uploadRes.webViewLink,
      folderPath: uploadRes.folderPath,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to upload file" });
  } finally {
    // Unlink temporary file
    if (file && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (uErr) {
        console.warn("Could not unlink temp file:", uErr);
      }
    }
  }
};

/**
 * POST /api/integrations/test-upload
 * Generates a verified test evidence snapshot and uploads it to user's connected cloud drive
 */
export const testCloudEvidenceUpload = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?._id || req.body.userId;
    const userEmail = (req as any).user?.email || req.body.userEmail;

    let buffer: Buffer;
    const customImage = req.body.image || req.body.snapshotBase64;
    if (customImage && typeof customImage === "string") {
      const matches = customImage.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      buffer = matches ? Buffer.from(matches[2], "base64") : Buffer.from(customImage, "base64");
    } else {
      // Create a 1x1 base64 transparent PNG buffer or small JPEG buffer as sample evidence
      const sampleJpegBase64 =
        "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
      buffer = Buffer.from(sampleJpegBase64, "base64");
    }

    const category = req.body.category || "Test Inspection";
    const cameraKey = req.body.cameraKey || "CAM-TEST-NODE";
    const filename = `evidence_${Date.now()}.jpg`;

    const uploadRes = await CloudStorageHelper.uploadAlertEvidence({
      userId,
      userEmail,
      category,
      cameraKey,
      filename,
      buffer,
      mimeType: "image/jpeg",
    });

    if (!uploadRes.success) {
      res.status(400).json({
        success: false,
        message: uploadRes.error || "Upload test failed. Please verify provider connection.",
      });
      return;
    }

    res.json({
      success: true,
      message: `Verified snapshot uploaded successfully to ${uploadRes.provider === "google_drive" ? "Google Drive" : "OneDrive"}!`,
      provider: uploadRes.provider,
      fileId: uploadRes.fileId,
      webViewLink: uploadRes.webViewLink,
      folderPath: uploadRes.folderPath,
      filename,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Cloud test upload failed" });
  }
};
