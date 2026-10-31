import mongoose, { Schema } from "mongoose";

const CustomerSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    company: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    cameras: {
      type: Number,
      default: 5,
    },
    plan: {
      type: String,
      default: "Enterprise Pro",
    },
    addressLine1: {
      type: String,
      trim: true,
    },
    addressLine2: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "Pending", "Suspended"],
      default: "Pending",
    },
    avatar: {
      type: String,
      default: "",
    },
    googleDriveSettings: {
      isEnabled: { type: Boolean, default: false },
      refreshToken: { type: String, default: null },
      accessToken: { type: String, default: null },
      tokenExpiry: { type: Date, default: null },
      rootFolderId: { type: String, default: null },
      userEmail: { type: String, default: null },
    },
    oneDriveSettings: {
      isEnabled: { type: Boolean, default: false },
      refreshToken: { type: String, default: null },
      accessToken: { type: String, default: null },
      tokenExpiry: { type: Date, default: null },
      rootFolderId: { type: String, default: null },
      userEmail: { type: String, default: null },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Customer", CustomerSchema);
