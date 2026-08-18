import { Schema, model, Document } from "mongoose";

export type PricingType = "PER_PERSON" | "PER_BOOKING";
export type DiscountType = "PERCENTAGE" | "FIXED";

export interface IPackage extends Document {
  name: string;
  slug: string;
  description?: string;
  price: number;
  pricingType: PricingType;

  discount: {
    enabled: boolean;
    type: DiscountType;
    value: number;
  };

  duration?: string;
  image?: string;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const packageSchema = new Schema<IPackage>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    description: {
      type: String,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    pricingType: {
      type: String,
      enum: ["PER_PERSON", "PER_BOOKING"],
      required: true,
    },

    discount: {
      enabled: {
        type: Boolean,
        default: false,
      },

      type: {
        type: String,
        enum: ["PERCENTAGE", "FIXED"],
        default: "PERCENTAGE",
      },

      value: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    duration: {
      type: String,
      trim: true,
    },

    image: {
      type: String,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export const PackageModel = model<IPackage>("Package", packageSchema);
