import { PackageModel } from "../models/package.model";

export async function getActivePackages() {
  return PackageModel.find({
    isActive: true,
  }).sort({ createdAt: -1 });
}

export async function getAllPackages() {
  return PackageModel.find().sort({ createdAt: -1 });
}

export async function createPackage(data: any) {
  return PackageModel.create(data);
}

export async function updatePackage(id: string, data: any) {
  return PackageModel.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
}

export async function deletePackage(id: string) {
  return PackageModel.findByIdAndDelete(id);
}
