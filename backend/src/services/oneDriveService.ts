import fs from "fs";

export interface OneDriveTokens {
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;
}

export class OneDriveService {
  private static getCredentials() {
    const clientId = process.env.ONEDRIVE_CLIENT_ID;
    const clientSecret = process.env.ONEDRIVE_CLIENT_SECRET;
    const redirectUri = process.env.ONEDRIVE_REDIRECT_URI || "http://localhost:5000/api/integrations/onedrive/callback";

    if (!clientId || !clientSecret) {
      throw new Error("OneDrive OAuth credentials (ONEDRIVE_CLIENT_ID, ONEDRIVE_CLIENT_SECRET) are not configured.");
    }

    return { clientId, clientSecret, redirectUri };
  }

  /**
   * Generates Microsoft OAuth 2.0 consent authorization URL
   */
  public static getAuthUrl(stateData: string, customRedirectUri?: string): string {
    const { clientId, redirectUri } = this.getCredentials();
    const effectiveRedirectUri = customRedirectUri || redirectUri;
    const scopes = "Files.ReadWrite offline_access User.Read";

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: effectiveRedirectUri,
      response_mode: "query",
      scope: scopes,
      state: stateData,
    });

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  }

  /**
   * Exchanges authorization code for tokens
   */
  public static async exchangeCodeForTokens(
    code: string,
    customRedirectUri?: string
  ): Promise<{ tokens: OneDriveTokens; userEmail: string | null }> {
    const { clientId, clientSecret, redirectUri } = this.getCredentials();
    const effectiveRedirectUri = customRedirectUri || redirectUri;

    const bodyParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: effectiveRedirectUri,
      grant_type: "authorization_code",
    });

    const tokenRes = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: bodyParams.toString(),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`Failed to exchange Microsoft code for tokens: ${tokenRes.status} ${errText}`);
    }

    const data: any = await tokenRes.json();
    const expiresIn = Number(data.expires_in) || 3600;
    const tokenExpiry = new Date(Date.now() + expiresIn * 1000);

    const tokens: OneDriveTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenExpiry,
    };

    // Retrieve user email from Graph API
    let userEmail: string | null = null;
    try {
      const meRes = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });
      if (meRes.ok) {
        const meData: any = await meRes.json();
        userEmail = meData.mail || meData.userPrincipalName || null;
      }
    } catch (e) {
      console.warn("Could not retrieve OneDrive user profile:", e);
    }

    return { tokens, userEmail };
  }

  /**
   * Refreshes access token if expired or close to expiry
   */
  public static async getRefreshedAccessToken(
    refreshToken: string,
    currentAccessToken?: string | null,
    tokenExpiry?: Date | null
  ): Promise<{ accessToken: string; refreshToken: string; tokenExpiry: Date }> {
    // If current token is valid for at least 5 more minutes, reuse it
    if (currentAccessToken && tokenExpiry && new Date(tokenExpiry).getTime() - Date.now() > 5 * 60 * 1000) {
      return {
        accessToken: currentAccessToken,
        refreshToken,
        tokenExpiry: new Date(tokenExpiry),
      };
    }

    const { clientId, clientSecret } = this.getCredentials();
    const bodyParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });

    const res = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: bodyParams.toString(),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to refresh Microsoft token: ${res.status} ${errText}`);
    }

    const data: any = await res.json();
    const expiresIn = Number(data.expires_in) || 3600;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      tokenExpiry: new Date(Date.now() + expiresIn * 1000),
    };
  }

  /**
   * Finds or creates a root folder in OneDrive
   */
  public static async getOrCreateRootFolder(accessToken: string, folderName = "CoreWatch Evidence"): Promise<string> {
    // 1. Try to fetch existing folder by path
    const checkRes = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/root:/${encodeURIComponent(folderName)}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (checkRes.ok) {
      const data: any = await checkRes.json();
      return data.id;
    }

    // 2. If not found, create under root
    const createRes = await fetch("https://graph.microsoft.com/v1.0/me/drive/root/children", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: folderName,
        folder: {},
        "@microsoft.graph.conflictBehavior": "fail",
      }),
    });

    if (createRes.ok) {
      const createdData: any = await createRes.json();
      return createdData.id;
    }

    // If collision or already exists under children
    const listRes = await fetch("https://graph.microsoft.com/v1.0/me/drive/root/children", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (listRes.ok) {
      const listData: any = await listRes.json();
      const existing = (listData.value || []).find((item: any) => item.name === folderName);
      if (existing) return existing.id;
    }

    throw new Error(`Failed to create root OneDrive folder '${folderName}'`);
  }

  /**
   * Finds or creates a subfolder inside a given parent folder
   */
  public static async getOrCreateSubfolder(
    accessToken: string,
    parentFolderId: string,
    folderName: string
  ): Promise<string> {
    const listRes = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/items/${parentFolderId}/children?$select=id,name,folder`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (listRes.ok) {
      const listData: any = await listRes.json();
      const existing = (listData.value || []).find((item: any) => item.name === folderName);
      if (existing) {
        return existing.id;
      }
    }

    const createRes = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${parentFolderId}/children`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: folderName,
        folder: {},
        "@microsoft.graph.conflictBehavior": "fail",
      }),
    });

    if (createRes.ok) {
      const createdData: any = await createRes.json();
      return createdData.id;
    }

    const err = await createRes.text();
    throw new Error(`Failed to create subfolder '${folderName}': ${err}`);
  }

  /**
   * Uploads file buffer or local file to OneDrive
   */
  public static async uploadFile(params: {
    accessToken: string;
    parentFolderId: string;
    filename: string;
    buffer?: Buffer;
    localFilePath?: string;
    mimeType?: string;
  }): Promise<{ fileId: string; webViewLink: string; webUrl?: string }> {
    const { accessToken, parentFolderId, filename, buffer, localFilePath, mimeType = "image/jpeg" } = params;

    let fileData: Buffer;
    if (buffer) {
      fileData = buffer;
    } else if (localFilePath && fs.existsSync(localFilePath)) {
      fileData = fs.readFileSync(localFilePath);
    } else {
      throw new Error("Either buffer or localFilePath must be provided for OneDrive upload.");
    }

    const uploadUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${parentFolderId}:/${encodeURIComponent(
      filename
    )}:/content`;

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": mimeType,
      },
      body: new Uint8Array(fileData),
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      throw new Error(`Failed to upload file to OneDrive: ${uploadRes.status} ${err}`);
    }

    const itemData: any = await uploadRes.json();
    const fileId = itemData.id;
    let webViewLink = itemData.webUrl || "";

    // Generate anonymous/view sharing link
    try {
      const shareRes = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/createLink`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "view",
          scope: "anonymous",
        }),
      });

      if (shareRes.ok) {
        const shareData: any = await shareRes.json();
        if (shareData.link?.webUrl) {
          webViewLink = shareData.link.webUrl;
        }
      }
    } catch (shareErr) {
      console.warn("Could not create anonymous share link for OneDrive file:", shareErr);
    }

    return {
      fileId,
      webViewLink: webViewLink || itemData.webUrl,
      webUrl: itemData.webUrl,
    };
  }

  /**
   * Deletes a file from OneDrive
   */
  public static async deleteFile(accessToken: string, fileId: string): Promise<boolean> {
    try {
      const res = await fetch(`https://graph.microsoft.com/v1.0/me/drive/items/${fileId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.status === 204 || res.ok;
    } catch (err) {
      console.error("Failed to delete OneDrive file:", err);
      return false;
    }
  }
}

