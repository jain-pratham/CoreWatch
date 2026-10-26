import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { alertEmitter } from "@/lib/alertEvents";

export const dynamic = "force-dynamic";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_corewatch_key_2026";

export async function GET(request: NextRequest) {
  try {
    // 1. Extract token from query params or Authorization header
    const token =
      request.nextUrl.searchParams.get("token") ||
      request.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return new Response("Unauthorized", { status: 401 });
    }

    let userId: string;
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      userId = decoded.id;
    } catch {
      return new Response("Invalid token", { status: 401 });
    }

    // 2. Set up SSE stream
    const encoder = new TextEncoder();
    let isClosed = false;

    const stream = new ReadableStream({
      start(controller) {
        // Initial connected message
        controller.enqueue(
          encoder.encode(`event: connected\ndata: ${JSON.stringify({ status: "connected", userId })}\n\n`)
        );

        // Alert listener for this user
        const alertListener = (alertData: any) => {
          if (isClosed) return;
          try {
            const payload = `event: alert\ndata: ${JSON.stringify(alertData)}\n\n`;
            controller.enqueue(encoder.encode(payload));
          } catch (err) {
            console.error("SSE stream push error:", err);
          }
        };

        const eventKey = `alert:${userId}`;
        alertEmitter.on(eventKey, alertListener);

        // Keep-alive heartbeat every 25s
        const heartbeatInterval = setInterval(() => {
          if (isClosed) {
            clearInterval(heartbeatInterval);
            return;
          }
          try {
            controller.enqueue(encoder.encode(`: keep-alive\n\n`));
          } catch {
            clearInterval(heartbeatInterval);
          }
        }, 25000);

        // Cleanup on client disconnect
        request.signal.addEventListener("abort", () => {
          isClosed = true;
          clearInterval(heartbeatInterval);
          alertEmitter.off(eventKey, alertListener);
          try {
            controller.close();
          } catch {}
        });
      },
      cancel() {
        isClosed = true;
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("SSE Route Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
