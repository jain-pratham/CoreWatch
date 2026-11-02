import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";

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
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: 6,
      select: false, // Prevents password from being returned in queries by default
    },
    role: {
      type: String,
      enum: ["admin", "user", "demo"],
      default: "user",
    },
    avatar: {
      type: String,
      default: "",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
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
    twoFactorSettings: {
      isEnabled: { type: Boolean, default: false },
      secret: { type: String, default: null },
      backupCodes: [{ type: String }],
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", UserSchema);
