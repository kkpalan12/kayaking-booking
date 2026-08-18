import { Schema, model, Document, Types } from "mongoose";

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface IBooking extends Document {
  bookingId: string;

  packageId: Types.ObjectId;

  packageName: string;
  pricingType: string;
  unitPrice: number;

  customerName: string;
  customerPhone: string;

  bookingDate: Date;
  timeSlot: string;

  quantity: number;

  subtotal: number;
  discountAmount: number;
  totalAmount: number;

  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;

  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    packageId: {
      type: Schema.Types.ObjectId,
      ref: "Package",
      required: true,
    },

    packageName: {
      type: String,
      required: true,
    },

    pricingType: {
      type: String,
      required: true,
    },

    unitPrice: {
      type: Number,
      required: true,
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },

    bookingDate: {
      type: Date,
      required: true,
    },

    timeSlot: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    bookingStatus: {
      type: String,
      enum: ["PENDING", "CONFIRMED", "CANCELLED"],
      default: "PENDING",
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
  },
  {
    timestamps: true,
  },
);

export const BookingModel = model<IBooking>("Booking", bookingSchema);
