import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Plus, Briefcase, Users, Eye, LogOut, Bell,
  ChevronDown, X, Building2, CheckCircle2, Clock, DollarSign,
  MoreHorizontal, ToggleLeft, ToggleRight, UserCheck, Mail,
  Phone, Star, ChevronRight, Search, Filter, Inbox, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getUser, clearSession } from "@/lib/api";

/* ─── Types ──────────────────────────────────────────────────── */
type RecTab = "listings" | "applicants";
type AppStage = "applied" | "reviewing" | "interview" | "offer" | "rejected";
type WorkMode = "remote" | "hybrid" | "onsite";

interface PostedJob {
  id: string; title: string; type: string; location: string;
  salary: string; applicants: number; views: number; posted: string; active: boolean;
}

interface Applicant {
  id: string; jobId: string; name: string; initials: string;
  avatarColor: string; title: string; location: string;
  skills: string[]; appliedDate: string; stage: AppStage;
  rating: number; email: string; note?: string; experience?: string;
}

/* ─── Mock data ──────────────────────────────────────────────── */
const INITIAL_JOBS: PostedJob[] = [
  { id: "1", title: "Senior React Developer", type: "full-time", location: "San Francisco, CA", salary: "$100k–$130k", applicants: 4, views: 87, posted: "3 days ago", active: true },
  { id: "2", title: "UI/UX Designer", type: "contract", location: "Remote / SF", salary: "$80k–$100k", applicants: 3, views: 42, posted: "1 week ago", active: true },
  { id: "3", title: "Node.js Backend Developer", type: "full-time", location: "Oakland, CA", salary: "$90k–$115k", applicants: 2, views: 63, posted: "2 weeks ago", active: false },
];

const INITIAL_APPLICANTS: Applicant[] = [
  { id: "c1", jobId: "1", name: "Alex Rivera",   initials: "AR", avatarColor: "bg-blue-500",    title: "Frontend Engineer", location: "SF, CA",       skills: ["React", "TypeScript", "GraphQL"],   appliedDate: "Jun 8",  stage: "interview", rating: 5, email: "alex@example.com",   note: "Strong portfolio. Cleared coding round.", experience: "5 years exp" },
  { id: "c2", jobId: "1", name: "Jamie Chen",    initials: "JC", avatarColor: "bg-purple-500",  title: "React Developer",   location: "Oakland, CA",  skills: ["React", "Redux", "Jest"],           appliedDate: "Jun 7",  stage: "reviewing", rating: 4, email: "jamie@example.com",  experience: "3 years exp" },
  { id: "c3", jobId: "1", name: "Sam Patel",     initials: "SP", avatarColor: "bg-green-500",   title: "UI Developer",      location: "SF, CA",       skills: ["React", "Tailwind", "Vite"],        appliedDate: "Jun 9",  stage: "applied",   rating: 3, email: "sam@example.com",    experience: "2 years exp" },
  { id: "c4", jobId: "1", name: "Morgan Lee",    initials: "ML", avatarColor: "bg-orange-500",  title: "Senior Frontend",   location: "San Jose, CA", skills: ["React", "TypeScript", "AWS"],       appliedDate: "Jun 6",  stage: "offer",     rating: 5, email: "morgan@example.com", note: "Offer sent. Awaiting acceptance by Jun 15.", experience: "7 years exp" },
  { id: "c5", jobId: "2", name: "Taylor Kim",    initials: "TK", avatarColor: "bg-pink-500",    title: "Product Designer",  location: "SF, CA",       skills: ["Figma", "Prototyping", "Research"], appliedDate: "Jun 5",  stage: "interview", rating: 4, email: "taylor@example.com", experience: "4 years exp" },
  { id: "c6", jobId: "2", name: "Jordan Wu",     initials: "JW", avatarColor: "bg-cyan-500",    title: "UX Designer",       location: "Remote",       skills: ["Figma", "Adobe XD", "Sketch"],      appliedDate: "Jun 4",  stage: "reviewing", rating: 3, email: "jordan@example.com", experience: "3 years exp" },
  { id: "c7", jobId: "2", name: "Casey Nguyen",  initials: "CN", avatarColor: "bg-rose-500",    title: "Visual Designer",   location: "Berkeley, CA", skills: ["Figma", "Motion", "Branding"],      appliedDate: "Jun 6",  stage: "rejected",  rating: 2, email: "casey@example.com",  experience: "1 year exp" },
  { id: "c8", jobId: "3", name: "Riley Brooks",  initials: "RB", avatarColor: "bg-indigo-500",  title: "Backend Engineer",  location: "Oakland, CA",  skills: ["Node.js", "MongoDB", "Docker"],     appliedDate: "May 28", stage: "reviewing", rating: 4, email: "riley@example.com",  experience: "4 years exp" },
  { id: "c9", jobId: "3", name: "Drew Hassan",   initials: "DH", avatarColor: "bg-amber-500",   title: "Full-stack Dev",    location: "SF, CA",       skills: ["Node.js", "PostgreSQL", "Redis"],   appliedDate: "May 27", stage: "applied",   rating: 3, email: "drew@example.com",   experience: "2 years exp" },
];

