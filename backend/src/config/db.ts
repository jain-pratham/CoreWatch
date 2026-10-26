import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import User from "../models/User";
import Plan from "../models/Plan";
import Customer from "../models/Customer";

let mongod: MongoMemoryServer | null = null;

const seedDefaultUsers = async (): Promise<void> => {
  try {
    // 1. Admin Account
    const adminEmail = process.env.ADMIN_EMAIL || "admin@corewatch.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "password123";
    const adminExists = await User.findOne({ email: adminEmail });

    if (!adminExists) {
      await User.create({
        name: "Super Admin",
        email: adminEmail,
        password: adminPassword,
        role: "admin",
        isVerified: true,
      });
      console.log(`Default Admin created: ${adminEmail}`);
    }

    // 2. Standard User Account
    const userEmail = "user@corewatch.com";
    const userExists = await User.findOne({ email: userEmail });
    if (!userExists) {
      await User.create({
        name: "Standard Enterprise User",
        email: userEmail,
        password: "Jpdtp5!!",
        role: "user",
        isVerified: true,
      });
      console.log(`Default User created: ${userEmail}`);
    }

    // 3. Demo Account
    const demoEmail = "demo@corewatch.com";
    const demoExists = await User.findOne({ email: demoEmail });
    if (!demoExists) {
      await User.create({
        name: "Demo Account",
        email: demoEmail,
        password: "Jpdtp5!!",
        role: "demo",
        isVerified: true,
      });
      console.log(`Default Demo created: ${demoEmail}`);
    }

    // 4. Test User Account (Full Features & Unlimited Cameras)
    const testEmail = process.env.test_user || process.env.TEST_USER || "test@gmail.com";
    const testPassword = process.env.test_password || process.env.TEST_PASSWORD || "test@123";
    let testUser = await User.findOne({ email: testEmail });
    if (!testUser) {
      testUser = await User.create({
        name: "Test User",
        email: testEmail,
        password: testPassword,
        role: "user",
        isVerified: true,
      });
      console.log(`Default Test User created: ${testEmail}`);
    } else {
      testUser.isVerified = true;
      await testUser.save();
    }

    let testCustomer = await Customer.findOne({ user: testUser._id });
    if (!testCustomer) {
      await Customer.create({
        user: testUser._id,
        company: "CoreWatch Test Enterprise",
        phone: "+91 9999999999",
        cameras: 999,
        plan: "Enterprise Max",
        status: "Active",
      });
      console.log(`Active Customer profile created for: ${testEmail}`);
    } else {
      testCustomer.status = "Active";
      testCustomer.plan = "Enterprise Max";
      testCustomer.cameras = 999;
      await testCustomer.save();
    }
  } catch (error) {
    console.error("Error seeding default users:", error);
  }
};

const seedDefaultPlans = async (): Promise<void> => {
  try {
    // Clean up any soft-deleted plans from before by deleting them permanently from MongoDB
    await Plan.deleteMany({ isDeleted: true });

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
      console.log("Default Subscription Plans seeded successfully!");
    }
  } catch (error) {
    console.error("Error seeding default subscription plans:", error);
  }
};

export const connectDB = async (): Promise<void> => {
  try {
    const connStr = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/corewatch";
    console.log(`Attempting connection to MongoDB: ${connStr}`);
    
    // Try connecting with a short timeout to fail fast and fallback
    await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 2000,
      tlsAllowInvalidCertificates: true, // bypass certificate validation for VPN/proxy compatibility
    });
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
    await seedDefaultUsers();
    await seedDefaultPlans();
  } catch (error) {
    console.warn(`MongoDB Connection failed: ${error instanceof Error ? error.message : error}`);
    console.log("Spinning up In-Memory MongoDB Server fallback on port 27017...");
    try {
      mongod = await MongoMemoryServer.create({
        instance: {
          port: 27017,
          dbName: "corewatch"
        },
        binary: {
          version: "5.0.28"
        }
      });
      const uri = mongod.getUri();
      console.log(`In-Memory MongoDB Server running at: ${uri}`);
      await mongoose.connect(uri);
      console.log("MongoDB Connected: (In-Memory Database on port 27017)");
      await seedDefaultUsers();
      await seedDefaultPlans();
    } catch (err) {
      console.warn(`Failed to start In-Memory MongoDB on port 27017: ${err instanceof Error ? err.message : err}`);
      console.log("Retrying In-Memory MongoDB Server on a random port...");
      try {
        mongod = await MongoMemoryServer.create({
          binary: {
            version: "5.0.28"
          }
        });
        const uri = mongod.getUri();
        console.log(`In-Memory MongoDB Server running at: ${uri}`);
        await mongoose.connect(uri);
        console.log("MongoDB Connected: (In-Memory Database on random port)");
        await seedDefaultUsers();
        await seedDefaultPlans();
      } catch (randomErr) {
        console.error(`In-Memory MongoDB failed to start: ${randomErr instanceof Error ? randomErr.message : randomErr}`);
        process.exit(1);
      }
    }
  }
};

