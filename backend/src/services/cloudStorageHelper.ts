import User from "../models/User";
import Customer from "../models/Customer";
import { GoogleDriveService } from "./googleDriveService";
import { OneDriveService } from "./oneDriveService";
import fs from "fs";
import path from "path";

export interface SaveEvidenceParams {
  userId?: string;
  userEmail?: string;
  cameraKey?: string;
  category?: string;
  filename?: string;
  buffer?: Buffer;
  localFilePath?: string;
  mimeType?: string;
}

export interface CloudUploadResult {
  success: boolean;
  provider?: "google_drive" | "onedrive" | "local";
  fileId?: string;
  webViewLink?: string;
  webContentLink?: string;
  directImageUrl?: string;
  folderPath?: string;
  error?: string;
}

export class CloudStorageHelper {
  /**
   * Helper to retrieve user or customer document
   */
  public static async findUserOrCustomer(userId?: string, userEmail?: string) {
    if (userId) {
      let doc = await User.findById(userId);
      if (doc) return { doc, type: "user" as const };

      let cust = await Customer.findById(userId);
      if (cust) return { doc: cust, type: "customer" as const };
    }

    if (userEmail) {
      let doc = await User.findOne({ email: userEmail.toLowerCase().trim() });
      if (doc) return { doc, type: "user" as const };

      let cust = await Customer.findOne({ email: userEmail.toLowerCase().trim() });
      if (cust) return { doc: cust, type: "customer" as const };
    }

    return null;
  }

  /**
   * Uploads an evidence snapshot to the active cloud provider (Google Drive or OneDrive)
   * in the structured folder hierarchy: CoreWatch Evidence / {Category} / {CameraKey}
   */
  public static async uploadAlertEvidence(params: SaveEvidenceParams): Promise<CloudUploadResult> {
    const {
      userId,
      userEmail,
      cameraKey = "General-Feed",
      category = "Security Alert",
      filename = `evidence_${Date.now()}.jpg`,
      buffer,
      localFilePath,
      mimeType = "image/jpeg",
    } = params;

    const record = await this.findUserOrCustomer(userId, userEmail);

    if (!record) {
      return {
        success: false,
        error: "User or Customer record not found for cloud storage sync.",
      };
    }

    const { doc } = record;
    const gDrive = (doc as any).googleDriveSettings;
    const oneDrive = (doc as any).oneDriveSettings;

    // Normalize folder names to clean strings
    const safeCategory = category.replace(/[<>:"/\\|?*]/g, "_").trim() || "Security Alert";
    const safeCameraKey = cameraKey.replace(/[<>:"/\\|?*]/g, "_").trim() || "General-Feed";

    // 1. Check Google Drive (Priority if enabled)
    if (gDrive?.isEnabled && gDrive?.refreshToken) {
      try {
        const authClient = GoogleDriveService.getAuthenticatedClient(gDrive.refreshToken, gDrive.accessToken);

        // Ensure Root Folder
        let rootFolderId = gDrive.rootFolderId;
        if (!rootFolderId) {
          rootFolderId = await GoogleDriveService.getOrCreateFolder(authClient, "CoreWatch Evidence");
          gDrive.rootFolderId = rootFolderId;
          await doc.save();
        }

        // Ensure Category Folder inside root
        const categoryFolderId = await GoogleDriveService.getOrCreateFolder(
          authClient,
          safeCategory,
          rootFolderId
        );

        // Ensure Camera Folder inside category
        const cameraFolderId = await GoogleDriveService.getOrCreateFolder(
          authClient,
          safeCameraKey,
          categoryFolderId
        );

        // Upload file
        const uploadRes = await GoogleDriveService.uploadFile({
          authClient,
          filename,
          mimeType,
          parentFolderId: cameraFolderId,
          buffer,
          localFilePath,
        });

        return {
          success: true,
          provider: "google_drive",
          fileId: uploadRes.fileId,
          webViewLink: uploadRes.webViewLink,
          webContentLink: uploadRes.webContentLink,
          folderPath: `CoreWatch Evidence/${safeCategory}/${safeCameraKey}`,
        };
      } catch (err: any) {
        console.error("Google Drive evidence upload error:", err);
        return {
          success: false,
          provider: "google_drive",
          error: err.message || "Failed to upload to Google Drive",
        };
      }
    }

    // 2. Check OneDrive
    if (oneDrive?.isEnabled && oneDrive?.refreshToken) {
      try {
        // Refresh token if needed
        const tokenData = await OneDriveService.getRefreshedAccessToken(
          oneDrive.refreshToken,
          oneDrive.accessToken,
          oneDrive.tokenExpiry
        );

        if (tokenData.accessToken !== oneDrive.accessToken) {
          oneDrive.accessToken = tokenData.accessToken;
          oneDrive.refreshToken = tokenData.refreshToken;
          oneDrive.tokenExpiry = tokenData.tokenExpiry;
          await doc.save();
        }

        // Ensure Root Folder
        let rootFolderId = oneDrive.rootFolderId;
        if (!rootFolderId) {
          rootFolderId = await OneDriveService.getOrCreateRootFolder(tokenData.accessToken, "CoreWatch Evidence");
          oneDrive.rootFolderId = rootFolderId;
          await doc.save();
        }

        // Ensure Category Folder inside root
        const categoryFolderId = await OneDriveService.getOrCreateSubfolder(
          tokenData.accessToken,
          rootFolderId,
          safeCategory
        );

        // Ensure Camera Folder inside category
        const cameraFolderId = await OneDriveService.getOrCreateSubfolder(
          tokenData.accessToken,
          categoryFolderId,
          safeCameraKey
        );

        // Upload file
        const uploadRes = await OneDriveService.uploadFile({
          accessToken: tokenData.accessToken,
          parentFolderId: cameraFolderId,
          filename,
          buffer,
          localFilePath,
          mimeType,
        });

        return {
          success: true,
          provider: "onedrive",
          fileId: uploadRes.fileId,
          webViewLink: uploadRes.webViewLink,
          webContentLink: uploadRes.webUrl,
          folderPath: `CoreWatch Evidence/${safeCategory}/${safeCameraKey}`,
        };
      } catch (err: any) {
        console.error("OneDrive evidence upload error:", err);
        return {
          success: false,
          provider: "onedrive",
          error: err.message || "Failed to upload to OneDrive",
        };
      }
    }

    // 3. Neither cloud provider is connected
    return {
      success: false,
      error: "No active cloud storage provider configured. Please connect Google Drive or OneDrive in Cloud Storage settings.",
    };
  }
}

