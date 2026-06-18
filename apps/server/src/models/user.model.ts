import mongoose, { type Document, type Model } from "mongoose";

export interface IUser extends Document {
  role: "seeker" | "recruiter";
  fullName: string;
  email: string;
  password: string;
  location: string;
  geoLocation?: { type: "Point"; coordinates: [number, number] };
  companyName?: string;
  jobTitle?: string;
  skills?: string[];
  preferredRadius?: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    role: { type: String, enum: ["seeker", "recruiter"], required: true },
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    location: { type: String, required: true, trim: true },
    geoLocation: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number] },
    },
    companyName: { type: String, trim: true },
    jobTitle: { type: String, trim: true },
    skills: [{ type: String }],
    preferredRadius: { type: Number, default: 25 },
  },
  { timestamps: true }
);

userSchema.index({ geoLocation: "2dsphere" }, { sparse: true });

export const UserModel: Model<IUser> =
  mongoose.models["User"] ?? mongoose.model<IUser>("User", userSchema);
