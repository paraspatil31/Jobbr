import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft, MapPin, Briefcase, Clock, CheckCircle2,
  XCircle, Hourglass, ChevronRight, Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { getUser } from "@/lib/api";

type AppStatus = "pending" | "reviewed" | "rejected" | "accepted";

interface AppliedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  appliedAt: string;
  status: AppStatus;
  logo: string;
  color: string;
}

const STATUS_CONFIG: Record<AppStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  pending:  { label: "Pending Review", icon: Hourglass,      className: "bg-amber-50 text-amber-700 border-amber-200" },
  reviewed: { label: "Under Review",   icon: Clock,          className: "bg-blue-50 text-blue-700 border-blue-200" },
  rejected: { label: "Not Selected",   icon: XCircle,        className: "bg-red-50 text-red-600 border-red-200" },
  accepted: { label: "Accepted!",      icon: CheckCircle2,   className: "bg-green-50 text-green-700 border-green-200" },
};

/* Placeholder applications — replace with real API data when available */
const SAMPLE: AppliedJob[] = [];

export default function AppliedJobs() {
  const [, navigate] = useLocation();
  const user = getUser();
  const [search, setSearch] = useState("");

  if (!user) { navigate("/auth"); return null; }

  const filtered = SAMPLE.filter(j => {
    const q = search.toLowerCase();
    return !search || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border/40 shadow-sm">
        <div className="container mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-secondary/80 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="font-extrabold text-sm tracking-tight">JobNearby</span>
            </Link>
            <span className="text-muted-foreground/40 text-sm">/</span>
            <span className="text-sm font-semibold">Applied Jobs</span>
          </div>
          {SAMPLE.length > 0 && (
            <div className="ml-auto relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search applications…"
                className="pl-8 h-8 w-48 rounded-full bg-secondary border-0 text-xs"
              />
            </div>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {SAMPLE.length === 0 ? (
          /* Empty state */
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
              <Briefcase className="w-10 h-10 text-primary/50" />
            </div>
            <h2 className="text-xl font-extrabold mb-2">No applications yet</h2>
            <p className="text-muted-foreground text-sm max-w-xs leading-relaxed mb-8">
              Jobs you apply to will appear here. Browse available positions and start applying!
            </p>
            <button
              onClick={() => navigate("/explore")}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
            >
              <MapPin className="w-4 h-4" /> Browse Jobs on Map
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-extrabold text-lg">Your Applications</h2>
              <span className="px-3 py-0.5 rounded-full bg-primary/10 text-primary text-sm font-bold">
                {filtered.length}
              </span>
            </div>
            {filtered.map((job, i) => {
              const s = STATUS_CONFIG[job.status];
              const Icon = s.icon;
              return (
                <motion.div key={job.id} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-extrabold flex-shrink-0"
                      style={{ backgroundColor: job.color }}>
                      {job.logo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-sm group-hover:text-primary transition-colors">{job.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{job.company}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 mt-0.5 flex-shrink-0" />
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <MapPin className="w-2.5 h-2.5" />{job.location}
                        </span>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] text-muted-foreground">{job.type}</span>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${s.className}`}>
                          <Icon className="w-3 h-3" />{s.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60">{job.appliedAt}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
