import mongoose, { type Document, type Model, type Types } from "mongoose";

export interface IRecentlyViewed extends Document {
  seeker: Types.ObjectId;
  job: Types.ObjectId;
  viewedAt: Date;
}

const recentlyViewedSchema = new mongoose.Schema<IRecentlyViewed>(
  {
    seeker: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    viewedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

recentlyViewedSchema.index({ seeker: 1, viewedAt: -1 });
recentlyViewedSchema.index({ seeker: 1, job: 1 }, { unique: true });

export const RecentlyViewedModel: Model<IRecentlyViewed> =
  mongoose.models["RecentlyViewed"] ??
  mongoose.model<IRecentlyViewed>("RecentlyViewed", recentlyViewedSchema);
