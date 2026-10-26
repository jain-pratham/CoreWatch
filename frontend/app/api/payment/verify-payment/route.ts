import { NextResponse } from "next/server";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/dbConnect";
import Customer from "@/models/Customer";
import Invoice from "@/models/Invoice";

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
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planName = "Standard Plan",
      billingCycle = "monthly",
      amount = 1499,
      camerasCount = 5,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return NextResponse.json({ success: false, error: "Missing payment verification parameters" }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    const isLive = !!(secret && !secret.includes("sample"));

    if (isLive) {
      const expectedSignature = crypto
        .createHmac("sha256", secret!)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return NextResponse.json({ success: false, error: "Invalid Razorpay payment signature" }, { status: 400 });
      }
    }

    // Find or update Customer
    let customer = await Customer.findOne({ user: userId });
    if (!customer) {
      customer = await Customer.create({
        user: userId,
        plan: planName,
        status: "Active",
        cameras: Number(camerasCount) || 5,
      });
    } else {
      customer.plan = planName;
      customer.status = "Active";
      customer.cameras = Number(camerasCount) || customer.cameras || 5;
      await customer.save();
    }

    // Create Invoice
    const count = await Invoice.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 101).padStart(4, "0")}`;

    const invoice = await Invoice.create({
      customer: customer._id,
      user: userId,
      invoiceNumber,
      planName,
      amount: Number(amount) || 1499,
      currency: "INR",
      billingDate: new Date(),
      dueDate: new Date(Date.now() + (billingCycle === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000),
      status: "Paid",
      paymentMethod: `Razorpay (${razorpay_payment_id})`,
      description: `${planName} (${billingCycle}) - CoreWatch AI Computer Vision Subscription`,
    });

    return NextResponse.json({
      success: true,
      message: "Payment successfully verified and subscription activated!",
      data: {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        invoiceNumber: invoice.invoiceNumber,
        plan: customer.plan,
        amount: invoice.amount,
        status: customer.status,
      },
    });
  } catch (error: any) {
    console.error("Verify payment route error:", error);
    return NextResponse.json({ success: false, error: error.message || "Server Error" }, { status: 500 });
  }
}
