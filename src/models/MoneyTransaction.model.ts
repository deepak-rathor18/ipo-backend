import { Schema, model, Document } from 'mongoose';
import { APP_USERS, AppUser, MONEY_TYPE, MoneyType } from '../constants';

/**
 * amount is stored as integer PAISE.
 */
export interface IMoneyTransaction extends Document {
  personName: string;
  personPhone: string;

  type: MoneyType;

  amount: number; // paise, original transaction amount (never overwritten)

  transactionDate: Date;
  dueDate: Date | null;

  reason: string;
  notes: string;

  createdBy: AppUser;

  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy: AppUser | null;

  createdAt: Date;
  updatedAt: Date;
}

const moneyTransactionSchema = new Schema<IMoneyTransaction>(
  {
    personName: { type: String, required: true, trim: true },
    personPhone: { type: String, default: '', trim: true },

    type: { type: String, enum: MONEY_TYPE, required: true },

    amount: { type: Number, required: true, min: 1 },

    transactionDate: { type: Date, required: true },
    dueDate: { type: Date, default: null },

    reason: { type: String, default: '', trim: true },
    notes: { type: String, default: '', trim: true },

    createdBy: { type: String, enum: APP_USERS, required: true },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: String, enum: APP_USERS, default: null },
  },
  { timestamps: true }
);

moneyTransactionSchema.index({ personName: 1 });
moneyTransactionSchema.index({ type: 1 });
moneyTransactionSchema.index({ transactionDate: -1 });
moneyTransactionSchema.index({ dueDate: 1 });
moneyTransactionSchema.index({ createdAt: -1 });
moneyTransactionSchema.index({ isDeleted: 1 });

function excludeDeleted(this: any, next: () => void) {
  if (this.getFilter().isDeleted === undefined) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
}

moneyTransactionSchema.pre('find', excludeDeleted);
moneyTransactionSchema.pre('findOne', excludeDeleted);
moneyTransactionSchema.pre('countDocuments', excludeDeleted);

export const MoneyTransaction = model<IMoneyTransaction>('MoneyTransaction', moneyTransactionSchema);
