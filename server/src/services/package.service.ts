import { PackageModel } from "../models/package.model";

function normalizePackageData(data: any): any {
  const normalized = {
    ...data,
  };

  if (typeof normalized.name === "string") {
    normalized.name = normalized.name.trim();
  }

  if (typeof normalized.slug === "string") {
    normalized.slug = normalized.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  if (normalized.description !== undefined && normalized.description !== null) {
    normalized.description = String(normalized.description).trim();
  }

  if (normalized.duration !== undefined && normalized.duration !== null) {
    normalized.duration = String(normalized.duration).trim();
  }

  if (normalized.image !== undefined && normalized.image !== null) {
    normalized.image = String(normalized.image).trim();
  }

  normalized.price = Number(normalized.price);

  normalized.discount = {
    enabled: normalized.discount?.enabled === true,

    type: normalized.discount?.type === "FIXED" ? "FIXED" : "PERCENTAGE",

    value: Math.max(0, Number(normalized.discount?.value || 0)),
  };

  normalized.isActive = normalized.isActive !== false;

  return normalized;
}

export async function getActivePackages() {
  return PackageModel.find({
    isActive: true,
  }).sort({
    createdAt: -1,
  });
}

export async function getAllPackages() {
  return PackageModel.find().sort({
    createdAt: -1,
  });
}

export async function createPackage(data: any) {
  const normalized = normalizePackageData(data);

  if (!normalized.name) {
    throw new Error("Package name is required");
  }

  if (!normalized.slug) {
    throw new Error("Package slug is required");
  }

  if (!Number.isFinite(normalized.price) || normalized.price < 0) {
    throw new Error("Package price must be a valid positive number");
  }

  return PackageModel.create(normalized);
}

export async function updatePackage(id: string, data: any) {
  const normalized = normalizePackageData(data);

  const updated = await PackageModel.findByIdAndUpdate(id, normalized, {
    new: true,
    runValidators: true,
  });

  if (!updated) {
    throw new Error("Package not found");
  }

  return updated;
}

/**
 * Safe package deletion.
 *
 * We NEVER remove the MongoDB document.
 * We simply deactivate it so existing
 * bookings and references remain intact.
 */
export async function deletePackage(id: string) {
  const packageData = await PackageModel.findById(id);

  if (!packageData) {
    throw new Error("Package not found");
  }

  packageData.isActive = false;

  await packageData.save();

  return packageData;
}

/**
 * Reactivate a package.
 */
export async function activatePackage(id: string) {
  const packageData = await PackageModel.findById(id);

  if (!packageData) {
    throw new Error("Package not found");
  }

  packageData.isActive = true;

  await packageData.save();

  return packageData;
}
