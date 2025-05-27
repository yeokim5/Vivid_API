import mongoose, { Document, Schema } from "mongoose";

export interface IEssay extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  subtitle: string;
  header_background_image: string;
  content: string;
  htmlContent?: string;
  author: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isPublished: boolean;
  isPrivate: boolean;
  views: number;
  tags: string[];
  youtubeVideoCode?: string;
  titleColor?: string;
  textColor?: string;
  fontFamily?: string;
}

const EssaySchema = new Schema<IEssay>(
  {
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      default: "",
    },
    header_background_image: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      required: true,
    },
    htmlContent: {
      type: String,
      default: null,
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
    isPrivate: {
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
    youtubeVideoCode: {
      type: String,
      default: "",
    },
    titleColor: {
      type: String,
      default: "#f8f9fa",
    },
    textColor: {
      type: String,
      default: "#f8f9fa",
    },
    fontFamily: {
      type: String,
      default: "Playfair Display",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IEssay>("Essay", EssaySchema);
