import { Response } from "express";
import crypto from "crypto";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import User from "../models/User";
import Customer from "../models/Customer";

// @desc    Get all users (excluding passwords)
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find({}).select("-password");
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Server error fetching users",
    });
  }
};

// @desc    Create a user (Admin bypass)
// @route   POST /api/users
// @access  Private/Admin
export const createUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ success: false, message: "User already exists" });
      return;
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || "user",
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Server error creating user",
    });
  }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Server error deleting user",
    });
  }
};

// @desc    Get current user profile (Admin / User)
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    const customer = await Customer.findOne({ user: user._id });
    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: (user as any).avatar || "",
        createdAt: (user as any).createdAt,
        phone: customer?.phone || "",
        company: customer?.company || "",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Server error fetching profile",
    });
  }
};

// @desc    Update current user profile (Admin / User)
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    const { name, phone, company, avatar } = req.body;
    if (name) user.name = name.trim();
    if (avatar !== undefined) (user as any).avatar = avatar;
    await user.save();

    // Also sync to Customer record if one exists
    let customer = await Customer.findOne({ user: user._id });
    if (customer) {
      if (phone !== undefined) customer.phone = phone.trim();
      if (company !== undefined) customer.company = company.trim();
      if (avatar !== undefined) (customer as any).avatar = avatar;
      await customer.save();
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: (user as any).avatar || "",
        phone: customer?.phone || "",
        company: customer?.company || "",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Server error updating profile",
    });
  }
};

// @desc    Change current user password
// @route   PUT /api/users/change-password
// @access  Private
export const changeUserPassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, message: "Current password and new password are required" });
      return;
    }
    if (newPassword.length < 6) {
      res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
      return;
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const isMatch = await (user as any).matchPassword(currentPassword);
    if (!isMatch) {
      res.status(400).json({ success: false, message: "Incorrect current password" });
      return;
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Server error changing password",
    });
  }
};

// @desc    Get 2FA status and setup secret
// @route   GET /api/users/2fa
// @access  Private
export const getTwoFactorStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const twoFA = (user as any).twoFactorSettings || {};
    const isEnabled = !!twoFA.isEnabled;

    if (isEnabled) {
      res.status(200).json({
        success: true,
        data: {
          isEnabled: true,
          backupCodesCount: Array.isArray(twoFA.backupCodes) ? twoFA.backupCodes.length : 0,
        },
      });
      return;
    }

    // Generate a fresh 16-char base32 secret and backup codes for setup
    const secretChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    let generatedSecret = "";
    const randBytes = crypto.randomBytes(24);
    for (let i = 0; i < 16; i++) {
      generatedSecret += secretChars[randBytes[i] % secretChars.length];
    }

    // Generate 6 backup codes like CW-1234-5678
    const backupCodes: string[] = [];
    for (let i = 0; i < 6; i++) {
      const p1 = Math.floor(1000 + Math.random() * 9000);
      const p2 = Math.floor(1000 + Math.random() * 9000);
      backupCodes.push(`CW-${p1}-${p2}`);
    }

    const otpauthUrl = `otpauth://totp/CoreWatch:${encodeURIComponent(user.email)}?secret=${generatedSecret}&issuer=CoreWatch`;

    res.status(200).json({
      success: true,
      data: {
        isEnabled: false,
        secret: generatedSecret,
        otpauthUrl,
        backupCodes,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Server error fetching 2FA status",
    });
  }
};

// @desc    Verify and enable 2FA
// @route   POST /api/users/2fa/verify
// @access  Private
export const verifyAndEnableTwoFactor = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { code, secret, backupCodes } = req.body;
    if (!code || !secret) {
      res.status(400).json({ success: false, message: "Verification code and secret key are required" });
      return;
    }

    const cleanCode = code.toString().trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      res.status(400).json({ success: false, message: "Verification code must be exactly 6 numeric digits" });
      return;
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    (user as any).twoFactorSettings = {
      isEnabled: true,
      secret: secret.trim(),
      backupCodes: Array.isArray(backupCodes) ? backupCodes : [],
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: "Two-Factor Authentication activated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Server error activating 2FA",
    });
  }
};

// @desc    Disable 2FA
// @route   POST /api/users/2fa/disable
// @access  Private
export const disableTwoFactor = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    (user as any).twoFactorSettings = {
      isEnabled: false,
      secret: null,
      backupCodes: [],
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: "Two-Factor Authentication disabled successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Server error disabling 2FA",
    });
  }
};
