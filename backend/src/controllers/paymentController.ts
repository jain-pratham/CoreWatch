import { Response } from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import Customer from "../models/Customer";
import Plan from "../models/Plan";
import Invoice from "../models/Invoice";

const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (key_id && key_secret && !key_id.includes("sample") && !key_secret.includes("sample")) {
    return new Razorpay({
      key_id,
      key_secret,
    });
  }
  return null;
};

// @desc    Get Razorpay public configuration
// @route   GET /api/payment/config
// @access  Private
export const getPaymentConfig = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_corewatch_demo";
    const isLiveConfigured = !!(
      process.env.RAZORPAY_KEY_ID && 
      process.env.RAZORPAY_KEY_SECRET &&
      !process.env.RAZORPAY_KEY_ID.includes("sample")
    );

    res.status(200).json({
      success: true,
      keyId,
      currency: "INR",
      isLiveConfigured,
      merchantName: "CoreWatch AI Systems",
      merchantDescription: "Enterprise AI Camera Security Subscription",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Error fetching payment configuration",
    });
  }
};

// @desc    Create Razorpay Order for Plan Subscription
// @route   POST /api/payment/create-order
// @access  Private
export const createOrder = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: "Unauthorized user" });
      return;
    }

    const { planName, billingCycle = "monthly", customAmount } = req.body;

    let finalAmount = 1499; // Default fallback amount in INR
    let currency = "INR";
    let planMaxCameras = 5;

    // Look up Plan in DB to get exact pricing
    const plan = await Plan.findOne({ name: planName });
    if (plan) {
      finalAmount = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
      currency = plan.currency || "INR";
      planMaxCameras = plan.maxCameras || 5;
    } else if (customAmount && Number(customAmount) > 0) {
      finalAmount = Number(customAmount);
    }

    // Amount in sub-units (Paise for INR: ₹1 = 100 paise)
    const amountInSubUnits = Math.round(finalAmount * 100);
    const receipt = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const razorpay = getRazorpayInstance();

    if (razorpay) {
      // Live / Sandbox Razorpay API call
      const order = await razorpay.orders.create({
        amount: amountInSubUnits,
        currency: currency === "USD" ? "USD" : "INR",
        receipt,
        notes: {
          userId: user._id.toString(),
          userEmail: user.email,
          planName: planName || "Enterprise Plan",
          billingCycle,
        },
      });

      res.status(200).json({
        success: true,
        orderId: order.id,
        amount: finalAmount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        isDemo: false,
      });
    } else {
      // Mock / Developer Demo Order (when Razorpay credentials are not yet set)
      const mockOrderId = `order_demo_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      res.status(200).json({
        success: true,
        orderId: mockOrderId,
        amount: finalAmount,
        currency: currency || "INR",
        keyId: "rzp_test_corewatch_demo",
        isDemo: true,
        message: "Razorpay demo order created successfully.",
      });
    }
  } catch (error) {
    console.error("Razorpay createOrder error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to create Razorpay payment order",
    });
  }
};

// @desc    Verify Razorpay Payment Signature & Activate Subscription
// @route   POST /api/payment/verify-payment
// @access  Private
export const verifyPayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: "Unauthorized user" });
      return;
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planName,
      billingCycle = "monthly",
      amount,
      paymentMethod = "Razorpay UPI / Cards",
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      res.status(400).json({
        success: false,
        message: "Missing payment or order ID for verification",
      });
      return;
    }

    const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
    const isLive = !!(razorpaySecret && !razorpaySecret.includes("sample"));

    if (isLive) {
      // Validate HMAC-SHA256 signature
      const generatedSignature = crypto
        .createHmac("sha256", razorpaySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (generatedSignature !== razorpay_signature) {
        res.status(400).json({
          success: false,
          message: "Invalid Razorpay payment signature. Payment verification failed.",
        });
        return;
      }
    }

    // 1. Find or create Customer profile
    let customer = await Customer.findOne({ user: user._id });
    const planDoc = await Plan.findOne({ name: planName });
    const camerasCount = planDoc ? planDoc.maxCameras : 10;

    if (!customer) {
      customer = await Customer.create({
        user: user._id,
        plan: planName || "Enterprise Pro",
        status: "Active",
        cameras: camerasCount,
      });
    } else {
      customer.plan = planName || customer.plan;
      customer.status = "Active";
      customer.cameras = camerasCount;
      await customer.save();
    }

    // 2. Generate official Invoice record in database
    const count = await Invoice.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 101).padStart(4, "0")}`;

    const paidAmount = Number(amount) || (planDoc ? (billingCycle === "yearly" ? planDoc.yearlyPrice : planDoc.monthlyPrice) : 1499);

    const invoice = await Invoice.create({
      customer: customer._id,
      user: user._id,
      invoiceNumber,
      planName: planName || customer.plan,
      amount: paidAmount,
      currency: "INR",
      billingDate: new Date(),
      dueDate: new Date(Date.now() + (billingCycle === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000),
      status: "Paid",
      paymentMethod: `Razorpay (${razorpay_payment_id})`,
      description: `${planName} (${billingCycle}) - CoreWatch AI Computer Vision Subscription`,
    });

    console.log(`💳 [Razorpay Payment] Verified payment ${razorpay_payment_id} for user ${user.email}. Invoice: ${invoiceNumber}`);

    res.status(200).json({
      success: true,
      message: "Payment successfully verified and subscription activated!",
      data: {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        invoiceNumber: invoice.invoiceNumber,
        plan: customer.plan,
        status: customer.status,
        amount: paidAmount,
        invoiceId: invoice._id,
      },
    });
  } catch (error) {
    console.error("Razorpay verifyPayment error:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal error verifying Razorpay payment",
    });
  }
};
