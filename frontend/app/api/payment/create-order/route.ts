import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import Razorpay from "razorpay";
import dbConnect from "@/lib/dbConnect";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_corewatch_key_2026";

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
    return null;
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    const userId = getUserIdFromAuth(request);
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { planName, billingCycle = "monthly", amount = 1499, currency = "INR" } = body;

    const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    const isLive = !!(key_id && key_secret && !key_id.includes("sample") && !key_secret.includes("sample"));

    if (isLive) {
      const razorpay = new Razorpay({
        key_id: key_id!,
        key_secret: key_secret!,
      });

      const order = await razorpay.orders.create({
        amount: Math.round(Number(amount) * 100), // paise
        currency: currency === "USD" ? "USD" : "INR",
        receipt: `rcpt_${Date.now()}`,
        notes: {
          userId,
          planName,
          billingCycle,
        },
      });

      return NextResponse.json({
        success: true,
        orderId: order.id,
        amount: Number(amount),
        currency: order.currency,
        keyId: key_id,
        isDemo: false,
      });
    } else {
      // Mock / Demo Sandbox Order
      const mockOrderId = `order_demo_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      return NextResponse.json({
        success: true,
        orderId: mockOrderId,
        amount: Number(amount),
        currency: currency || "INR",
        keyId: key_id || "rzp_test_corewatch_demo",
        isDemo: true,
        message: "Razorpay demo order created successfully.",
      });
    }
  } catch (error: any) {
    console.error("Create order route error:", error);
    return NextResponse.json({ success: false, error: error.message || "Server Error" }, { status: 500 });
  }
}
