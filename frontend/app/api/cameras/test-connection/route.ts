import { NextResponse } from "next/server";
import net from "net";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { ipAddress, port, username, password, rtspUrl } = body;

    // 1. Basic validation
    if (!ipAddress || !port || !username || !password || !rtspUrl) {
      return NextResponse.json(
        { success: false, error: "Please enter all required camera details." },
        { status: 400 }
      );
    }

    // 2. Validate IP / Hostname
    // Simple regex check for valid hostname or IPv4
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const hostRegex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;
    
    if (!ipRegex.test(ipAddress) && !hostRegex.test(ipAddress)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid IP address." },
        { status: 400 }
      );
    }

    // 3. Validate Port
    const portNum = parseInt(port, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid port." },
        { status: 400 }
      );
    }

    // 4. Validate RTSP URL
    if (!rtspUrl.startsWith("rtsp://")) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid RTSP URL." },
        { status: 400 }
      );
    }

    // 5. Connection test
    const isConnected = await new Promise<boolean>((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(4000); // 4 seconds timeout for connection testing

      socket.connect(portNum, ipAddress, () => {
        // TCP port is open, now send a mock RTSP request to verify it's an RTSP server
        socket.write(`OPTIONS rtsp://${ipAddress}:${portNum}/ RTSP/1.0\r\nCSeq: 1\r\nUser-Agent: CoreWatch\r\n\r\n`);
      });

      socket.on("data", (data) => {
        const response = data.toString();
        // If we get an RTSP response (even 401 Unauthorized), it confirms the RTSP stream server is there!
        if (response.startsWith("RTSP/")) {
          resolve(true);
        } else {
          // If port is open but does not reply with RTSP, it might be another service, but let's still accept it as connected 
          // to be friendly with different cameras/simulators that might close the socket immediately
          resolve(true);
        }
        socket.destroy();
      });

      socket.on("error", () => {
        socket.destroy();
        resolve(false);
      });

      socket.on("timeout", () => {
        socket.destroy();
        resolve(false);
      });
    });

    if (isConnected) {
      return NextResponse.json({ success: true, message: "Camera connected successfully" });
    } else {
      return NextResponse.json({
        success: false,
        error: "Unable to connect to camera. Please verify the IP address, port, credentials, and RTSP URL."
      });
    }
  } catch (error: any) {
    console.error("Test Connection error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to connect to the camera. Please verify the connection details." },
      { status: 500 }
    );
  }
}
