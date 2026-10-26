import mongoose, { Schema } from "mongoose";

const AlertSchema = new Schema(
  {
    cameraKey: {
      type: String,
      required: [true, "Camera Key is required"],
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User association is required"],
    },
    imageUrl: {
      type: String,
      default: "",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    message: {
      type: String,
      default: "Human detected in shop!",
    },
    reason: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: String,
      default: "ZONE_MONITORING",
    },
    eventType: {
      type: String,
      default: "",
    },
    severity: {
      type: String,
      enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
      default: "HIGH",
    },
    status: {
      type: String,
      enum: ["NEW", "ACKNOWLEDGED", "RESOLVED"],
      default: "NEW",
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
    acknowledgedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolutionNotes: {
      type: String,
      default: "",
      trim: true,
    },
    escalated: {
      type: Boolean,
      default: false,
    },
    escalatedAt: {
      type: Date,
      default: null,
    },
    cameraName: {
      type: String,
      default: "",
    },
    zoneName: {
      type: String,
      default: "",
    },
    fingerprint: {
      type: String,
      default: "",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

// Indexes to optimize incident filtering, status queries, and deduplication
AlertSchema.index({ userId: 1, timestamp: -1 });
AlertSchema.index({ userId: 1, status: 1, severity: 1, timestamp: -1 });
AlertSchema.index({ cameraKey: 1, timestamp: -1 });
AlertSchema.index({ fingerprint: 1, timestamp: -1 });

if (mongoose.models && (mongoose.models as any).Alert) {
  delete (mongoose.models as any).Alert;
}

export default mongoose.model("Alert", AlertSchema);
