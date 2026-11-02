import mongoose from "mongoose";
import Zone, { IZone } from "../models/Zone";
import Camera from "../models/Camera";
import Shop from "../models/Shop";
import Customer from "../models/Customer";
import { validatePolygon } from "../utils/geometry";

/**
 * Custom error extending standard Error to support status codes.
 */
export class ServiceError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, ServiceError.prototype);
  }
}

/**
 * Validates camera access and ownership for a given user.
 */
export const verifyCameraAccess = async (user: any, cameraId: string) => {
  if (!cameraId) {
    throw new ServiceError("Camera ID is required", 400);
  }

  // Find camera by cameraKey or ObjectId
  const camera = await Camera.findOne({
    $or: [
      { cameraKey: cameraId },
      { _id: mongoose.isValidObjectId(cameraId) ? cameraId : null }
    ].filter(x => x._id !== null)
  });

  if (!camera) {
    throw new ServiceError("Camera not found", 404);
  }

  let isAuthorized = false;

  if (user.role === "admin") {
    isAuthorized = true;
  } else {
    const userStr = user._id ? user._id.toString() : "";
    const userLinkedStr = user.user ? user.user.toString() : "";
    const camUserStr = camera.userId ? camera.userId.toString() : "";

    // 1. Direct ownership check (camera.userId matches req.user._id or linked user)
    if (camUserStr && (camUserStr === userStr || (userLinkedStr && camUserStr === userLinkedStr))) {
      isAuthorized = true;
    }

    // 2. Customer cross-reference check
    if (!isAuthorized && camUserStr) {
      const customer = await Customer.findOne({ $or: [{ user: user._id }, { _id: user._id }] });
      if (customer && (camUserStr === customer._id.toString() || (customer.user && camUserStr === customer.user.toString()))) {
        isAuthorized = true;
      }
    }

    // 3. Indirect ownership check (camera.shopId -> Shop.ownerId matches req.user._id)
    if (!isAuthorized && camera.shopId) {
      const shop = await Shop.findById(camera.shopId);
      if (shop && shop.ownerId && (shop.ownerId.toString() === userStr || (userLinkedStr && shop.ownerId.toString() === userLinkedStr))) {
        isAuthorized = true;
      }
    }
  }

  if (!isAuthorized) {
    throw new ServiceError("Unauthorized access to this camera", 403);
  }

  // Derive tenant/ownership information: companyId and shopId
  const ownerUserId = camera.userId || (await Shop.findById(camera.shopId).then(s => s?.ownerId));

  let companyId: string | undefined;
  if (ownerUserId) {
    const customer = await Customer.findOne({ user: ownerUserId });
    if (customer && customer.company) {
      companyId = customer.company;
    }
  }

  return {
    camera,
    companyId,
    shopId: camera.shopId,
  };
};

/**
 * Creates a new zone.
 */
export const createZone = async (user: any, zoneData: any): Promise<IZone> => {
  const { cameraId, name, type, points, enabled, rules } = zoneData;

  // 1. Verify Camera Access and retrieve derived ownership fields
  const { camera, companyId, shopId } = await verifyCameraAccess(user, cameraId);

  // 2. Name validation
  if (!name || typeof name !== "string") {
    throw new ServiceError("Zone name is required", 400);
  }
  const trimmedName = name.trim();
  if (trimmedName.length === 0) {
    throw new ServiceError("Zone name cannot be empty or whitespace only", 400);
  }
  const nameNormalized = trimmedName.toLowerCase();

  // Check duplicate zone names on the same camera
  const duplicate = await Zone.findOne({
    cameraId: camera.cameraKey,
    nameNormalized,
  });
  if (duplicate) {
    throw new ServiceError(`A zone with the name '${trimmedName}' already exists on this camera`, 409);
  }

  // 3. Type validation
  const allowedTypes = ["RESTRICTED", "VALUABLE", "CASH_COUNTER", "STORAGE", "DOOR", "CUSTOM"];
  if (!type || !allowedTypes.includes(type)) {
    throw new ServiceError(`Invalid zone type. Allowed: ${allowedTypes.join(", ")}`, 400);
  }

  // 4. Polygon Coordinates validation
  const geometryCheck = validatePolygon(points);
  if (!geometryCheck.isValid) {
    throw new ServiceError(geometryCheck.reason || "Invalid polygon points", 400);
  }

  // 5. Rules validation
  const finalRules = {
    alertAfterSeconds: 5,
    enabled: true,
    afterHoursOnly: false,
  };

  if (rules && typeof rules === "object") {
    if (rules.alertAfterSeconds !== undefined) {
      const seconds = Number(rules.alertAfterSeconds);
      if (!Number.isInteger(seconds) || seconds < 1 || seconds > 300) {
        throw new ServiceError("alertAfterSeconds must be an integer between 1 and 300", 400);
      }
      finalRules.alertAfterSeconds = seconds;
    }
    if (rules.enabled !== undefined) {
      finalRules.enabled = Boolean(rules.enabled);
    }
    if (rules.afterHoursOnly !== undefined) {
      finalRules.afterHoursOnly = Boolean(rules.afterHoursOnly);
    }
  }

  // 6. Save Zone
  const newZone = await Zone.create({
    companyId,
    shopId,
    cameraId: camera.cameraKey,
    name: trimmedName,
    nameNormalized,
    type,
    points,
    enabled: enabled !== undefined ? Boolean(enabled) : true,
    rules: finalRules,
    createdBy: user._id,
    updatedBy: user._id,
  });

  return newZone;
};

