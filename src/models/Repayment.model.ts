import { Schema, model, Document, Types } from 'mongoose';
import { APP_USERS, AppUser } from '../constants';

export interface IRepayment extends Document {
  moneyTransactionId: Types.ObjectId;

  amount: number; // paise

  paymentDate: Date;

  notes: string;

  createdBy: AppUser;

  createdAt: Date;
  updatedAt: Date;
}

const repaymentSchema = new Schema<IRepayment>(
  {
    moneyTransactionId: {
      type: Schema.Types.ObjectId,
      ref: 'MoneyTransaction',
      required: true,
    },

    amount: { type: Number, required: true, min: 1 },

    paymentDate: { type: Date, required: true },

    notes: { type: String, default: '', trim: true },

    createdBy: { type: String, enum: APP_USERS, required: true },
  },
  { timestamps: true }
);

repaymentSchema.index({ moneyTransactionId: 1 });
repaymentSchema.index({ paymentDate: -1 });

export const Repayment = model<IRepayment>('Repayment', repaymentSchema);