const MOCK_NOTIFICATIONS = [
  { id: "n1", text: "Alex Rivera accepted interview for Senior React Developer", time: "2m ago", read: false },
  { id: "n2", text: "2 new applicants for UI/UX Designer", time: "1h ago", read: false },
  { id: "n3", text: "Jordan Wu updated their profile", time: "3h ago", read: true },
];

/* ─── Config ─────────────────────────────────────────────────── */
const TYPE_LABELS: Record<string, string> = { "full-time": "Full-time", "part-time": "Part-time", contract: "Contract", freelance: "Freelance" };
const TYPE_COLORS: Record<string, string> = { "full-time": "bg-green-100 text-green-700", "part-time": "bg-blue-100 text-blue-700", contract: "bg-orange-100 text-orange-700", freelance: "bg-purple-100 text-purple-700" };

const STAGE_CONFIG: Record<AppStage, { label: string; color: string; bg: string; border: string; line: string }> = {
  applied:   { label: "Applied",      color: "text-slate-600",  bg: "bg-slate-100",  border: "border-slate-200", line: "bg-slate-400" },
  reviewing: { label: "Under Review", color: "text-blue-600",   bg: "bg-blue-100",   border: "border-blue-200",  line: "bg-blue-400" },
  interview: { label: "Interview",    color: "text-amber-600",  bg: "bg-amber-100",  border: "border-amber-200", line: "bg-amber-400" },
  offer:     { label: "Offer Sent",   color: "text-green-600",  bg: "bg-green-100",  border: "border-green-200", line: "bg-green-400" },
  rejected:  { label: "Not a Fit",   color: "text-red-500",    bg: "bg-red-100",    border: "border-red-200",   line: "bg-red-400" },
};

const STAGE_ORDER: AppStage[] = ["applied", "reviewing", "interview", "offer", "rejected"];