/**
 * Retrieves zones based on query filters, ensuring tenant isolation.
 */
export const getZones = async (user: any, filters: any): Promise<IZone[]> => {
  const query: any = {};

  if (user.role !== "admin") {
    // Non-admins can only query zones of their authorized cameras
    const shops = await Shop.find({ ownerId: user._id });
    const shopIds = shops.map(s => s._id);

    const candidateUserIds: any[] = [];
    if (user._id) {
      candidateUserIds.push(user._id);
      candidateUserIds.push(user._id.toString());
      if (mongoose.isValidObjectId(user._id)) {
        candidateUserIds.push(new mongoose.Types.ObjectId(user._id.toString()));
      }
    }
    if (user.user) {
      candidateUserIds.push(user.user);
      candidateUserIds.push(user.user.toString());
      if (mongoose.isValidObjectId(user.user)) {
        candidateUserIds.push(new mongoose.Types.ObjectId(user.user.toString()));
      }
    }

    const customer = await Customer.findOne({ $or: [{ user: user._id }, { _id: user._id }] });
    if (customer) {
      candidateUserIds.push(customer._id);
      candidateUserIds.push(customer._id.toString());
      if (customer.user) {
        candidateUserIds.push(customer.user);
        candidateUserIds.push(customer.user.toString());
      }
    }

    const cameras = await Camera.find({
      $or: [
        { userId: { $in: candidateUserIds } },
        { shopId: { $in: shopIds } }
      ]
    });

    const authorizedCameraKeys = cameras.map(c => c.cameraKey);

    if (filters.cameraId) {
      if (!authorizedCameraKeys.includes(filters.cameraId)) {
        const targetCam = await Camera.findOne({
          cameraKey: filters.cameraId,
          $or: [
            { userId: { $in: candidateUserIds } },
            { shopId: { $in: shopIds } }
          ]
        });
        if (targetCam) {
          authorizedCameraKeys.push(targetCam.cameraKey);
        }
      }

      if (!authorizedCameraKeys.includes(filters.cameraId)) {
        throw new ServiceError("Unauthorized access to this camera's zones", 403);
      }
      query.cameraId = filters.cameraId;
    } else {
      query.cameraId = { $in: authorizedCameraKeys };
    }
  } else {
    // Admin query
    if (filters.cameraId) {
      query.cameraId = filters.cameraId;
    }
  }

  if (filters.type) {
    query.type = filters.type;
  }

  if (filters.enabled !== undefined) {
    query.enabled = filters.enabled === "true" || filters.enabled === true;
  }

  return await Zone.find(query);
};

/**
 * Retrieves a single zone by ID, checking access.
 */
export const getZoneById = async (user: any, zoneId: string): Promise<IZone> => {
  if (!mongoose.isValidObjectId(zoneId)) {
    throw new ServiceError("Invalid Zone ID format", 400);
  }

  const zone = await Zone.findById(zoneId);
  if (!zone) {
    throw new ServiceError("Zone not found", 404);
  }

  // Verify access to the zone's camera
  await verifyCameraAccess(user, zone.cameraId);

  return zone;
};

