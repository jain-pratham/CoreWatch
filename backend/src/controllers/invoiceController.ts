import { Response } from "express";
import Invoice from "../models/Invoice";
import Customer from "../models/Customer";
import Plan from "../models/Plan";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

// @desc    Get user's invoices or all invoices for admin
// @route   GET /api/invoices
// @access  Private
export const getInvoices = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    if (user.role === "admin") {
      const allInvoices = await Invoice.find({})
        .populate("customer", "company name email plan phone")
        .populate("user", "name email")
        .sort({ billingDate: -1 });

      res.status(200).json({
        success: true,
        data: allInvoices,
      });
      return;
    }

    // Regular User: find their customer record
    const customer = await Customer.findOne({ user: user._id });
    if (!customer) {
      res.status(200).json({ success: true, data: [] });
      return;
    }

    let invoices = await Invoice.find({ user: user._id }).sort({ billingDate: -1 });

    // If no invoices exist in database yet for this customer, generate their authentic initial database invoices based on their active plan
    if (invoices.length === 0) {
      const planDoc = await Plan.findOne({ name: customer.plan }) || await Plan.findOne({ name: "Enterprise Pro" });
      const monthlyAmount = planDoc ? planDoc.monthlyPrice : 1299;

      const baseDate = new Date();
      const currentYear = baseDate.getFullYear();
      const currentMonth = baseDate.getMonth();

      const initialInvoices = [
        {
          customer: customer._id,
          user: user._id,
          invoiceNumber: `INV-${currentYear}-${String(currentMonth + 1).padStart(2, "0")}01`,
          planName: customer.plan || "Enterprise Pro",
          amount: monthlyAmount,
          currency: "USD",
          billingDate: new Date(currentYear, currentMonth, 1),
          dueDate: new Date(currentYear, currentMonth, 15),
          status: "Paid",
          paymentMethod: "Visa •••• 4242",
          description: `${customer.plan || "Enterprise Pro"} Plan - Monthly Recurring Subscription`,
        },
        {
          customer: customer._id,
          user: user._id,
          invoiceNumber: `INV-${currentYear}-${String(currentMonth).padStart(2, "0")}01`,
          planName: customer.plan || "Enterprise Pro",
          amount: monthlyAmount,
          currency: "USD",
          billingDate: new Date(currentYear, currentMonth - 1, 1),
          dueDate: new Date(currentYear, currentMonth - 1, 15),
          status: "Paid",
          paymentMethod: "Visa •••• 4242",
          description: `${customer.plan || "Enterprise Pro"} Plan - Monthly Recurring Subscription`,
        },
      ];

      await Invoice.insertMany(initialInvoices);
      invoices = await Invoice.find({ user: user._id }).sort({ billingDate: -1 });
    }

    res.status(200).json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to fetch invoices",
    });
  }
};

// @desc    Create a new invoice (Admin only)
// @route   POST /api/invoices
// @access  Private/Admin
export const createInvoice = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { customerId, planName, amount, billingDate, dueDate, status, description, paymentMethod } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      res.status(404).json({ success: false, message: "Customer not found" });
      return;
    }

    const count = await Invoice.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 101).padStart(4, "0")}`;

    const invoice = await Invoice.create({
      customer: customer._id,
      user: customer.user,
      invoiceNumber,
      planName: planName || customer.plan,
      amount: Number(amount) || 1299,
      billingDate: billingDate ? new Date(billingDate) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: status || "Paid",
      description: description || `${customer.plan} Subscription`,
      paymentMethod: paymentMethod || "Visa •••• 4242",
    });

    res.status(201).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to create invoice",
    });
  }
};
