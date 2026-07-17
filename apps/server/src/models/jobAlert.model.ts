import mongoose, { type Document, type Model, type Types } from "mongoose";

export interface IJobAlert extends Document {
  seeker: Types.ObjectId;
  name: string;
  keywords: string;
  jobTypes: string[];
  radius: number;
  latitude?: number;
  longitude?: number;
  salary?: string;
  frequency: "instant" | "daily" | "weekly";
  paused: boolean;
  lastTriggered?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const jobAlertSchema = new mongoose.Schema<IJobAlert>(
  {
    seeker: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    keywords: { type: String, required: true },
    jobTypes: { type: [String], default: [] },
    radius: { type: Number, default: 25 },
    latitude: { type: Number },
    longitude: { type: Number },
    salary: { type: String },
    frequency: {
      type: String,
      enum: ["instant", "daily", "weekly"],
      default: "instant",
    },
    paused: { type: Boolean, default: false },
    lastTriggered: { type: Date },
  },
  { timestamps: true }
);

jobAlertSchema.index({ seeker: 1 });

export const JobAlertModel: Model<IJobAlert> =
  mongoose.models["JobAlert"] ??
  mongoose.model<IJobAlert>("JobAlert", jobAlertSchema);
