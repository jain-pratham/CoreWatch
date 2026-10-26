import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
    },
    notificationPreferences: {
      nativeNotificationsEnabled: { type: Boolean, default: true },
      soundEnabled: { type: Boolean, default: true },
      criticalSound: { type: Boolean, default: true },
      highSound: { type: Boolean, default: true },
      mediumSound: { type: Boolean, default: true },
      lowSound: { type: Boolean, default: false },
      masterVolume: { type: Number, default: 80, min: 0, max: 100 },
      criticalAlarmRepeatInterval: { type: Number, default: 8 },
      quietHoursEnabled: { type: Boolean, default: false },
      quietHoursStart: { type: String, default: "22:00" },
      quietHoursEnd: { type: String, default: "07:00" },
      escalationTimeoutMinutes: { type: Number, default: 5 },
      escalationSupervisorEmail: { type: String, default: "" },
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

if (mongoose.models && (mongoose.models as any).User) {
  delete (mongoose.models as any).User;
}

export default mongoose.models.User || mongoose.model("User", UserSchema);
