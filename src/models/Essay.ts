import mongoose, { Document, Schema } from "mongoose";

export interface IEssay extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  author: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isPublished: boolean;
  views: number;
  tags: string[];
}

const EssaySchema = new Schema<IEssay>(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    tags: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IEssay>("Essay", EssaySchema);