/* ─── Mock match score per job ───────────────────────────────── */
const JOB_MATCH: Record<string, { label: string; cls: string }> = {
  "1": { label: "High demand", cls: "text-green-600 bg-green-50 border-green-200" },
  "2": { label: "Medium",      cls: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  "3": { label: "High demand", cls: "text-green-600 bg-green-50 border-green-200" },
};

/* ─── Component ─────────────────────────────────────────────── */
export default function RecruiterDashboard() {
  const [, navigate] = useLocation();
  const user = getUser();
  const [tab, setTab] = useState<RecTab>("listings");
  const [jobs, setJobs] = useState<PostedJob[]>(INITIAL_JOBS);
  const [applicants, setApplicants] = useState<Applicant[]>(INITIAL_APPLICANTS);
  const [selectedJobId, setSelectedJobId] = useState<string>("1");
  const [stageFilter, setStageFilter] = useState<AppStage | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showApplicantId, setShowApplicantId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", type: "full-time", location: "", salary: "", description: "", skills: "",
    workMode: "onsite" as WorkMode, experience: "", category: "Engineering",
  });
  const [posted, setPosted] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  /* load real recruiter jobs on mount */
  useEffect(() => {
    const token = localStorage.getItem("jn_token");
    if (!token) return;
    fetch("/api/jobs", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then((data: unknown) => {
        if (data && typeof data === "object") {
          const d = data as { jobs?: Record<string, unknown>[] };
          const list = d.jobs ?? [];
          if (list.length > 0) {
            const mapped: PostedJob[] = list.map((j) => ({
              id: String(j["_id"]),
              title: String(j["title"] ?? ""),
              type: String(j["type"] ?? "full-time"),
              location: String(j["location"] ?? ""),
              salary: String(j["salary"] ?? "Negotiable"),
              applicants: 0,
              views: 0,
              posted: new Date(String(j["createdAt"])).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              active: Boolean(j["isActive"] ?? true),
            }));
            setJobs(mapped);
            if (mapped.length > 0) setSelectedJobId(mapped[0].id);
          }
        }
      })
      .catch(() => {});
  }, []);

  /* load real applicants when selected job changes */
  useEffect(() => {
    if (!selectedJobId) return;
    const token = localStorage.getItem("jn_token");
    if (!token) return;
    fetch(`/api/applications/job/${selectedJobId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then((data: unknown) => {
        if (Array.isArray(data) && data.length > 0) {
          const colors = ["bg-blue-500","bg-purple-500","bg-green-500","bg-orange-500","bg-pink-500","bg-cyan-500","bg-rose-500","bg-indigo-500","bg-amber-500"];
          const mapped: Applicant[] = (data as Record<string, unknown>[]).map((a, i) => {
            const seeker = a["seeker"] as Record<string, unknown> | null;
            const name = String(seeker?.["fullName"] ?? "Applicant");
            return {
              id: String(a["_id"]),
              jobId: selectedJobId,
              name,
              initials: name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2),
              avatarColor: colors[i % colors.length],
              title: String(seeker?.["jobTitle"] ?? ""),
              location: String(seeker?.["location"] ?? ""),
              skills: Array.isArray(seeker?.["skills"]) ? (seeker!["skills"] as string[]) : [],
              appliedDate: new Date(String(a["createdAt"])).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              stage: (a["status"] as AppStage) ?? "applied",
              rating: 3,
              email: String(seeker?.["email"] ?? ""),
              note: a["note"] as string | undefined,
            };
          });
          setApplicants(prev => {
            // Replace applicants for this job, keep others (other jobs' mock data)
            const otherJobs = prev.filter(ap => ap.jobId !== selectedJobId);
            return [...otherJobs, ...mapped];
          });
        }
      })
      .catch(() => {}); // Keep mock data if API fails or job has no real applicants
  }, [selectedJobId]);

  /* Load real recruiter notifications */
  useEffect(() => {
    const token = localStorage.getItem("jn_token");
    if (!token) return;
    fetch("/api/notifications", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then((data: unknown) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = (data as Record<string, unknown>[]).map((n) => ({
            id: String(n["_id"]),
            text: String(n["body"] ?? n["title"] ?? ""),
            time: new Date(String(n["createdAt"])).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            read: Boolean(n["read"]),
          }));
          setNotifications(mapped);
        }
      })
      .catch(() => {});
  }, []);

  /* close notifications on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const signOut = () => { clearSession(); navigate("/"); };

  const toggleActive = (id: string) =>
    setJobs((p) => p.map((j) => j.id === id ? { ...j, active: !j.active } : j));

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.location || !form.description) return;
    setJobs((p) => [{
      id: String(Date.now()), title: form.title, type: form.type,
      location: form.location, salary: form.salary || "Negotiable",
      applicants: 0, views: 0, posted: "Just now", active: true,
    }, ...p]);
    setPosted(true);
    setTimeout(() => {
      setPosted(false);
      setShowModal(false);
      setForm({ title: "", type: "full-time", location: "", salary: "", description: "", skills: "", workMode: "onsite", experience: "", category: "Engineering" });
    }, 1800);
    const token = localStorage.getItem("jn_token");
    if (token) {
      fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: form.title,
          company: (user as Record<string, string> | null)?.companyName ?? "My Company",
          category: form.category,
          type: form.type,
          location: form.location,
          description: form.description,
          salary: form.salary,
          skills: form.skills.split(",").map((s: string) => s.trim()).filter(Boolean),
        }),
      }).catch(() => {});
    }
  };

  const updateStage = (applicantId: string, stage: AppStage) => {
    setApplicants((p) => p.map((a) => a.id === applicantId ? { ...a, stage } : a));
    // Best-effort sync to backend
    const token = localStorage.getItem("jn_token");
    if (token) {
      fetch(`/api/applications/${applicantId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: stage }),
      }).catch(() => {});
    }
  };

  const markAllRead = () => setNotifications((n) => n.map((x) => ({ ...x, read: true })));

  const activeJobs = jobs.filter((j) => j.active).length;
  const totalApplicants = applicants.length;
  const totalViews = jobs.reduce((s, j) => s + j.views, 0);
  const interviewCount = applicants.filter((a) => a.stage === "interview").length;

  const selectedJob = jobs.find((j) => j.id === selectedJobId) ?? jobs[0];
  const jobApplicants = applicants.filter((a) => {
    const matchJob = a.jobId === selectedJobId;
    const matchStage = stageFilter === "all" || a.stage === stageFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch = !searchQuery || a.name.toLowerCase().includes(q) || a.title.toLowerCase().includes(q) || a.skills.some((s) => s.toLowerCase().includes(q));
    return matchJob && matchStage && matchSearch;
  });

  const pipelineCounts = STAGE_ORDER.reduce<Record<string, number>>((acc, s) => {
    acc[s] = applicants.filter((a) => a.jobId === selectedJobId && a.stage === s).length;
    return acc;
  }, {});

  const detailApplicant = applicants.find((a) => a.id === showApplicantId);

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
              <MapPin className="w-3.5 h-3.5" strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-base tracking-tight">JobNearby</span>
          </Link>
          <div className="flex items-center gap-3">
            {/* Notification bell with dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications((v) => !v)}
                className="relative w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-secondary/80 transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-amber-400 text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-border/50 z-50 overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                      <span className="font-bold text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-primary font-semibold hover:underline">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="divide-y divide-border/30 max-h-72 overflow-y-auto">
                      {notifications.map((n) => (
                        <div key={n.id} className={`px-4 py-3 text-sm flex items-start gap-2 ${n.read ? "opacity-60" : ""}`}>
                          {!n.read && <span className="mt-1.5 w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />}
                          {n.read && <span className="mt-1.5 w-2 h-2 flex-shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <p className="leading-snug text-foreground">{n.text}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2 pl-3 border-l border-border">
              <div className="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center text-blue-600 text-xs font-bold">
                {user?.fullName?.[0]?.toUpperCase() ?? "R"}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold leading-none">{user?.fullName ?? "Recruiter"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Recruiter</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <button onClick={signOut} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors ml-1">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* ── Banner ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 mb-8 flex items-center justify-between overflow-hidden relative"
        >
          <div className="absolute right-0 top-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
          <div className="absolute right-24 bottom-0 w-24 h-24 rounded-full bg-white/5 translate-y-1/2" />
          <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-primary/20 blur-2xl" />
          <div className="relative">
            <p className="text-slate-400 text-sm font-medium mb-1">Recruiter Dashboard</p>
            <h1 className="text-2xl font-extrabold text-white">Welcome, {user?.fullName?.split(" ")[0] ?? "Recruiter"}</h1>
            <p className="text-slate-400 text-sm mt-1">{activeJobs} active listing{activeJobs !== 1 ? "s" : ""} · {totalApplicants} candidates in pipeline.</p>
          </div>
          <div className="relative hidden md:flex items-center gap-4 text-white">
            {[
              { icon: Briefcase, label: "Active jobs",  value: String(activeJobs) },
              { icon: Users,     label: "Applicants",   value: String(totalApplicants) },
              { icon: UserCheck, label: "Interviews",   value: String(interviewCount) },
              { icon: Eye,       label: "Total views",  value: String(totalViews) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-1">
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-xl font-extrabold leading-none">{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
            {/* Profile views tracking card */}
            <div className="ml-2 pl-4 border-l border-white/20 text-center">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 flex items-center justify-center mx-auto mb-1">
                <Eye className="w-5 h-5 text-amber-300" />
              </div>
              <p className="text-xl font-extrabold leading-none text-amber-300">8</p>
              <p className="text-xs text-slate-400 mt-0.5">Profile views<br />this week</p>
            </div>
          </div>
        </motion.div>

        {/* ── Tab switcher ── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1 p-1 bg-white border border-border/50 rounded-xl shadow-sm w-fit">
            {([
              { key: "listings",   label: "Job Listings",  icon: Briefcase, count: jobs.length },
              { key: "applicants", label: "Applicants",    icon: Users,     count: totalApplicants },
            ] as const).map(({ key, label, icon: Icon, count }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Icon className="w-4 h-4" />
                {label}
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${tab === key ? "bg-white/25 text-white" : "bg-secondary text-muted-foreground"}`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
          <Button onClick={() => setShowModal(true)} className="gap-2 rounded-xl shadow-sm shadow-primary/20 font-bold">
            <Plus className="w-4 h-4" /> Post a Job
          </Button>
        </div>

        <AnimatePresence mode="wait">

          {/* ══════════════ JOB LISTINGS ══════════════ */}
          {tab === "listings" && (
            <motion.div key="listings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <div className="space-y-3">
                {jobs.map((job, i) => {
                  const match = JOB_MATCH[job.id] ?? { label: "Medium", cls: "text-yellow-600 bg-yellow-50 border-yellow-200" };
                  return (
                    <motion.div key={job.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                      className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-all ${job.active ? "border-border/50" : "border-border/30 opacity-60"}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold truncate">{job.title}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${TYPE_COLORS[job.type]}`}>{TYPE_LABELS[job.type]}</span>
                          {!job.active && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 flex-shrink-0">Paused</span>}
                          {/* Match score badge */}
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border flex-shrink-0 ${match.cls}`}>
                            {match.label}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{job.salary}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Posted {job.posted}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-center flex-shrink-0">
                        <div><p className="text-lg font-extrabold leading-none">{applicants.filter(a => a.jobId === job.id).length}</p><p className="text-xs text-muted-foreground mt-0.5">Applicants</p></div>
                        <div><p className="text-lg font-extrabold leading-none">{job.views}</p><p className="text-xs text-muted-foreground mt-0.5">Views</p></div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => { setSelectedJobId(job.id); setTab("applicants"); }}
                          className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors px-3 py-1.5 rounded-lg border border-primary/30 hover:border-primary/60 bg-primary/5"
                        >
                          <Users className="w-3.5 h-3.5" /> View Applicants
                        </button>
                        <button onClick={() => toggleActive(job.id)}
                          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border/60 hover:border-border bg-secondary/40"
                        >
                          {job.active ? <><ToggleRight className="w-4 h-4 text-green-500" /> Active</> : <><ToggleLeft className="w-4 h-4" /> Paused</>}
                        </button>
                        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              {jobs.length === 0 && (
                <div className="text-center py-20 text-muted-foreground">
                  <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-semibold">No jobs posted yet</p>
                  <p className="text-sm mt-1">Click "Post a Job" to get started</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ══════════════ APPLICANTS ══════════════ */}
          {tab === "applicants" && (
            <motion.div key="applicants" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="flex gap-5">

              {/* Left: job selector */}
              <div className="hidden md:flex flex-col gap-2 w-56 flex-shrink-0">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 px-1">Job Listings</p>
                {jobs.map((job) => {
                  const count = applicants.filter((a) => a.jobId === job.id).length;
                  return (
                    <button key={job.id} onClick={() => { setSelectedJobId(job.id); setStageFilter("all"); setSearchQuery(""); }}
                      className={`text-left px-3 py-3 rounded-xl border text-sm transition-all ${selectedJobId === job.id ? "bg-primary/8 border-primary/30 shadow-sm" : "bg-white border-border/50 hover:border-primary/20 shadow-sm"}`}
                    >
                      <p className={`font-semibold leading-tight ${selectedJobId === job.id ? "text-primary" : "text-foreground"}`}>{job.title}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs text-muted-foreground">{count} candidate{count !== 1 ? "s" : ""}</span>
                        {!job.active && <span className="text-[10px] bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5 font-semibold">Paused</span>}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right: applicants panel */}
              <div className="flex-1 min-w-0">
                {/* Pipeline summary */}
                <div className="grid grid-cols-5 gap-2 mb-5">
                  {STAGE_ORDER.map((stage) => {
                    const cfg = STAGE_CONFIG[stage];
                    const n = pipelineCounts[stage] ?? 0;
                    const isSelected = stageFilter === stage;
                    return (
                      <button key={stage} onClick={() => setStageFilter(stageFilter === stage ? "all" : stage)}
                        className={`rounded-xl border p-3 text-center transition-all relative overflow-hidden ${isSelected ? `${cfg.bg} ${cfg.border} shadow-sm` : "bg-white border-border/50 hover:border-primary/20 shadow-sm"}`}
                      >
                        {/* bottom color line */}
                        <div className={`absolute bottom-0 left-0 right-0 h-1 ${cfg.line}`} />
                        <p className={`text-2xl font-extrabold leading-none ${cfg.color}`}>{n}</p>
                        <p className={`text-[11px] font-medium mt-1 ${isSelected ? cfg.color : "text-muted-foreground"}`}>{cfg.label}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Search + filter bar */}
                <div className="flex gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search candidates…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-10 bg-white border-border/60 shadow-sm" />
                  </div>
                  {/* Mobile job selector */}
                  <select value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)}
                    className="md:hidden h-10 rounded-lg border border-border/60 bg-white px-3 text-sm shadow-sm focus:outline-none"
                  >
                    {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
                  </select>
                  <button onClick={() => setStageFilter("all")} className="h-10 px-3 rounded-lg border border-border/60 bg-white text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1.5 shadow-sm flex-shrink-0">
                    <Filter className="w-3.5 h-3.5" /> Clear
                  </button>
                </div>

                {/* Applicant cards */}
                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {jobApplicants.map((ap, i) => {
                      const cfg = STAGE_CONFIG[ap.stage];
                      return (
                        <motion.div key={ap.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} transition={{ delay: i * 0.04 }}
                          className={`bg-white rounded-2xl border shadow-sm p-5 transition-all hover:shadow-md ${ap.stage === "offer" ? "border-green-300" : ap.stage === "rejected" ? "border-border/30 opacity-70" : "border-border/50"}`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-xl ${ap.avatarColor} flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0`}>{ap.initials}</div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 flex-wrap">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-bold">{ap.name}</h3>
                                    <div className="flex">
                                      {Array.from({ length: 5 }).map((_, idx) => (
                                        <Star key={idx} className={`w-3 h-3 ${idx < ap.rating ? "text-primary fill-primary" : "text-border"}`} />
                                      ))}
                                    </div>
                                    {ap.experience && (
                                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full font-medium">{ap.experience}</span>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">{ap.title} · <span className="inline-flex items-center gap-0.5"><MapPin className="w-3 h-3" />{ap.location}</span></p>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                              </div>

                              <div className="flex flex-wrap gap-1.5 mt-2.5">
                                {ap.skills.map((s) => <span key={s} className="px-2 py-0.5 rounded-md bg-secondary text-xs font-medium text-muted-foreground">{s}</span>)}
                              </div>

                              <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Applied {ap.appliedDate}</span>
                                  <a href={`mailto:${ap.email}`} className="flex items-center gap-1 hover:text-primary transition-colors"><Mail className="w-3 h-3" />{ap.email}</a>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button onClick={() => setShowApplicantId(ap.id)}
                                    className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg border border-border/60 hover:border-border transition-colors bg-secondary/40"
                                  >
                                    <ChevronRight className="w-3.5 h-3.5" /> Profile
                                  </button>

                                  {/* View Resume button */}
                                  <button
                                    onClick={() => alert(`Resume: ${ap.name.replace(" ", "_")}_Resume.pdf`)}
                                    className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 px-2.5 py-1.5 rounded-lg border border-blue-200 hover:border-blue-400 transition-colors bg-blue-50"
                                  >
                                    <FileText className="w-3.5 h-3.5" /> Resume
                                  </button>

                                  {/* Stage dropdown */}
                                  <select value={ap.stage} onChange={(e) => updateStage(ap.id, e.target.value as AppStage)}
                                    className={`h-8 rounded-lg border px-2 text-xs font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring transition-all ${cfg.bg} ${cfg.color} ${cfg.border}`}
                                  >
                                    {STAGE_ORDER.map((s) => <option key={s} value={s}>{STAGE_CONFIG[s].label}</option>)}
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {jobApplicants.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground bg-white rounded-2xl border border-border/50">
                      <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                        <Inbox className="w-10 h-10 opacity-30" />
                      </div>
                      <p className="font-bold text-base">No candidates match</p>
                      <p className="text-sm mt-1.5 max-w-xs mx-auto">Try changing the stage filter or search query to find the right candidates.</p>
                      <button onClick={() => { setStageFilter("all"); setSearchQuery(""); }} className="mt-4 text-xs text-primary font-semibold hover:underline">
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Applicant detail drawer ── */}
      <AnimatePresence>
        {showApplicantId && detailApplicant && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowApplicantId(null)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-border/50">
                <h3 className="text-lg font-extrabold">Candidate Profile</h3>
                <button onClick={() => setShowApplicantId(null)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-secondary/80 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl ${detailApplicant.avatarColor} flex items-center justify-center text-white font-extrabold text-xl`}>{detailApplicant.initials}</div>
                  <div>
                    <h4 className="text-xl font-extrabold">{detailApplicant.name}</h4>
                    <p className="text-muted-foreground">{detailApplicant.title}</p>
                    <div className="flex mt-1">{Array.from({ length: 5 }).map((_, idx) => <Star key={idx} className={`w-3.5 h-3.5 ${idx < detailApplicant.rating ? "text-primary fill-primary" : "text-border"}`} />)}</div>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-3">
                  {[
                    { icon: MapPin, label: "Location", value: detailApplicant.location },
                    { icon: Mail,   label: "Email",    value: detailApplicant.email },
                    { icon: Clock,  label: "Applied",  value: detailApplicant.appliedDate },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground flex-shrink-0"><Icon className="w-3.5 h-3.5" /></div>
                      <div><p className="text-xs text-muted-foreground font-medium">{label}</p><p className="font-semibold">{value}</p></div>
                    </div>
                  ))}
                </div>

                {/* Skills */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {detailApplicant.skills.map((s) => <span key={s} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">{s}</span>)}
                  </div>
                </div>

                {/* Notes */}
                {detailApplicant.note && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <p className="text-xs font-semibold text-amber-700 mb-1">Recruiter Notes</p>
                    <p className="text-sm text-amber-900">{detailApplicant.note}</p>
                  </div>
                )}

                {/* Current stage */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Pipeline Stage</p>
                  <div className="grid grid-cols-1 gap-1.5">
                    {STAGE_ORDER.map((s) => {
                      const cfg = STAGE_CONFIG[s];
                      const active = detailApplicant.stage === s;
                      return (
                        <button key={s} onClick={() => updateStage(detailApplicant.id, s)}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${active ? `${cfg.bg} ${cfg.border} ${cfg.color}` : "bg-white border-border/50 text-muted-foreground hover:border-primary/20"}`}
                        >
                          {active && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
                          {!active && <div className="w-4 h-4 rounded-full border-2 border-current opacity-30 flex-shrink-0" />}
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer actions */}
              <div className="px-6 py-4 border-t border-border/50 flex gap-2">
                <Button className="flex-1 gap-2 rounded-xl font-bold" onClick={() => updateStage(detailApplicant.id, "interview")}>
                  <Phone className="w-4 h-4" /> Schedule Interview
                </Button>
                <Button variant="outline" className="gap-2 rounded-xl font-semibold" onClick={() => updateStage(detailApplicant.id, "rejected")}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Post Job Modal ── */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg bg-white rounded-3xl shadow-2xl z-50 overflow-hidden"
            >
              {posted ? (
                <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-16 px-8 text-center">
                  <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-4"><CheckCircle2 className="w-10 h-10 text-green-500" strokeWidth={1.5} /></div>
                  <h3 className="text-xl font-extrabold mb-1">Job Posted!</h3>
                  <p className="text-muted-foreground text-sm">Your listing is now live for local candidates.</p>
                </motion.div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/50">
                    <div><h3 className="text-xl font-extrabold">Post a New Job</h3><p className="text-sm text-muted-foreground mt-0.5">Fill in the details to attract local talent</p></div>
                    <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-secondary/80 transition-colors"><X className="w-4 h-4" /></button>
                  </div>
                  <form onSubmit={handlePost} className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                    <div>
                      <Label className="text-sm font-medium mb-1.5 block">Job Title *</Label>
                      <Input placeholder="e.g. Senior React Developer" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-secondary/30" required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-medium mb-1.5 block">Job Type *</Label>
                        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full h-10 rounded-lg border border-input bg-secondary/30 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                          <option value="full-time">Full-time</option><option value="part-time">Part-time</option><option value="contract">Contract</option><option value="freelance">Freelance</option>
                        </select>
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-1.5 block">Work Mode</Label>
                        <select value={form.workMode} onChange={(e) => setForm({ ...form, workMode: e.target.value as WorkMode })} className="w-full h-10 rounded-lg border border-input bg-secondary/30 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                          <option value="onsite">On-site</option>
                          <option value="hybrid">Hybrid</option>
                          <option value="remote">Remote</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-medium mb-1.5 block">Salary Range</Label>
                        <Input placeholder="e.g. $80k–$100k" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} className="bg-secondary/30" />
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-1.5 block">Experience Required</Label>
                        <Input placeholder="e.g. 2-4 years" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} className="bg-secondary/30" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-medium mb-1.5 block">Location *</Label>
                        <Input placeholder="e.g. San Francisco, CA" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="bg-secondary/30" required />
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-1.5 block">Category</Label>
                        <Input placeholder="e.g. Engineering" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="bg-secondary/30" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-1.5 block">Skills Required</Label>
                      <Input placeholder="e.g. React, TypeScript, Node.js" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} className="bg-secondary/30" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-1.5 block">Job Description *</Label>
                      <textarea rows={4} placeholder="Describe the role, responsibilities, and requirements…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required className="w-full rounded-lg border border-input bg-secondary/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                    </div>
                    <div className="pt-1 pb-1">
                      <Button type="submit" className="w-full h-11 rounded-xl font-bold gap-2 shadow-sm shadow-primary/20" disabled={!form.title || !form.location || !form.description}>
                        <Building2 className="w-4 h-4" /> Publish Job Listing
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
