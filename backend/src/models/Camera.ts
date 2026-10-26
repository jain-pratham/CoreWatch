import mongoose, { Schema, Document } from "mongoose";

export interface ICamera extends Document {
  cameraKey: string;
  userId?: mongoose.Types.ObjectId;
  shopId?: mongoose.Types.ObjectId;
  locationName?: string;
  name?: string;
  ipAddress?: string;
  port?: number;
  username?: string;
  password?: string;
  rtspUrl?: string;
  manufacturer?: string;
  cameraModel?: string;
  secretToken?: string;
  streamType?: string;
  streamUrl?: string;
  status?: string;
  humanDetection?: boolean;
  zoneMonitoring?: boolean;
  afterHoursSecurity?: boolean;
  suspiciousMovement?: boolean;
  cameraHealth?: boolean;
  restrictedZoneEntry?: boolean;
  zoneLoiteringDwell?: boolean;
  valuableAreaActivity?: boolean;
  cashCounterActivity?: boolean;
}

const CameraSchema = new Schema<ICamera>(
  {
    cameraKey: {
      type: String,
      required: [true, "Camera Key is required"],
      unique: true,
      trim: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
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
    secretToken: {
      type: String,
    },
    streamType: {
      type: String,
      default: "IP_WEBCAM",
    },
    streamUrl: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "ONLINE",
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

export default mongoose.models.Camera || mongoose.model<ICamera>("Camera", CameraSchema);
