import { type Request, type Response, type NextFunction } from "express";
import { AppError } from "../middlewares/error.middleware.js";
import { ApplicationModel } from "../models/application.model.js";
import { JobModel } from "../models/job.model.js";
import { NotificationModel } from "../models/notification.model.js";
import { UserModel } from "../models/user.model.js";

type AppStatus = "applied" | "reviewing" | "interview" | "offer" | "rejected";

const STATUS_TO_LABEL: Record<string, string> = {
  reviewing: "Under Review",
  interview: "Interview",
  offer: "Decision",
  rejected: "Decision",
};

export async function applyToJob(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.auth) {
      next(new AppError(401, "Authorisation required"));
      return;
    }
    if (req.auth.role !== "seeker") {
      next(new AppError(403, "Only seekers can apply to jobs"));
      return;
    }

    const { jobId } = req.body as { jobId: string };
    if (!jobId) {
      next(new AppError(400, "jobId is required"));
      return;
    }

    const job = await JobModel.findById(jobId);
    if (!job) {
      next(new AppError(404, "Job not found"));
      return;
    }

    const today = new Date().toISOString();
    const timeline = [
      { label: "Applied", date: today, done: true },
      { label: "Under Review", date: "—", done: false },
      { label: "Interview", date: "—", done: false },
      { label: "Decision", date: "—", done: false },
    ];

    const application = await ApplicationModel.create({
      job: job._id,
      seeker: req.auth.userId,
      recruiter: job.recruiter,
      status: "applied",
      timeline,
      jobTitle: job.title,
      company: job.company,
      location: job.location,
      jobType: job.type,
      salary: job.salary,
    });

    res.status(201).json(application);
  } catch (err) {
    next(err);
  }
}

export async function getMyApplications(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.auth) {
      next(new AppError(401, "Authorisation required"));
      return;
    }

    const applications = await ApplicationModel.find({ seeker: req.auth.userId })
      .populate("job")
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (err) {
    next(err);
  }
}

export async function updateApplicationStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.auth) {
      next(new AppError(401, "Authorisation required"));
      return;
    }
    if (req.auth.role !== "recruiter") {
      next(new AppError(403, "Only recruiters can update application status"));
      return;
    }

    const { id } = req.params;
    const { status, note } = req.body as { status: AppStatus; note?: string };

    const application = await ApplicationModel.findById(id);
    if (!application) {
      next(new AppError(404, "Application not found"));
      return;
    }

    // Verify ownership: only the recruiter who owns this application's job can update it
    if (String(application.recruiter) !== req.auth.userId) {
      next(new AppError(403, "Not authorised to update this application"));
      return;
    }

    // Update status and note
    application.status = status;
    if (note !== undefined) {
      application.note = note;
    }

    // Update timeline: cascade mark all steps up to and including the matched label as done
    const targetLabel = STATUS_TO_LABEL[status];
    if (targetLabel) {
      let found = false;
      for (const step of application.timeline) {
        if (!found) {
          step.done = true;
          if (step.date === "—") {
            step.date = new Date().toISOString();
          }
          if (step.label === targetLabel) {
            found = true;
          }
        }
      }
    }

    await application.save();

    // Create notification for seeker
    await NotificationModel.create({
      user: application.seeker,
      type: "status_change",
      title: "Application update",
      body: `${application.company} moved you to ${status} stage`,
      applicationId: application._id,
    });

    res.json(application);
  } catch (err) {
    next(err);
  }
}

export async function getJobApplications(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.auth) {
      next(new AppError(401, "Authorisation required"));
      return;
    }
    if (req.auth.role !== "recruiter") {
      next(new AppError(403, "Only recruiters can view job applications"));
      return;
    }

    const { jobId } = req.params;

    // Verify the job belongs to this recruiter
    const job = await JobModel.findById(jobId).lean();
    if (!job) {
      next(new AppError(404, "Job not found"));
      return;
    }
    if (String(job.recruiter) !== req.auth.userId) {
      next(new AppError(403, "Not authorised to view applications for this job"));
      return;
    }

    const applications = await ApplicationModel.find({ job: jobId })
      .populate("seeker", "fullName email skills jobTitle location")
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (err) {
    next(err);
  }
}
