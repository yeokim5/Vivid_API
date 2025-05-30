import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  googleId?: string;
  firebaseUid?: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  createdAt: Date;
  lastLogin: Date;
  credits: number;
}

const UserSchema = new Schema<IUser>(
  {
    googleId: {
      type: String,
      sparse: true,
    },
    firebaseUid: {
      type: String,
      sparse: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    profilePicture: {
      type: String,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    credits: {
      type: Number,
      default: 1, // New users get 1 free credit
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>("User", UserSchema);
