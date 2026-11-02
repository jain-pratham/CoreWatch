import mongoose from "mongoose";
import User from "@/models/User";
import Customer from "@/models/Customer";

export interface DirectUploadParams {
  userId?: string | mongoose.Types.ObjectId;
  userEmail?: string;
  cameraKey?: string;
  category?: string;
  image?: string;
}

export interface DirectUploadResult {
  success: boolean;
  provider?: "google_drive" | "onedrive";
  fileId?: string;
  webViewLink?: string;
  directImageUrl?: string;
  folderPath?: string;
  error?: string;
}

/**
 * Direct Google Drive Evidence Vault uploader for Next.js.
 * Operates entirely in-process using Google OAuth2 REST API without requiring external service hops.
 */
export async function uploadAlertEvidenceToDrive(params: DirectUploadParams): Promise<DirectUploadResult> {
  const {
    userId,
    userEmail,
    cameraKey = "General-Feed",
    category = "Security Alert",
    image
  } = params;

  if (!image) {
    return { success: false, error: "No image payload provided for evidence upload" };
  }

  // 1. Locate User or Customer record
  let doc: any = null;
  if (userId) {
    doc = await User.findById(userId);
    if (!doc) doc = await Customer.findById(userId);
    if (!doc && mongoose.isValidObjectId(userId)) {
      doc = await Customer.findOne({ user: userId });
    }
  }
  if (!doc && userEmail) {
    doc = await User.findOne({ email: userEmail.toLowerCase().trim() });
    if (!doc) doc = await Customer.findOne({ email: userEmail.toLowerCase().trim() });
  }

  if (!doc) {
    return { success: false, error: "User/Customer record not found for cloud sync." };
  }

  const gDrive = doc.googleDriveSettings;
  if (!gDrive || !gDrive.refreshToken || !gDrive.isEnabled) {
    return { success: false, error: "Google Drive is not connected or enabled on this account." };
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return { success: false, error: "Google Client credentials not configured in environment variables." };
  }

  try {
    // 2. Refresh Google OAuth access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: gDrive.refreshToken,
        grant_type: "refresh_token"
      })
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error("Failed to refresh Google Drive access token:", tokenData);
      return { success: false, error: tokenData.error_description || "Failed to authenticate with Google Drive" };
    }

    const accessToken = tokenData.access_token;

    // Helper: Find or create Google Drive folder
    const getOrCreateFolder = async (folderName: string, parentId?: string): Promise<string> => {
      let query = `name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      if (parentId) {
        query += ` and '${parentId}' in parents`;
      }

      const listRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const listData = await listRes.json();
      if (listData.files && listData.files.length > 0) {
        return listData.files[0].id;
      }

      const createBody: any = {
        name: folderName,
        mimeType: "application/vnd.google-apps.folder"
      };
      if (parentId) {
        createBody.parents = [parentId];
      }

      const createRes = await fetch("https://www.googleapis.com/drive/v3/files?fields=id", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(createBody)
      });
      const createData = await createRes.json();
      return createData.id;
    };

    // 3. Establish Structured Folder Hierarchy: CoreWatch Evidence / Category / Camera
    let rootFolderId = gDrive.rootFolderId;
    if (!rootFolderId) {
      rootFolderId = await getOrCreateFolder("CoreWatch Evidence");
      gDrive.rootFolderId = rootFolderId;
      await doc.save();
    }

    const safeCategory = category.replace(/[<>:"/\\|?*]/g, "_").trim() || "Security Alert";
    const safeCameraKey = cameraKey.replace(/[<>:"/\\|?*]/g, "_").trim() || "General-Feed";

    const categoryFolderId = await getOrCreateFolder(safeCategory, rootFolderId);
    const cameraFolderId = await getOrCreateFolder(safeCameraKey, categoryFolderId);

    // 4. Extract binary image buffer
    let fileBuffer: Buffer;
    if (image.startsWith("http://") || image.startsWith("https://")) {
      const resp = await fetch(image);
      const arrayBuffer = await resp.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    } else {
      const matches = image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      fileBuffer = matches ? Buffer.from(matches[2], "base64") : Buffer.from(image, "base64");
    }

    // 5. Upload File using Google Drive Multipart API
    const filename = `evidence_${Date.now()}.jpg`;
    const boundary = "-------CoreWatchEvidence" + Math.random().toString(36).substring(2);
    const delimiter = "\r\n--" + boundary + "\r\n";
    const closeDelim = "\r\n--" + boundary + "--";

    const metadata = {
      name: filename,
      parents: [cameraFolderId]
    };

    const multipartBody = Buffer.concat([
      Buffer.from(delimiter + "Content-Type: application/json; charset=UTF-8\r\n\r\n" + JSON.stringify(metadata)),
      Buffer.from(delimiter + "Content-Type: image/jpeg\r\nContent-Transfer-Encoding: base64\r\n\r\n" + fileBuffer.toString("base64")),
      Buffer.from(closeDelim)
    ]);

    const uploadRes = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "multipart/related; boundary=" + boundary
      },
      body: multipartBody
    });

    const uploadData = await uploadRes.json();
    if (!uploadData.id) {
      console.error("Google Drive multipart upload failed:", uploadData);
      return { success: false, error: uploadData.error?.message || "Google Drive file upload failed." };
    }

    const fileId = uploadData.id;

    // 6. Set public reader permission so thumbnail CDN can serve image directly in browser
    try {
      await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ role: "reader", type: "anyone" })
      });
    } catch (permErr) {
      console.warn("Could not set anyone reader permission on Google Drive file:", permErr);
    }

    const directImageUrl = `/api/evidence-image?fileId=${fileId}`;
    const webViewLink = uploadData.webViewLink || `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
    const folderPath = `CoreWatch Evidence/${safeCategory}/${safeCameraKey}`;

    return {
      success: true,
      provider: "google_drive",
      fileId,
      webViewLink,
      directImageUrl,
      folderPath
    };

  } catch (err: any) {
    console.error("Direct Google Drive upload error:", err);
    return { success: false, error: err.message || "Failed to upload to Google Drive" };
  }
}

