import mongoose, { type Document, type Model, type Types } from "mongoose";

export interface IJob extends Document {
  title: string;
  company: string;
  type: "full-time" | "part-time" | "contract" | "freelance";
  location: string;
  salary?: string;
  description: string;
  skills: string[];
  recruiter: Types.ObjectId;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new mongoose.Schema<IJob>(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["full-time", "part-time", "contract", "freelance"],
      required: true,
    },
    location: { type: String, required: true, trim: true },
    salary: { type: String, trim: true },
    description: { type: String, required: true },
    skills: [{ type: String }],
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    latitude: { type: Number },
    longitude: { type: Number },
    radiusKm: { type: Number, default: 25 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

jobSchema.index({ location: "text", title: "text" });

export const JobModel: Model<IJob> =
  mongoose.models["Job"] ?? mongoose.model<IJob>("Job", jobSchema);