/**
 * Updates a zone using an explicit allowlist.
 */
export const updateZone = async (user: any, zoneId: string, updateData: any): Promise<IZone> => {
  if (!mongoose.isValidObjectId(zoneId)) {
    throw new ServiceError("Invalid Zone ID format", 400);
  }

  const zone = await Zone.findById(zoneId);
  if (!zone) {
    throw new ServiceError("Zone not found", 404);
  }

  // 1. Verify access to the zone's camera
  const { camera } = await verifyCameraAccess(user, zone.cameraId);

  // 2. Reject camera reassignment and metadata modifications (immutable fields)
  const blocklist = ["companyId", "shopId", "cameraId", "createdBy", "updatedBy", "_id", "createdAt", "updatedAt"];
  for (const field of blocklist) {
    if (updateData[field] !== undefined && updateData[field].toString() !== (zone as any)[field]?.toString()) {
      throw new ServiceError(`Field '${field}' is immutable and cannot be updated`, 400);
    }
  }

  // 3. Apply updates based on explicit allowlist
  if (updateData.name !== undefined) {
    if (typeof updateData.name !== "string") {
      throw new ServiceError("Zone name must be a string", 400);
    }
    const trimmedName = updateData.name.trim();
    if (trimmedName.length === 0) {
      throw new ServiceError("Zone name cannot be empty or whitespace only", 400);
    }
    const nameNormalized = trimmedName.toLowerCase();

    // Check duplicate name excluding this zone itself
    const duplicate = await Zone.findOne({
      cameraId: camera.cameraKey,
      nameNormalized,
      _id: { $ne: zoneId },
    });
    if (duplicate) {
      throw new ServiceError(`A zone with the name '${trimmedName}' already exists on this camera`, 409);
    }

    zone.name = trimmedName;
    zone.nameNormalized = nameNormalized;
  }

  if (updateData.type !== undefined) {
    const allowedTypes = ["RESTRICTED", "VALUABLE", "CASH_COUNTER", "STORAGE", "DOOR", "CUSTOM"];
    if (!allowedTypes.includes(updateData.type)) {
      throw new ServiceError(`Invalid zone type. Allowed: ${allowedTypes.join(", ")}`, 400);
    }
    zone.type = updateData.type;
  }

  if (updateData.points !== undefined) {
    const geometryCheck = validatePolygon(updateData.points);
    if (!geometryCheck.isValid) {
      throw new ServiceError(geometryCheck.reason || "Invalid polygon points", 400);
    }
    zone.points = updateData.points;
  }

  if (updateData.enabled !== undefined) {
    zone.enabled = Boolean(updateData.enabled);
  }

  if (updateData.rules !== undefined && typeof updateData.rules === "object" && updateData.rules !== null) {
    const newRules = { ...zone.rules };
    if (updateData.rules.alertAfterSeconds !== undefined) {
      const seconds = Number(updateData.rules.alertAfterSeconds);
      if (!Number.isInteger(seconds) || seconds < 1 || seconds > 300) {
        throw new ServiceError("alertAfterSeconds must be an integer between 1 and 300", 400);
      }
      newRules.alertAfterSeconds = seconds;
    }
    if (updateData.rules.enabled !== undefined) {
      newRules.enabled = Boolean(updateData.rules.enabled);
    }
    if (updateData.rules.afterHoursOnly !== undefined) {
      newRules.afterHoursOnly = Boolean(updateData.rules.afterHoursOnly);
    }
    zone.rules = newRules;
  }

  zone.updatedBy = user._id;
  await zone.save();

  return zone;
};

/**
 * Hard deletes a zone.
 */
export const deleteZone = async (user: any, zoneId: string): Promise<void> => {
  if (!mongoose.isValidObjectId(zoneId)) {
    throw new ServiceError("Invalid Zone ID format", 400);
  }

  const zone = await Zone.findById(zoneId);
  if (!zone) {
    throw new ServiceError("Zone not found", 404);
  }

  // Verify access to the zone's camera
  await verifyCameraAccess(user, zone.cameraId);

  await Zone.findByIdAndDelete(zoneId);
};
