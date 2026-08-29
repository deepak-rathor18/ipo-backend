import { Schema, model, Document } from 'mongoose';
import { APP_USERS, AppUser } from '../constants';

export interface IUser extends Document {
  name: AppUser;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      enum: APP_USERS,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const User = model<IUser>('User', userSchema);
