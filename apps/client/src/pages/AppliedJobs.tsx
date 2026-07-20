import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft, MapPin, Briefcase, Clock, CheckCircle2,
  XCircle, Hourglass, ChevronRight, Search, Loader2,
  Send, CalendarClock, Eye,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { getUser } from "@/lib/api";

type AppStatus = "applied" | "reviewing" | "interview" | "offer" | "rejected";

interface AppliedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  appliedAt: string;
  status: AppStatus;
  logo: string;
  logoColor: string;
  timeline: { label: string; date: string; done: boolean }[];
  note?: string;
}

const STATUS_CONFIG: Record<AppStatus, { label: string; icon: typeof CheckCircle2; className: string }> = {
  applied:   { label: "Applied",       icon: Send,          className: "bg-slate-50 text-slate-700 border-slate-200" },
  reviewing: { label: "Under Review",  icon: Eye,           className: "bg-blue-50 text-blue-700 border-blue-200" },
  interview: { label: "Interview",     icon: CalendarClock, className: "bg-amber-50 text-amber-700 border-amber-200" },
  offer:     { label: "Offer!",        icon: CheckCircle2,  className: "bg-green-50 text-green-700 border-green-200" },
  rejected:  { label: "Not Selected",  icon: XCircle,       className: "bg-red-50 text-red-600 border-red-200" },
};

const LOGO_COLORS = [
  "bg-blue-500","bg-violet-500","bg-green-500","bg-orange-500",
  "bg-pink-500","bg-cyan-500","bg-rose-500","bg-indigo-500","bg-amber-500",
];

export default function AppliedJobs() {
  const [, navigate] = useLocation();
  const user = getUser();
  const [search, setSearch] = useState("");
  const [jobs, setJobs] = useState<AppliedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }

    const token = localStorage.getItem("jn_token");
    if (!token) { setLoading(false); return; }

    fetch("/api/applications", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : [])
      .then((data: unknown) => {
        if (!Array.isArray(data)) { setLoading(false); return; }
        const mapped: AppliedJob[] = (data as Record<string, unknown>[]).map((a, i) => ({
          id: String(a["_id"]),
          title: String(a["jobTitle"] ?? ""),
          company: String(a["company"] ?? ""),
          location: String(a["location"] ?? ""),
          type: String(a["jobType"] ?? "full-time"),
          salary: a["salary"] ? String(a["salary"]) : undefined,
          appliedAt: new Date(String(a["createdAt"])).toLocaleDateString("en-US", {
            month: "short", day: "numeric", year: "numeric",
          }),
          status: (a["status"] as AppStatus) ?? "applied",
          logo: String(a["company"] ?? "?").slice(0, 2).toUpperCase(),
          logoColor: LOGO_COLORS[i % LOGO_COLORS.length]!,
          timeline: Array.isArray(a["timeline"])
            ? (a["timeline"] as { label: string; date: string; done: boolean }[])
            : [
                { label: "Applied",      date: new Date(String(a["createdAt"])).toLocaleDateString("en-US", { month: "short", day: "numeric" }), done: true },
                { label: "Under Review", date: "—", done: false },
                { label: "Interview",    date: "—", done: false },
                { label: "Decision",     date: "—", done: false },
              ],
          note: a["note"] ? String(a["note"]) : undefined,
        }));
        setJobs(mapped);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  const filtered = jobs.filter((j) => {
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
            {jobs.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">{jobs.length}</span>
            )}
          </div>
          {jobs.length > 0 && (
            <div className="ml-auto relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search applications…"
                className="pl-8 h-8 w-48 rounded-full bg-secondary border-0 text-xs"
              />
            </div>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-3 opacity-40" />
            <p className="text-sm font-medium">Loading your applications…</p>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-6">
              <Briefcase className="w-10 h-10 text-primary/50" />
            </div>
            <h2 className="text-xl font-extrabold mb-2">
              {search ? "No matching applications" : "No applications yet"}
            </h2>
            <p className="text-muted-foreground text-sm max-w-xs leading-relaxed mb-8">
              {search
                ? "Try a different search term."
                : "Jobs you apply to will appear here. Browse available positions and start applying!"}
            </p>
            {!search && (
              <button
                onClick={() => navigate("/dashboard/seeker")}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
              >
                <Briefcase className="w-4 h-4" /> Browse Jobs
              </button>
            )}
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
              const isExpanded = expanded === job.id;
              return (
                <motion.div
                  key={job.id}
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-white border border-border/50 rounded-2xl shadow-sm overflow-hidden"
                >
                  {/* Main row */}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : job.id)}
                    className="w-full text-left p-5 hover:bg-secondary/20 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 rounded-xl ${job.logoColor} flex items-center justify-center text-white text-sm font-extrabold flex-shrink-0`}>
                        {job.logo}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-sm">{job.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{job.company}</p>
                          </div>
                          <ChevronRight className={`w-4 h-4 text-muted-foreground/40 mt-0.5 flex-shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                        </div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <MapPin className="w-2.5 h-2.5" />{job.location}
                          </span>
                          <span className="text-[10px] text-muted-foreground">·</span>
                          <span className="text-[10px] text-muted-foreground">{job.type}</span>
                          {job.salary && (
                            <>
                              <span className="text-[10px] text-muted-foreground">·</span>
                              <span className="text-[10px] text-muted-foreground">{job.salary}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${s.className}`}>
                            <Icon className="w-3 h-3" />{s.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />Applied {job.appliedAt}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Expanded timeline */}
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border/40 px-5 py-4 bg-secondary/20"
                    >
                      {/* Timeline */}
                      <div className="flex items-center gap-0 mb-4">
                        {job.timeline.map((step, idx) => (
                          <div key={step.label} className="flex items-center flex-1 min-w-0">
                            <div className="flex flex-col items-center flex-shrink-0">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 transition-all ${
                                step.done
                                  ? idx === job.timeline.filter(s => s.done).length - 1
                                    ? "border-primary bg-primary text-white"
                                    : "border-green-500 bg-green-500 text-white"
                                  : "border-border bg-background"
                              }`}>
                                {step.done
                                  ? idx === job.timeline.filter(s => s.done).length - 1
                                    ? <ChevronRight className="w-3 h-3" />
                                    : <CheckCircle2 className="w-3 h-3" />
                                  : <span className="w-1.5 h-1.5 rounded-full bg-border" />}
                              </div>
                              <p className="text-[9px] text-muted-foreground mt-0.5 text-center leading-tight whitespace-nowrap">{step.label}</p>
                              <p className="text-[9px] text-muted-foreground/60 text-center">{step.date}</p>
                            </div>
                            {idx < job.timeline.length - 1 && (
                              <div className={`h-0.5 flex-1 mx-1 rounded-full mb-5 ${job.timeline[idx + 1]?.done ? "bg-green-400" : "bg-border"}`} />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Note from recruiter */}
                      {job.note && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
                          <p className="font-semibold mb-0.5">Recruiter note</p>
                          <p className="leading-relaxed">{job.note}</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
