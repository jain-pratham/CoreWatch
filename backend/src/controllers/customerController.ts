import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../models/User";
import Customer from "../models/Customer";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

// Helper to send professional update password/welcome email
const sendWelcomeEmail = async (email: string, name: string, token: string): Promise<boolean> => {
  try {
    const host = process.env.SMTP_HOST || process.env.EMAIL_HOST || "smtp.ethereal.email";
    const port = Number(process.env.SMTP_PORT || process.env.EMAIL_PORT) || 587;
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
    const fromEmail = process.env.EMAIL_FROM || user || "support@corewatch.ai";

    if (!user || !pass) {
      console.warn("SMTP credentials not configured. Email will not be sent.");
      return false;
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const setupLink = `${frontendUrl}/set-password?token=${token}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Set Your CoreWatch Account Password</title>
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
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
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
            transition: all 0.2s ease;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .btn:hover {
            box-shadow: 0 6px 18px rgba(2, 132, 199, 0.35);
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
            <h1>Welcome to CoreWatch, ${name}!</h1>
            <p>Your enterprise customer account has been successfully provisioned by your system administrator.</p>
            <p>To finalize your login credentials and gain access to your real-time CCTV safety inspection feed, dashboard settings, and alert logs, please set your password by clicking the button below:</p>
            
            <div class="btn-container">
              <a href="${setupLink}" class="btn" target="_blank">Setup Your Password</a>
            </div>

            <p>This password configuration link will remain active for the next 7 days. If you did not request this account, please ignore this message.</p>
            
            <div class="divider"></div>
            
            <p style="font-size: 13px; margin-bottom: 8px;">If the button above does not work, copy and paste this URL into your browser:</p>
            <a href="${setupLink}" class="alternative-link" target="_blank">${setupLink}</a>
          </div>
          <div class="footer">
            &copy; 2026 CoreWatch AI System. All rights reserved.<br>
            Real-time safety and security compliance via computer vision.
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"CoreWatch System Admin" <${fromEmail}>`,
      to: email,
      subject: "Action Required: Setup Password for CoreWatch Account",
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Professional welcome/password email sent to ${email}. Message ID: ${info.messageId}`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`📬 Ethereal Email Preview URL: ${previewUrl}`);
    }
    return true;
  } catch (error) {
    console.error("Failed to send SMTP email:", error);
    return false;
  }
};

// @desc    Create a new customer (Admin only)
// @route   POST /api/customers
// @access  Private/Admin
export const createCustomer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      cameras,
      plan,
      addressLine1,
      addressLine2,
      country,
      state,
      city,
      pincode,
    } = req.body;

    if (!firstName || !lastName || !email) {
      res.status(400).json({ success: false, message: "Please provide first name, last name, and email" });
      return;
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ success: false, message: "A user account with this email already exists" });
      return;
    }

    // Create the User first with a random temp password and "user" role
    const tempPassword = Math.random().toString(36).slice(-10) + "Jp!!"; // Secure random temp password
    const user = await User.create({
      name: `${firstName} ${lastName}`.trim(),
      email,
      password: tempPassword,
      role: "user",
    });

    // Create the Customer profile associated with the user
    const customer = await Customer.create({
      user: user._id,
      company: company || "",
      phone: phone || "",
      cameras: cameras ? Number(cameras) : 5,
      plan: plan || "Enterprise Pro",
      addressLine1: addressLine1 || "",
      addressLine2: addressLine2 || "",
      country: country || "",
      state: state || "",
      city: city || "",
      pincode: pincode || "",
      status: "Pending",
    });

    // Generate JWT token for password set (7 days duration)
    const jwtSecret = process.env.JWT_SECRET || "super_secret_corewatch_key_2026";
    const token = jwt.sign({ userId: user._id }, jwtSecret, { expiresIn: "7d" });

    // Send welcome SMTP email
    const emailSent = await sendWelcomeEmail(email, `${firstName} ${lastName}`, token);

    res.status(201).json({
      success: true,
      message: "Customer created successfully!",
      emailSent,
      data: {
        id: customer._id,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
        },
        company: customer.company,
        phone: customer.phone,
        cameras: customer.cameras,
        plan: customer.plan,
        status: customer.status,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Server error creating customer",
    });
  }
};

// @desc    Get all customers (Admin only)
// @route   GET /api/customers
// @access  Private/Admin
export const getCustomers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const customers = await Customer.find({}).populate("user", "name email role");

    // Transform database records into user-friendly structure
    const formattedCustomers = customers.map((c: any) => {
      // Handle cases where the user object might be null/missing
      const userObj = c.user || { name: "N/A", email: "N/A" };
      return {
        id: c._id,
        name: userObj.name,
        email: userObj.email,
        company: c.company,
        cameras: c.cameras,
        plan: c.plan,
        status: c.status,
        phone: c.phone,
        addressLine1: c.addressLine1,
        addressLine2: c.addressLine2,
        country: c.country,
        state: c.state,
        city: c.city,
        pincode: c.pincode,
      };
    });

    res.status(200).json({ success: true, data: formattedCustomers });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Server error fetching customers",
    });
  }
};

// @desc    Set password via email link token (Public)
// @route   POST /api/customers/set-password
// @access  Public
export const setPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({ success: false, message: "Token and password are required" });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: "Password must be at least 6 characters long" });
      return;
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET || "super_secret_corewatch_key_2026";
    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (err) {
      res.status(400).json({ success: false, message: "Password setup link is invalid or expired" });
      return;
    }

    const userId = decoded.userId;
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: "User account not found" });
      return;
    }

    // Update password
    user.password = password; // The pre-save hook will encrypt it
    user.isVerified = true;
    await user.save();

    // Set customer status to Pending (they must complete the signup steps first)
    await Customer.findOneAndUpdate({ user: userId }, { status: "Pending" });

    // Generate JWT token so they are immediately logged in
    const userToken = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: "30d" });

    res.status(200).json({
      success: true,
      message: "Password configured successfully! Welcome aboard.",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: userToken,
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Server error configuring password",
    });
  }
};

// @desc    Get current user's customer profile
// @route   GET /api/customers/me
// @access  Private
export const getCustomerMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user._id;
    const customer = await Customer.findOne({ user: userId }).populate("user", "name email role");

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Server error fetching customer profile",
    });
  }
};

// @desc    Create or update current user's customer profile from wizard steps
// @route   PUT /api/customers/me
// @access  Private
export const updateCustomerMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user._id;
    const {
      name,
      phone,
      company,
      addressLine1,
      addressLine2,
      country,
      state,
      city,
      pincode,
      plan,
      cameras,
      status,
    } = req.body;

    // Update user's name if sent
    if (name) {
      await User.findByIdAndUpdate(userId, { name });
    }

    // Find or create Customer profile
    let customer = await Customer.findOne({ user: userId });
    
    const updateData: any = {};
    if (phone !== undefined) updateData.phone = phone;
    if (company !== undefined) updateData.company = company;
    if (addressLine1 !== undefined) updateData.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) updateData.addressLine2 = addressLine2;
    if (country !== undefined) updateData.country = country;
    if (state !== undefined) updateData.state = state;
    if (city !== undefined) updateData.city = city;
    if (pincode !== undefined) updateData.pincode = pincode;
    if (plan !== undefined) updateData.plan = plan;
    if (cameras !== undefined) updateData.cameras = Number(cameras);
    if (status !== undefined) updateData.status = status;

    if (!customer) {
      customer = await Customer.create({
        user: userId,
        status: "Pending",
        ...updateData,
      });
    } else {
      customer = await Customer.findByIdAndUpdate(
        customer._id,
        updateData,
        { new: true }
      );
    }

    res.status(200).json({
      success: true,
      message: "Customer profile updated successfully",
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Server error updating customer profile",
    });
  }
};
