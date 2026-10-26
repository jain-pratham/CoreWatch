import mongoose, { Schema, Document, Model } from "mongoose";

// ============================================================================
// 1. TYPE INTERFACES
// ============================================================================

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IShop extends Document {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  address?: string;
  businessHours: {
    open: string;
    close: string;
    timeZone: string;
  };
  activeNightGuard: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICamera extends Document {
  shopId: mongoose.Types.ObjectId;
  name: string;
  cameraKey: string;
  secretToken: string;
  streamType: "IP_WEBCAM" | "RTSP";
  streamUrl?: string;
  status: "ONLINE" | "OFFLINE";
  humanDetection: boolean;
  zoneMonitoring: boolean;
  afterHoursSecurity: boolean;
  suspiciousMovement: boolean;
  cameraHealth: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAlert extends Document {
  cameraKey: string;
  shopId: mongoose.Types.ObjectId;
  threatLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  threatType: "HUMAN_INTRUSION" | "AFTER_HOURS_LOITERING" | "VANDALISM";
  imageUrl: string;
  timestamp: Date;
  isResolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// 2. MONGOOSE SCHEMAS
// ============================================================================

// User Schema Definition
const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    phone: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Shop Schema Definition
const ShopSchema = new Schema<IShop>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner association is required"],
    },
    name: {
      type: String,
      required: [true, "Shop name is required"],
      trim: true,
    },
    address: {
      type: String,
      default: "",
    },
    businessHours: {
      open: {
        type: String,
        default: "09:00",
      },
      close: {
        type: String,
        default: "21:00",
      },
      timeZone: {
        type: String,
        default: "UTC",
      },
    },
    activeNightGuard: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Camera Schema Definition
const CameraSchema = new Schema<ICamera>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: [true, "Shop association is required"],
    },
    name: {
      type: String,
      required: [true, "Camera name is required"],
      trim: true,
    },
    cameraKey: {
      type: String,
      required: [true, "Camera Key is required"],
      unique: true,
      index: true,
      trim: true,
    },
    secretToken: {
      type: String,
      required: [true, "Secret token is required"],
    },
    streamType: {
      type: String,
      enum: ["IP_WEBCAM", "RTSP"],
      default: "IP_WEBCAM",
    },
    streamUrl: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["ONLINE", "OFFLINE"],
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
  },
  {
    timestamps: true,
  }
);

// Alert Schema Definition
const AlertSchema = new Schema<IAlert>(
  {
    cameraKey: {
      type: String,
      required: [true, "Camera Key is required"],
      index: true,
      trim: true,
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: [true, "Shop association is required"],
      index: true,
    },
    threatLevel: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "HIGH",
    },
    threatType: {
      type: String,
      enum: ["HUMAN_INTRUSION", "AFTER_HOURS_LOITERING", "VANDALISM"],
      default: "HUMAN_INTRUSION",
    },
    imageUrl: {
      type: String,
      required: [true, "Snapshot image URL is required"],
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================================
// 3. NEXT.JS COMPILATION CACHING EXPORTS
// ============================================================================

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export const Shop: Model<IShop> =
  mongoose.models.Shop || mongoose.model<IShop>("Shop", ShopSchema);

export const Camera: Model<ICamera> =
  mongoose.models.Camera || mongoose.model<ICamera>("Camera", CameraSchema);

export const Alert: Model<IAlert> =
  mongoose.models.Alert || mongoose.model<IAlert>("Alert", AlertSchema);
