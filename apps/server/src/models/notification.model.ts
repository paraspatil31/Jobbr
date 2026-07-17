import mongoose, { type Document, type Model, type Types } from "mongoose";

export interface INotification extends Document {
  user: Types.ObjectId;
  type: "new_job" | "status_change" | "saved_match" | "profile_view" | "interview_reminder";
  title: string;
  body: string;
  jobId?: Types.ObjectId;
  applicationId?: Types.ObjectId;
  fromUser?: Types.ObjectId;
  distance?: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new mongoose.Schema<INotification>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["new_job", "status_change", "saved_match", "profile_view", "interview_reminder"],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Application" },
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    distance: { type: String },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });

export const NotificationModel: Model<INotification> =
  mongoose.models["Notification"] ??
  mongoose.model<INotification>("Notification", notificationSchema);
