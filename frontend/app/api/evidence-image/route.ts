import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");
    const rawUrl = searchParams.get("url");

    let targetUrl = "";
    let extractedFileId = fileId;

    if (fileId) {
      targetUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
    } else if (rawUrl) {
      if (rawUrl.includes("drive.google.com/file/d/")) {
        const idMatch = rawUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (idMatch) {
          extractedFileId = idMatch[1];
          targetUrl = `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
        } else {
          targetUrl = rawUrl;
        }
      } else if (rawUrl.includes("lh3.googleusercontent.com/d/")) {
        const idMatch = rawUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (idMatch) extractedFileId = idMatch[1];
        targetUrl = rawUrl;
      } else {
        targetUrl = rawUrl;
      }
    }

    if (!targetUrl) {
      return new NextResponse("Missing fileId or url parameter", { status: 400 });
    }

    // Server-side fetch without browser referer to avoid Google 429 hotlink block
    const resp = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8"
      }
    });

    const isHtml = resp.headers.get("content-type")?.includes("text/html");
    if (!resp.ok || isHtml) {
      console.warn(`[Evidence Proxy] Upstream returned status ${resp.status} (isHtml: ${isHtml}) for ${targetUrl}`);
      // Fallback: Try Google Drive thumbnail endpoint
      if (extractedFileId) {
        const fallbackResp = await fetch(`https://drive.google.com/thumbnail?id=${extractedFileId}&sz=w1200`);
        if (fallbackResp.ok && !fallbackResp.headers.get("content-type")?.includes("text/html")) {
          const contentType = fallbackResp.headers.get("content-type") || "image/jpeg";
          const buffer = await fallbackResp.arrayBuffer();
          return new NextResponse(buffer, {
            headers: {
              "Content-Type": contentType,
              "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
            }
          });
        }
      }
      return new NextResponse("Failed to load evidence image", { status: resp.ok ? 502 : resp.status });
    }

    const contentType = resp.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await resp.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      }
    });
  } catch (err: any) {
    console.error("[Evidence Proxy Error]", err);
    return new NextResponse(err.message || "Internal server error", { status: 500 });
  }
}
