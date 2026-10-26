import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import path from "path";
import { connectDB } from "./config/db";
import { protect, isAdmin } from "./middleware/authMiddleware";
import { initSocket } from "./config/socket";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Import controllers
import { registerUser, loginUser, getMe, updateUserRole, verifyEmail } from "./controllers/authController";
import { getUsers, createUser, deleteUser } from "./controllers/userController";
import { getLeads, createLead, updateLead, deleteLead } from "./controllers/leadController";

// Public Auth Routes
app.post("/api/auth/register", registerUser);
app.post("/api/auth/login", loginUser);
app.post("/api/auth/verify-email", verifyEmail);
app.get("/api/auth/me", protect, getMe);
app.put("/api/auth/role", protect, updateUserRole);

// Admin-only User Routes
app.get("/api/users", protect, isAdmin, getUsers);
app.post("/api/users", protect, isAdmin, createUser);
app.delete("/api/users/:id", protect, isAdmin, deleteUser);

// CRM Lead Routes
app.get("/api/leads", protect, getLeads);
app.post("/api/leads", protect, createLead);
app.put("/api/leads/:id", protect, updateLead);
app.delete("/api/leads/:id", protect, isAdmin, deleteLead);

// Customer Routes
import { createCustomer, getCustomers, setPassword, getCustomerMe, updateCustomerMe } from "./controllers/customerController";
app.post("/api/customers", protect, isAdmin, createCustomer);
app.get("/api/customers", protect, isAdmin, getCustomers);
app.get("/api/customers/me", protect, getCustomerMe);
app.put("/api/customers/me", protect, updateCustomerMe);
app.post("/api/customers/set-password", setPassword);


// Import event controllers
import { createEvent, getEvents, markRead, markAllRead } from "./controllers/eventController";
import { createZone, getZones, getZoneById, updateZone, deleteZone } from "./controllers/zoneController";

// CCTV Alert Routes
app.post("/api/events", createEvent);
app.get("/api/events", protect, getEvents);
app.put("/api/events/read-all", protect, markAllRead);
app.put("/api/events/:id/read", protect, markRead);

// Zone Management Routes
app.post("/api/zones", protect, createZone);
app.get("/api/zones", protect, getZones);
app.get("/api/zones/:id", protect, getZoneById);
app.patch("/api/zones/:id", protect, updateZone);
app.delete("/api/zones/:id", protect, deleteZone);

// Import plan controllers
import { getAllPlans, getPlanById, createPlan, updatePlan, toggleStatus, deletePlan, getPlanStats } from "./controllers/planController";

// Subscription Plan Routes
app.get("/api/plans", getAllPlans);
app.get("/api/plans/stats", protect, isAdmin, getPlanStats);
app.get("/api/plans/:id", protect, getPlanById);
app.post("/api/plans", protect, isAdmin, createPlan);
app.patch("/api/plans/:id", protect, isAdmin, updatePlan);
app.patch("/api/plans/:id/toggle-status", protect, isAdmin, toggleStatus);
app.delete("/api/plans/:id", protect, isAdmin, deletePlan);

// Import invoice controllers
import { getInvoices, createInvoice } from "./controllers/invoiceController";

// Invoice Routes
app.get("/api/invoices", protect, getInvoices);
app.post("/api/invoices", protect, isAdmin, createInvoice);

// Razorpay Payment Routes
import { getPaymentConfig, createOrder, verifyPayment } from "./controllers/paymentController";
app.get("/api/payment/config", protect, getPaymentConfig);
app.post("/api/payment/create-order", protect, createOrder);
app.post("/api/payment/verify-payment", protect, verifyPayment);

// Serve Static Uploads (for CCTV snapshots)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Basic health check route
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "CoreWatch CRM Backend API is running..." });
});

