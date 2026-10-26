import mongoose, { Schema } from "mongoose";

const CameraSchema = new Schema(
  {
    cameraKey: {
      type: String,
      required: [true, "Camera Key is required"],
      unique: true,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User association is required"],
    },
    locationName: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    port: {
      type: Number,
      default: 554,
    },
    username: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      select: false,
    },
    rtspUrl: {
      type: String,
      trim: true,
    },
    manufacturer: {
      type: String,
      trim: true,
    },
    cameraModel: {
      type: String,
      trim: true,
    },
    humanDetection: {
      type: Boolean,
      default: true,
    },
    zoneMonitoring: {
      type: Boolean,
      default: true,
    },
    afterHoursSecurity: {
      type: Boolean,
      default: true,
    },
    suspiciousMovement: {
      type: Boolean,
      default: true,
    },
    cameraHealth: {
      type: Boolean,
      default: true,
    },
    restrictedZoneEntry: {
      type: Boolean,
      default: true,
    },
    zoneLoiteringDwell: {
      type: Boolean,
      default: true,
    },
    valuableAreaActivity: {
      type: Boolean,
      default: true,
    },
    cashCounterActivity: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Camera || mongoose.model("Camera", CameraSchema);
