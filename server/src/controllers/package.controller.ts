import { Request, Response, NextFunction } from "express";

import * as packageService from "../services/package.service";

export async function getPackages(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const packages = await packageService.getActivePackages();

    res.json({
      success: true,
      data: packages,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminPackages(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const packages = await packageService.getAllPackages();

    res.json({
      success: true,
      data: packages,
    });
  } catch (error) {
    next(error);
  }
}

export async function createPackage(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const packageData = await packageService.createPackage(req.body);

    res.status(201).json({
      success: true,
      data: packageData,
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePackage(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const updated = await packageService.updatePackage(
      String(req.params.id),
      req.body,
    );

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function deletePackage(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const updated = await packageService.deletePackage(String(req.params.id));

    res.json({
      success: true,
      data: updated,
      message: "Package deactivated successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function activatePackage(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const updated = await packageService.activatePackage(String(req.params.id));

    res.json({
      success: true,
      data: updated,
      message: "Package activated successfully",
    });
  } catch (error) {
    next(error);
  }
}
