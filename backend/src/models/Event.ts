import mongoose, { Schema, Document } from "mongoose";

export interface IEvent extends Document {
  cameraId: string;
  customerId: mongoose.Types.ObjectId;
  eventType: string;
  timestamp: Date;
  confidence: number;
  personCount: number;
  snapshotPath: string;
  cloudFileId?: string;
  cloudViewLink?: string;
  cloudProvider?: string;
  status: "unread" | "read";
}

const EventSchema: Schema = new Schema(
  {
    cameraId: {
      type: String,
      required: [true, "Camera ID is required"],
      trim: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer ID is required"],
    },
    eventType: {
      type: String,
      required: [true, "Event type is required"],
      default: "person_detected",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    confidence: {
      type: Number,
      required: [true, "Confidence is required"],
    },
    personCount: {
      type: Number,
      required: [true, "Person count is required"],
      default: 1,
    },
    snapshotPath: {
      type: String,
      required: [true, "Snapshot path is required"],
    },
    cloudFileId: {
      type: String,
      default: null,
    },
    cloudViewLink: {
      type: String,
      default: null,
    },
    cloudProvider: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["unread", "read"],
      default: "unread",
    },
  },
  {
    timestamps: true,
  }
);

// Optimize indexing for fast queries by customer and timestamp
EventSchema.index({ customerId: 1, timestamp: -1 });

export default mongoose.model<IEvent>("Event", EventSchema);
