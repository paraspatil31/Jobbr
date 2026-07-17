import mongoose, { type Document, type Model, type Types } from "mongoose";

export interface IApplication extends Document {
  job: Types.ObjectId;
  seeker: Types.ObjectId;
  recruiter: Types.ObjectId;
  status: "applied" | "reviewing" | "interview" | "offer" | "rejected";
  timeline: Array<{ label: string; date: string; done: boolean }>;
  note?: string;
  salary?: string;
  jobTitle: string;
  company: string;
  location: string;
  jobType: string;
  createdAt: Date;
  updatedAt: Date;
}

const applicationSchema = new mongoose.Schema<IApplication>(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    seeker: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["applied", "reviewing", "interview", "offer", "rejected"],
      default: "applied",
    },
    timeline: [
      {
        label: { type: String, required: true },
        date: { type: String, required: true },
        done: { type: Boolean, required: true },
      },
    ],
    note: { type: String },
    salary: { type: String },
    jobTitle: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, required: true },
    jobType: { type: String, required: true },
  },
  { timestamps: true }
);

applicationSchema.index({ job: 1, seeker: 1 }, { unique: true });
applicationSchema.index({ seeker: 1 });
applicationSchema.index({ recruiter: 1 });

export const ApplicationModel: Model<IApplication> =
  mongoose.models["Application"] ??
  mongoose.model<IApplication>("Application", applicationSchema);
