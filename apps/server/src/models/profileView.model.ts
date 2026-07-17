import mongoose, { type Document, type Model, type Types } from "mongoose";

export interface IProfileView extends Document {
  seeker: Types.ObjectId;
  recruiter: Types.ObjectId;
  viewedAt: Date;
}

const profileViewSchema = new mongoose.Schema<IProfileView>(
  {
    seeker: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    viewedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

profileViewSchema.index({ seeker: 1, viewedAt: -1 });
profileViewSchema.index({ seeker: 1, recruiter: 1 });

export const ProfileViewModel: Model<IProfileView> =
  mongoose.models["ProfileView"] ??
  mongoose.model<IProfileView>("ProfileView", profileViewSchema);