// Seed Initial CRM Data (Helper API)
// If database is completely empty, it sets up one admin, one user, and some dummy leads
app.post("/api/seed", async (req: Request, res: Response) => {
  try {
    const User = require("./models/User").default;
    const Lead = require("./models/Lead").default;

    const userCount = await User.countDocuments();
    if (userCount > 0) {
      res.status(400).json({ success: false, message: "Database already has users. Seeding skipped." });
      return;
    }

    // Create Admin
    const adminEmail = process.env.ADMIN_EMAIL || "admin@corewatch.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "password123";
    const adminFirstName = process.env.ADMIN_FIRST_NAME || "System";
    const adminLastName = process.env.ADMIN_LAST_NAME || "Admin";

    const admin = await User.create({
      name: `${adminFirstName} ${adminLastName}`.trim(),
      email: adminEmail,
      password: adminPassword, // Will be hashed via pre-save hook
      role: "admin",
      isVerified: true,
    });

    // Create User
    const user = await User.create({
      name: "John Agent",
      email: "agent@corewatch.com",
      password: "password123", // Will be hashed via pre-save hook
      role: "user",
      isVerified: true,
    });

    // Create Leads
    const leads = [
      {
        name: "Alice Smith",
        company: "Smith retail shop",
        email: "alice@smithretail.com",
        phone: "+15550199",
        status: "new",
        assignedTo: admin._id,
        notes: "Interested in AI camera alerts for security.",
      },
      {
        name: "Bob Jones",
        company: "Jones Warehouse LLC",
        email: "bob@joneswh.com",
        phone: "+15550288",
        status: "contacted",
        assignedTo: user._id,
        notes: "Wants pricing structure for 10 cameras.",
      },
      {
        name: "Charlie Brown",
        company: "Downtown Office Plaza",
        email: "charlie@brownproperties.com",
        phone: "+15550377",
        status: "proposal",
        assignedTo: user._id,
        notes: "Sent proposal. Awaiting confirmation.",
      },
      {
        name: "David Lee",
        company: "Lee Electronics Store",
        email: "david@leeelectronics.com",
        phone: "+15550466",
        status: "won",
        assignedTo: admin._id,
        notes: "Deal closed. Installation scheduled for next Monday.",
      },
    ];

    await Lead.insertMany(leads);

    // Seed plans if empty
    const Plan = require("./models/Plan").default;
    const planCount = await Plan.countDocuments();
    if (planCount === 0) {
      await Plan.insertMany([
        {
          name: "Demo Free",
          description: "Explore CoreWatch basic features. Perfect for small evaluations.",
          monthlyPrice: 0,
          yearlyPrice: 0,
          maxCameras: 1,
          trialDays: 14,
          status: "active",
          sortOrder: 0,
          isPopular: false,
          features: ["intrusion_detection", "camera_offline"],
        },
        {
          name: "Standard AI",
          description: "Essential real-time alerts for growing commercial spaces.",
          monthlyPrice: 499,
          yearlyPrice: 4990,
          maxCameras: 10,
          trialDays: 0,
          status: "active",
          sortOrder: 1,
          isPopular: false,
          features: ["intrusion_detection", "camera_offline", "whatsapp_alerts"],
        },
        {
          name: "Enterprise Pro",
          description: "Advanced multi-site safety and real-time security package.",
          monthlyPrice: 1299,
          yearlyPrice: 12990,
          maxCameras: 30,
          trialDays: 0,
          status: "active",
          sortOrder: 2,
          isPopular: true,
          features: ["intrusion_detection", "camera_offline", "whatsapp_alerts", "fire_smoke"],
        },
        {
          name: "Enterprise Max",
          description: "Tailored camera analytics and dedicated server capacities.",
          monthlyPrice: 2499,
          yearlyPrice: 24990,
          maxCameras: 100,
          trialDays: 0,
          status: "active",
          sortOrder: 3,
          isPopular: false,
          features: ["intrusion_detection", "camera_offline", "whatsapp_alerts", "fire_smoke", "cash_counter"],
        }
      ]);
    }

    res.status(201).json({
      success: true,
      message: "Seeding complete!",
      accounts: {
        admin: { email: adminEmail, password: adminPassword },
        user: { email: "agent@corewatch.com", password: "password123" },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Seeding failed",
    });
  }
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`); // reload
});
