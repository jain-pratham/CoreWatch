import { google } from "googleapis";
import fs from "fs";
import { Readable } from "stream";

export interface GoogleTokens {
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiry: Date | null;
}

export class GoogleDriveService {
  private static getOAuth2Client(customRedirectUri?: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = customRedirectUri || process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/integrations/google-drive/callback";

    if (!clientId || !clientSecret) {
      throw new Error("Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) are not configured in environment variables.");
    }

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }

  /**
   * Generates Google OAuth 2.0 consent authorization URL
   */
  public static getAuthUrl(stateData: string, redirectUri?: string): string {
    const oauth2Client = this.getOAuth2Client(redirectUri);
    return oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ],
      state: stateData,
    });
  }

  /**
   * Exchanges authorization code for tokens
   */
  public static async exchangeCodeForTokens(code: string, redirectUri?: string): Promise<{
    tokens: GoogleTokens;
    userEmail: string | null;
  }> {
    const oauth2Client = this.getOAuth2Client(redirectUri);
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    let userEmail: string | null = null;
    try {
      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();
      userEmail = userInfo.data.email || null;
    } catch (err) {
      console.warn("Could not retrieve Google userinfo:", err);
    }

    return {
      tokens: {
        accessToken: tokens.access_token || null,
        refreshToken: tokens.refresh_token || null,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      },
      userEmail,
    };
  }

  /**
   * Creates an authenticated OAuth2Client using a stored refresh token
   */
  public static getAuthenticatedClient(refreshToken: string, accessToken?: string | null) {
    const oauth2Client = this.getOAuth2Client();
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
      access_token: accessToken || undefined,
    });
    return oauth2Client;
  }

  /**
   * Finds or creates a folder in Google Drive and sets reader permissions
   */
  public static async getOrCreateFolder(
    authClient: any,
    folderName: string,
    parentFolderId?: string
  ): Promise<string> {
    const drive = google.drive({ version: "v3", auth: authClient });

    // Search query
    let query = `name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    if (parentFolderId) {
      query += ` and '${parentFolderId}' in parents`;
    }

    const response = await drive.files.list({
      q: query,
      fields: "files(id, name)",
      spaces: "drive",
    });

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id!;
    }

    // Create folder if not found
    const fileMetadata: any = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    };
    if (parentFolderId) {
      fileMetadata.parents = [parentFolderId];
    }

    const folder = await drive.files.create({
      requestBody: fileMetadata,
      fields: "id",
    });

    const folderId = folder.data.id!;

    // Grant public read permission so links can be viewed in browser
    try {
      await drive.permissions.create({
        fileId: folderId,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });
    } catch (permErr) {
      console.warn("Could not set anyone reader permission on folder:", permErr);
    }

    return folderId;
  }

  /**
   * Uploads a file (buffer or local path) to Google Drive in the specified parent folder
   */
  public static async uploadFile(params: {
    authClient: any;
    filename: string;
    mimeType?: string;
    parentFolderId?: string;
    buffer?: Buffer;
    localFilePath?: string;
  }): Promise<{ fileId: string; webViewLink: string; webContentLink?: string }> {
    const { authClient, filename, mimeType = "image/jpeg", parentFolderId, buffer, localFilePath } = params;
    const drive = google.drive({ version: "v3", auth: authClient });

    let mediaBody: Readable;
    if (buffer) {
      mediaBody = Readable.from(buffer);
    } else if (localFilePath && fs.existsSync(localFilePath)) {
      mediaBody = fs.createReadStream(localFilePath);
    } else {
      throw new Error("Either buffer or valid localFilePath must be provided for upload.");
    }

    const fileMetadata: any = {
      name: filename,
    };
    if (parentFolderId) {
      fileMetadata.parents = [parentFolderId];
    }

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType,
        body: mediaBody,
      },
      fields: "id, name, webViewLink, webContentLink",
    });

    const fileId = response.data.id!;

    // Set permission to anyone with link can view
    try {
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });
    } catch (permErr) {
      console.warn("Could not set anyone reader permission on uploaded file:", permErr);
    }

    return {
      fileId,
      webViewLink: response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view?usp=sharing`,
      webContentLink: response.data.webContentLink || undefined,
    };
  }

  /**
   * Deletes a file from Google Drive
   */
  public static async deleteFile(authClient: any, fileId: string): Promise<boolean> {
    try {
      const drive = google.drive({ version: "v3", auth: authClient });
      await drive.files.delete({ fileId });
      return true;
    } catch (err) {
      console.error("Failed to delete Google Drive file:", err);
      return false;
    }
  }
}

