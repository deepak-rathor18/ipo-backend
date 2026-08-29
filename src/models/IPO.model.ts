import { Schema, model, Document, Types } from 'mongoose';
import { APP_USERS, AppUser, IPO_STATUS, IpoStatus } from '../constants';

/**
 * All monetary fields (applicationAmount, applicationPrice, allotmentPrice,
 * listingPrice, currentPrice) are stored as integer PAISE, never as
 * floating point rupees. Conversion happens at the service/controller
 * boundary via src/utils/money.ts.
 */
export interface IIPO extends Document {
  ipoName: string;
  companyName: string;

  appliedDate: Date;

  dematName: string;

  applicationAmount: number; // paise
  lotSize: number;
  lotsApplied: number;
  sharesApplied: number;
  applicationPrice: number; // paise (per share)

  status: IpoStatus;

  allottedShares: number;
  allotmentPrice: number; // paise (per share)

  listingDate: Date | null;
  listingPrice: number; // paise (per share)

  currentPrice: number; // paise (per share)

  notes: string;

  createdBy: AppUser;

  isDeleted: boolean;
  deletedAt: Date | null;
  deletedBy: AppUser | null;

  createdAt: Date;
  updatedAt: Date;
}

const ipoSchema = new Schema<IIPO>(
  {
    ipoName: { type: String, required: true, trim: true },
    companyName: { type: String, required: true, trim: true },

    appliedDate: { type: Date, required: true },

    dematName: { type: String, required: true, trim: true },

    applicationAmount: { type: Number, required: true, min: 0 },
    lotSize: { type: Number, required: true, min: 1 },
    lotsApplied: { type: Number, required: true, min: 1 },
    sharesApplied: { type: Number, required: true, min: 1 },
    applicationPrice: { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: IPO_STATUS,
      default: 'APPLIED',
      required: true,
    },

    allottedShares: { type: Number, default: 0, min: 0 },
    allotmentPrice: { type: Number, default: 0, min: 0 },

    listingDate: { type: Date, default: null },
    listingPrice: { type: Number, default: 0, min: 0 },

    currentPrice: { type: Number, default: 0, min: 0 },

    notes: { type: String, default: '', trim: true },

    createdBy: { type: String, enum: APP_USERS, required: true },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: String, enum: APP_USERS, default: null },
  },
  { timestamps: true }
);

ipoSchema.index({ appliedDate: -1 });
ipoSchema.index({ status: 1 });
ipoSchema.index({ dematName: 1 });
ipoSchema.index({ companyName: 1 });
ipoSchema.index({ createdAt: -1 });
ipoSchema.index({ isDeleted: 1 });
ipoSchema.index({ ipoName: 'text', companyName: 'text' });

// Exclude soft-deleted records by default across all find-style queries.
function excludeDeleted(this: any, next: () => void) {
  if (this.getFilter().isDeleted === undefined) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
}

ipoSchema.pre('find', excludeDeleted);
ipoSchema.pre('findOne', excludeDeleted);
ipoSchema.pre('countDocuments', excludeDeleted);

export const IPO = model<IIPO>('IPO', ipoSchema);
export type IPOId = Types.ObjectId;
