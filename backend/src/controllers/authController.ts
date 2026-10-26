import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import User from "../models/User";
import Customer from "../models/Customer";

const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "super_secret_corewatch_key_2026", {
    expiresIn: "30d",
  });
};

interface SendEmailResult {
  success: boolean;
  previewUrl?: string | false;
}

const sendVerificationEmail = async (email: string, name: string, token: string): Promise<SendEmailResult> => {
  try {
    const host = process.env.SMTP_HOST || process.env.EMAIL_HOST || "smtp.ethereal.email";
    const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT) || 587;
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    const fromEmail = process.env.EMAIL_FROM || user || "support@corewatch.ai";

    if (!user || !pass) {
      console.warn("SMTP credentials not configured. Verification email will not be sent.");
      return { success: false };
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your CoreWatch Account</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #0b0f19;
            color: #f1f5f9;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #111827;
            border: 1px solid #1f2937;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
          }
          .header {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            padding: 30px;
            text-align: center;
            border-bottom: 1px solid #1f2937;
          }
          .logo {
            font-size: 24px;
            font-weight: 800;
            color: #38bdf8;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          .content {
            padding: 40px 30px;
            line-height: 1.6;
          }
          h1 {
            font-size: 22px;
            font-weight: 700;
            color: #ffffff;
            margin-top: 0;
            margin-bottom: 20px;
          }
          p {
            color: #94a3b8;
            font-size: 15px;
            margin-bottom: 24px;
          }
          .btn-container {
            text-align: center;
            margin: 35px 0;
          }
          .btn {
            background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 30px;
            font-size: 14px;
            font-weight: 700;
            border-radius: 8px;
            display: inline-block;
            box-shadow: 0 4px 12px rgba(2, 132, 199, 0.2);
          }
          .footer {
            background-color: #0b0f19;
            padding: 24px 30px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #1f2937;
          }
          .divider {
            height: 1px;
            background-color: #1f2937;
            margin: 30px 0;
          }
          .alternative-link {
            word-break: break-all;
            color: #38bdf8;
            font-size: 13px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">CoreWatch</div>
          </div>
          <div class="content">
            <h1>Verify your email address, ${name}!</h1>
            <p>Thank you for registering a direct account with CoreWatch.</p>
            <p>To active your computer vision safety dashboard feeds and alerts, please verify your email address by clicking the button below:</p>
            
            <div class="btn-container">
              <a href="${verificationLink}" class="btn" target="_blank">Verify Email Address</a>
            </div>

            <p>If you did not sign up for a CoreWatch account, you can safely ignore this email.</p>
            
            <div class="divider"></div>
            
            <p style="font-size: 13px; margin-bottom: 8px;">If the button above does not work, copy and paste this URL into your browser:</p>
            <a href="${verificationLink}" class="alternative-link" target="_blank">${verificationLink}</a>
          </div>
          <div class="footer">
            &copy; 2026 CoreWatch AI System. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"CoreWatch Support" <${fromEmail}>`,
      to: email,
      subject: "Action Required: Verify Your CoreWatch Account",
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}. Message ID: ${info.messageId}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`📬 Ethereal Email Preview URL: ${previewUrl}`);
    }
    return { success: true, previewUrl };
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return { success: false };
  }
};

// @desc    Register a new user (including admins)
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400).json({ success: false, message: "User already exists" });
      return;
    }

    // Determine final role - fallback to 'user' if not explicitly provided or invalid
    const finalRole = ["admin", "user", "demo"].includes(role) ? role : "user";
    
    // Generate verification token
    const token = crypto.randomBytes(32).toString("hex");

    const user = await User.create({
      name,
      email,
      password,
      role: finalRole,
      isVerified: false,
      verificationToken: token,
    });

    if (user) {
      const emailResult = await sendVerificationEmail(email, name, token);
      res.status(201).json({
        success: true,
        message: "Registration successful! A verification email has been sent. Please check your inbox.",
        emailSent: emailResult.success,
        previewUrl: emailResult.previewUrl || undefined,
      });
    } else {
      res.status(400).json({ success: false, message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Server error during registration",
    });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user and explicitly select password field
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      res.status(401).json({ success: false, message: "Invalid email or password" });
      return;
    }

    if (!user.isVerified && user.role !== "admin") {
      res.status(401).json({
        success: false,
        message: "Your email address is not verified. Please check your email for the verification link.",
        isVerified: false,
      });
      return;
    }

    const isMatch = await (user as any).matchPassword(password);

    if (isMatch) {
      res.status(200).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id.toString()),
        },
      });
    } else {
      res.status(401).json({ success: false, message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Server error during login",
    });
  }
};

// @desc    Verify email address via link token (Public)
// @route   POST /api/auth/verify-email
// @access  Public
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ success: false, message: "Verification token is required" });
      return;
    }

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      res.status(400).json({ success: false, message: "Verification link is invalid or expired" });
      return;
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    // Create a pending customer profile for the verified user if not existing
    let customer = await Customer.findOne({ user: user._id });
    if (!customer) {
      customer = await Customer.create({
        user: user._id,
        status: "Pending",
        cameras: 1,
        plan: "Demo Free",
      });
    }

    res.status(200).json({
      success: true,
      message: "Email verified successfully!",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id.toString()),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Server error verifying email",
    });
  }
};

// @desc    Get current logged in user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: any, res: Response): Promise<void> => {
  try {
    if (req.user) {
      res.status(200).json({
        success: true,
        data: req.user,
      });
    } else {
      res.status(404).json({ success: false, message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Server error retrieving profile",
    });
  }
};

// @desc    Update or upgrade user role (e.g. demo to user)
// @route   PUT /api/auth/role
// @access  Private
export const updateUserRole = async (req: any, res: Response): Promise<void> => {
  try {
    const { role } = req.body;
    if (!["admin", "user", "demo"].includes(role)) {
      res.status(400).json({ success: false, message: "Invalid role. Allowed roles: admin, user, demo" });
      return;
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Role successfully updated to ${role}`,
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
      message: error instanceof Error ? error.message : "Server error updating user role",
    });
  }
};
