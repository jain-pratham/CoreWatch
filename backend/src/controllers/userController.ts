import { Response } from "express";
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
