import mongoose, { Document, Schema } from "mongoose";

export interface IActivity extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "user_registered",
        "user_login",
        "essay_created",
        "essay_viewed",
        "essay_updated",
        "essay_deleted",
        "credit_purchased",
        "credit_used",
        "page_visit",
        "search_performed",
        "export_essay",
        "share_essay",
      ],
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
ActivitySchema.index({ userId: 1, createdAt: -1 });
ActivitySchema.index({ action: 1, createdAt: -1 });
ActivitySchema.index({ createdAt: -1 });

export default mongoose.model<IActivity>("Activity", ActivitySchema);
