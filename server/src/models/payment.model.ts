import { Schema, model, Document, Types } from "mongoose";

export type PaymentStatus = "CREATED" | "PAID" | "FAILED";

export interface IPayment extends Document {
  bookingId: Types.ObjectId;

  amount: number;
  currency: string;

  razorpayPaymentId?: string;
  razorpayPaymentLinkId?: string;

  status: PaymentStatus;

  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    razorpayPaymentId: {
      type: String,
    },

    razorpayPaymentLinkId: {
      type: String,
    },

    status: {
      type: String,
      enum: ["CREATED", "PAID", "FAILED"],
      default: "CREATED",
    },
  },
  {
    timestamps: true,
  },
);

export const PaymentModel = model<IPayment>("Payment", paymentSchema);
