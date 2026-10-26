import mongoose, { Schema, Document } from "mongoose";

export interface IInvoice extends Document {
  customer: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  invoiceNumber: string;
  planName: string;
  amount: number;
  currency: string;
  billingDate: Date;
  dueDate: Date;
  status: "Paid" | "Pending" | "Overdue" | "Draft";
  paymentMethod: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    planName: {
      type: String,
      required: true,
      default: "Enterprise Pro",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    billingDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    status: {
      type: String,
      enum: ["Paid", "Pending", "Overdue", "Draft"],
      default: "Paid",
    },
    paymentMethod: {
      type: String,
      default: "Razorpay",
    },
    description: {
      type: String,
      default: "Monthly Subscription & AI Camera Analytics",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Invoice || mongoose.model<IInvoice>("Invoice", invoiceSchema);
