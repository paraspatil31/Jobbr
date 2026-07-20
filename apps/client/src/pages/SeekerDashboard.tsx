import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Search, Briefcase, Clock, DollarSign,
  LogOut, Bell, ChevronDown, SlidersHorizontal,
  TrendingUp, BookmarkPlus, ExternalLink, Filter,
  CheckCircle2, XCircle, CalendarClock, Send,
  Eye, MoreHorizontal, ChevronRight, Inbox,
  BellRing, BellOff, Radar, Sliders, X, Zap,
  Mail, Smartphone, CircleDot, Sparkles,
  Star, Share2, Building2, Bot, User,
  FileText, Download, Upload, Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getUser, clearSession } from "@/lib/api";

/* ─── Types ─────────────────────────────────────────────────── */
type AppStatus = "applied" | "reviewing" | "interview" | "offer" | "rejected";
type Tab = "overview" | "browse" | "applications" | "alerts" | "profile";

interface Application {
  id: string;
  title: string; company: string; location: string;
  salary: string; type: string; logo: string; logoColor: string;
  appliedDate: string; status: AppStatus;
  timeline: { label: string; date: string; done: boolean }[];
  note?: string;
}

interface Notification {
  id: string;
  type: "new_job" | "status_change" | "saved_match";
  title: string;
  body: string;
  distance?: string;
  time: string;
  read: boolean;
  logo?: string;
  logoColor?: string;
}

interface AlertSettings {
  enabled: boolean;
  radius: number;
  jobTypes: string[];
  keywords: string;
  emailAlerts: boolean;
  pushAlerts: boolean;
}

interface RecentlyViewedJob {
  id: string; title: string; company: string; logo: string; logoColor: string; salary: string; viewedAt: number;
}

interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

/* ─── Mock data ──────────────────────────────────────────────── */
const MOCK_JOBS = [
  { id: "1", title: "Frontend Developer",   company: "TechHub SF",   type: "full-time", location: "San Francisco, CA", salary: "$90k–$120k",  distance: "1.2 mi", distKm: 1.5,  posted: "2 days ago", skills: ["React", "TypeScript", "Tailwind"],       logo: "TH", logoColor: "bg-blue-500",   match: 92, rating: 4.5, exp: "2-4 yrs" },
  { id: "2", title: "UX Designer",          company: "DesignCo",     type: "contract",  location: "San Francisco, CA", salary: "$75k–$95k",   distance: "0.8 mi", distKm: 2.1,  posted: "1 day ago",  skills: ["Figma", "Prototyping", "User Research"],  logo: "DC", logoColor: "bg-purple-500", match: 88, rating: 4.2, exp: "1-3 yrs" },
  { id: "3", title: "Product Manager",      company: "GrowthLabs",   type: "full-time", location: "Oakland, CA",       salary: "$110k–$140k", distance: "3.4 mi", distKm: 3.8,  posted: "Today",      skills: ["Roadmapping", "Agile", "Analytics"],      logo: "GL", logoColor: "bg-green-500",  match: 76, rating: 4.7, exp: "3-5 yrs" },
  { id: "4", title: "Backend Engineer",     company: "DataStream",   type: "part-time", location: "San Francisco, CA", salary: "$70k–$90k",   distance: "2.1 mi", distKm: 4.9,  posted: "3 days ago", skills: ["Node.js", "MongoDB", "AWS"],              logo: "DS", logoColor: "bg-orange-500", match: 81, rating: 4.0, exp: "2-4 yrs" },
  { id: "5", title: "Marketing Specialist", company: "BrandForward", type: "full-time", location: "San Francisco, CA", salary: "$60k–$80k",   distance: "1.8 mi", distKm: 7.2,  posted: "Today",      skills: ["SEO", "Content", "Analytics"],            logo: "BF", logoColor: "bg-pink-500",   match: 70, rating: 4.3, exp: "1-2 yrs" },
  { id: "6", title: "DevOps Engineer",      company: "CloudBase",    type: "contract",  location: "Remote / SF",       salary: "$100k–$130k", distance: "Remote", distKm: 9.5,  posted: "5 days ago", skills: ["Kubernetes", "Docker", "CI/CD"],          logo: "CB", logoColor: "bg-cyan-500",   match: 85, rating: 4.6, exp: "3-6 yrs" },
];

const INITIAL_APPLICATIONS: Application[] = [
  { id: "a1", title: "Senior React Developer", company: "TechHub SF",   location: "San Francisco, CA", salary: "$90k–$120k",  type: "full-time", logo: "TH", logoColor: "bg-blue-500",   appliedDate: "Jun 7, 2026",  status: "interview", note: "Prepare system design questions. Interview is scheduled for Jun 15.", timeline: [{ label: "Applied", date: "Jun 7", done: true }, { label: "Under Review", date: "Jun 9", done: true }, { label: "Interview", date: "Jun 15", done: false }, { label: "Decision", date: "—", done: false }] },
  { id: "a2", title: "UX Designer",            company: "DesignCo",     location: "San Francisco, CA", salary: "$75k–$95k",   type: "contract",  logo: "DC", logoColor: "bg-purple-500", appliedDate: "Jun 4, 2026",  status: "offer",     note: "Offer letter received — $88k base + benefits. Deadline Jun 14.", timeline: [{ label: "Applied", date: "Jun 4", done: true }, { label: "Under Review", date: "Jun 6", done: true }, { label: "Interview", date: "Jun 9", done: true }, { label: "Decision", date: "Jun 11", done: true }] },
  { id: "a3", title: "Product Manager",        company: "GrowthLabs",   location: "Oakland, CA",       salary: "$110k–$140k", type: "full-time", logo: "GL", logoColor: "bg-green-500",  appliedDate: "Jun 1, 2026",  status: "rejected",  timeline: [{ label: "Applied", date: "Jun 1", done: true }, { label: "Under Review", date: "Jun 3", done: true }, { label: "Interview", date: "—", done: false }, { label: "Decision", date: "Jun 8", done: true }] },
  { id: "a4", title: "DevOps Engineer",        company: "CloudBase",    location: "Remote / SF",       salary: "$100k–$130k", type: "contract",  logo: "CB", logoColor: "bg-cyan-500",   appliedDate: "Jun 9, 2026",  status: "applied",   timeline: [{ label: "Applied", date: "Jun 9", done: true }, { label: "Under Review", date: "—", done: false }, { label: "Interview", date: "—", done: false }, { label: "Decision", date: "—", done: false }] },
  { id: "a5", title: "Backend Engineer",       company: "DataStream",   location: "San Francisco, CA", salary: "$70k–$90k",   type: "part-time", logo: "DS", logoColor: "bg-orange-500", appliedDate: "May 28, 2026", status: "reviewing", timeline: [{ label: "Applied", date: "May 28", done: true }, { label: "Under Review", date: "Jun 2", done: true }, { label: "Interview", date: "—", done: false }, { label: "Decision", date: "—", done: false }] },
];

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: "n1", type: "new_job",      title: "New job near you",       body: "Senior React Developer at NovaTech is 0.6 mi away",   distance: "0.6 mi", time: "2 min ago",  read: false, logo: "NT", logoColor: "bg-violet-500" },
  { id: "n2", type: "status_change",title: "Application update",     body: "TechHub SF moved you to Interview stage",                               time: "1 hr ago",   read: false, logo: "TH", logoColor: "bg-blue-500" },
  { id: "n3", type: "saved_match",  title: "Saved job match nearby", body: "UX Designer at DesignCo matches your saved alert",   distance: "0.8 mi", time: "3 hrs ago",  read: false, logo: "DC", logoColor: "bg-purple-500" },
  { id: "n4", type: "new_job",      title: "New job near you",       body: "Data Analyst at InsightCo is 2.3 mi away",           distance: "2.3 mi", time: "5 hrs ago",  read: true,  logo: "IC", logoColor: "bg-teal-500" },
  { id: "n5", type: "status_change",title: "Application update",     body: "DesignCo sent you an offer — review by Jun 14",                         time: "Yesterday",  read: true,  logo: "DC", logoColor: "bg-purple-500" },
  { id: "n6", type: "new_job",      title: "New job near you",       body: "Full-stack Engineer at Uplift Inc is 1.4 mi away",   distance: "1.4 mi", time: "Yesterday",  read: true,  logo: "UI", logoColor: "bg-rose-500" },
];

const SIMULATED_JOBS = [
  { title: "React Native Developer", company: "MobileFirst", distance: "0.4 mi", salary: "$95k–$125k", logo: "MF", logoColor: "bg-emerald-500" },
  { title: "Data Scientist",         company: "AnalyticHub", distance: "1.1 mi", salary: "$105k–$135k", logo: "AH", logoColor: "bg-indigo-500" },
  { title: "Cloud Architect",        company: "SkyOps",      distance: "2.2 mi", salary: "$120k–$160k", logo: "SO", logoColor: "bg-sky-500" },
];

const MOCK_COMPANIES = [
  { name: "Google",     logo: "Go", color: "bg-blue-500",   positions: 42, rating: 4.8 },
  { name: "Stripe",     logo: "St", color: "bg-violet-500", positions: 18, rating: 4.6 },
  { name: "Figma",      logo: "Fi", color: "bg-pink-500",   positions: 11, rating: 4.5 },
  { name: "Vercel",     logo: "Ve", color: "bg-slate-800",  positions: 7,  rating: 4.7 },
  { name: "Notion",     logo: "No", color: "bg-gray-700",   positions: 9,  rating: 4.4 },
  { name: "Linear",     logo: "Li", color: "bg-indigo-500", positions: 5,  rating: 4.9 },
  { name: "Supabase",   logo: "Su", color: "bg-green-500",  positions: 14, rating: 4.6 },
  { name: "Loom",       logo: "Lo", color: "bg-rose-500",   positions: 6,  rating: 4.3 },
];

const QUICK_FILTERS = ["Full Time", "Part Time", "Internship", "Remote", "Fresher", "Nearby", "High Salary", "Recently Posted"];

const AI_RESPONSES: Record<string, string> = {
  "Find jobs near me": "I found 5 jobs near you matching your profile! Top picks: Frontend Developer at TechHub SF (1.5km away) and UX Designer at DesignCo (2.1km away). Want me to show more?",
  "Improve my resume": "Here are 3 tips to improve your resume: 1) Add quantifiable achievements (e.g. 'Increased performance by 40%'). 2) Include keywords from job descriptions. 3) Add a skills section with your top 6-8 technical skills.",
  "Prepare interview questions": "Great! Here are top interview questions for your profile: 1) Explain the virtual DOM in React. 2) How do you handle state management at scale? 3) Describe a challenging bug you fixed. Want role-specific questions?",
  "Suggest careers": "Based on your skills in React and TypeScript, great career paths include: Senior Frontend Engineer, Full-Stack Developer, UI Engineer, or Frontend Architect. The market demand for these roles is very high right now!",
  "Recommend jobs based on my profile": "Based on your profile, I recommend: Frontend Developer at TechHub SF (92% match), DevOps Engineer at CloudBase (85% match), and UX Designer at DesignCo (88% match). All are within 10km of you!",
};

const TYPE_LABELS: Record<string, string> = { "full-time": "Full-time", "part-time": "Part-time", contract: "Contract", freelance: "Freelance" };
const TYPE_COLORS: Record<string, string> = { "full-time": "bg-green-100 text-green-700", "part-time": "bg-blue-100 text-blue-700", contract: "bg-orange-100 text-orange-700", freelance: "bg-purple-100 text-purple-700" };

const STATUS_CONFIG: Record<AppStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  applied:   { label: "Applied",        color: "text-slate-600", bg: "bg-slate-100",  icon: <Send className="w-3.5 h-3.5" /> },
  reviewing: { label: "Under Review",   color: "text-blue-600",  bg: "bg-blue-100",   icon: <Eye className="w-3.5 h-3.5" /> },
  interview: { label: "Interview",      color: "text-amber-600", bg: "bg-amber-100",  icon: <CalendarClock className="w-3.5 h-3.5" /> },
  offer:     { label: "Offer Received", color: "text-green-600", bg: "bg-green-100",  icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  rejected:  { label: "Not Selected",  color: "text-red-500",   bg: "bg-red-100",    icon: <XCircle className="w-3.5 h-3.5" /> },
};

/* ─── Helpers ────────────────────────────────────────────────── */
function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  return `${Math.floor(diff / 86400)} day ago`;
}

function workMode(location: string): string {
  if (location.toLowerCase().includes("remote")) return "Remote";
  if (location.toLowerCase().includes("hybrid")) return "Hybrid";
  return "Onsite";
}

/* ─── Toast component ────────────────────────────────────────── */
interface ToastProps { id: string; title: string; body: string; distance: string; logo: string; logoColor: string; onDismiss: (id: string) => void; }
function JobToast({ id, title, body, distance, logo, logoColor, onDismiss }: ToastProps) {
  useEffect(() => { const t = setTimeout(() => onDismiss(id), 6000); return () => clearTimeout(t); }, []);
  return (
    <motion.div initial={{ opacity: 0, y: 60, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.92 }} transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="bg-white rounded-2xl shadow-2xl border border-border/60 p-4 w-80 flex items-start gap-3 overflow-hidden relative"
    >
      <div className="absolute top-0 left-0 h-1 w-full bg-primary/20 rounded-t-2xl">
        <motion.div initial={{ width: "100%" }} animate={{ width: "0%" }} transition={{ duration: 6, ease: "linear" }} className="h-full bg-primary rounded-t-2xl" />
      </div>
      <div className={`w-10 h-10 rounded-xl ${logoColor} flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0 mt-0.5`}>{logo}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5"><Radar className="w-3 h-3 text-primary animate-pulse" /><p className="text-xs font-bold text-primary">{title}</p></div>
        <p className="text-sm font-semibold text-foreground leading-snug">{body}</p>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{distance} away</p>
      </div>
      <button onClick={() => onDismiss(id)} className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-secondary/80 mt-0.5"><X className="w-3 h-3" /></button>
    </motion.div>
  );
}

/* ─── Timeline subcomponent ──────────────────────────────────── */
function Timeline({ steps }: { steps: Application["timeline"]; status: AppStatus }) {
  return (
    <div className="flex items-center gap-0 mt-3">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center flex-1 min-w-0">
          <div className="flex flex-col items-center flex-shrink-0">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 transition-all ${step.done ? (i === steps.filter(s => s.done).length - 1 ? "border-primary bg-primary text-white" : "border-green-500 bg-green-500 text-white") : "border-border bg-background"}`}>
              {step.done ? (i === steps.filter(s => s.done).length - 1 ? <ChevronRight className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />) : <span className="w-1.5 h-1.5 rounded-full bg-border" />}
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 text-center leading-tight whitespace-nowrap">{step.label}</p>
            <p className="text-[10px] text-muted-foreground/60 text-center">{step.date}</p>
          </div>
          {i < steps.length - 1 && <div className={`h-0.5 flex-1 mx-1 rounded-full mb-5 ${steps[i + 1]?.done ? "bg-green-400" : "bg-border"}`} />}
        </div>
      ))}
    </div>
  );
}

/* ─── Circular Progress ──────────────────────────────────────── */
function CircularProgress({ pct }: { pct: number }) {
  const r = 36, c = 2 * Math.PI * r;
  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      <circle cx="48" cy="48" r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
      <circle cx="48" cy="48" r={r} fill="none" stroke="hsl(var(--primary))" strokeWidth="8"
        strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100}
        strokeLinecap="round" transform="rotate(-90 48 48)" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      <text x="48" y="52" textAnchor="middle" fontSize="16" fontWeight="800" fill="currentColor">{pct}%</text>
    </svg>
  );
}

/* ─── Job Card (shared between tabs) ────────────────────────── */
interface JobCardProps {
  job: typeof MOCK_JOBS[0];
  saved: Set<string>;
  onSave: (id: string) => void;
  onApply: (id: string) => void;
  onView: (id: string) => void;
  applied: boolean;
  showMatch?: boolean;
  showDistance?: boolean;
}
function JobCard({ job, saved, onSave, onApply, onView, applied, showMatch, showDistance }: JobCardProps) {
  const mode = workMode(job.location);
  return (
    <div onClick={() => onView(job.id)}
      className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md hover:border-primary/20 transition-all group cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl ${job.logoColor} flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0`}>{job.logo}</div>
          <div>
            <h3 className="font-bold text-sm leading-tight group-hover:text-primary transition-colors">{job.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{job.company}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-xs text-muted-foreground">{job.rating}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary transition-all">
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onSave(job.id); }}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${saved.has(job.id) ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary"}`}
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {job.skills.map((s) => <span key={s} className="px-2 py-0.5 rounded-md bg-secondary text-xs font-medium text-muted-foreground">{s}</span>)}
        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${mode === "Remote" ? "bg-green-100 text-green-700" : mode === "Hybrid" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"}`}>{mode}</span>
        <span className="px-2 py-0.5 rounded-md bg-secondary text-xs font-medium text-muted-foreground">{job.exp}</span>
      </div>
      <div className="flex items-center justify-between pt-1 border-t border-border/40">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{showDistance ? `${job.distKm}km` : job.distance}</span>
          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{job.salary}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.posted}</span>
        </div>
        {showMatch && <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">{job.match}% Match</span>}
        {!showMatch && <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${TYPE_COLORS[job.type]}`}>{TYPE_LABELS[job.type]}</span>}
      </div>
      <Button size="sm" variant={applied ? "outline" : "default"} disabled={applied} onClick={(e) => { e.stopPropagation(); onApply(job.id); }} className="w-full h-9 rounded-xl font-semibold gap-1.5 mt-auto">
        {applied ? <><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Applied</> : <><ExternalLink className="w-3.5 h-3.5" /> Apply Now</>}
      </Button>
    </div>
  );
}

/* ─── Profile Completion Card ────────────────────────────────── */
function ProfileCompletion() {
  const items = [
    { label: "Resume", done: true },
    { label: "Skills", done: true },
    { label: "Education", done: false },
    { label: "Experience", done: true },
    { label: "Portfolio", done: false },
    { label: "Certifications", done: false },
  ];
  const pct = Math.round((items.filter(i => i.done).length / items.length) * 100);
  return (
    <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
      <h3 className="font-extrabold mb-4 flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Profile Completion</h3>
      <div className="flex items-center gap-6">
        <CircularProgress pct={pct} />
        <div className="flex-1 grid grid-cols-2 gap-y-2 gap-x-4">
          {items.map(({ label, done }) => (
            <div key={label} className={`flex items-center gap-2 text-sm ${done ? "text-green-700" : "text-muted-foreground"}`}>
              {done ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-border flex-shrink-0" />}
              {label}
            </div>
          ))}
        </div>
      </div>
      {pct < 100 && (
        <div className="mt-4 bg-primary/6 border border-primary/15 rounded-xl px-4 py-2.5 text-xs text-primary font-medium flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
          Complete your profile to get 3× more recruiter views!
        </div>
      )}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────── */
export default function SeekerDashboard() {
  const [, navigate] = useLocation();
  const user = getUser();
  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [applications, setApplications] = useState<Application[]>([]);
  const [statusFilter, setStatusFilter] = useState<AppStatus | "all">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);
  const [nearbyRadius, setNearbyRadius] = useState<number>(5);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedJob[]>([]);

  /* ── AI Assistant ── */
  const [showAI, setShowAI] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "ai", text: "Hi! I'm your AI Career Assistant. Ask me anything or pick a suggestion below!" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  /* ── Notifications ── */
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [toasts, setToasts] = useState<(ToastProps & { id: string })[]>([]);
  const simIdx = useRef(0);

  /* ── Alert settings ── */
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    enabled: true, radius: 5, jobTypes: ["full-time", "contract"],
    keywords: "React, TypeScript, Frontend", emailAlerts: true, pushAlerts: true,
  });
  const [alertSaved, setAlertSaved] = useState(false);

  /* ── Dashboard stats ── */
  const [dashStats, setDashStats] = useState({ appliedJobs: 0, savedJobs: 0, interviews: 0, profileViews: 0 });

  /* ── Companies data ── */
  const [companiesData, setCompaniesData] = useState(MOCK_COMPANIES);

  /* ── Saved alerts ── */
  const [savedAlerts, setSavedAlerts] = useState<Array<{id: string; name: string; keywords: string; jobTypes: string[]; radius: number; frequency: string; paused: boolean; updatedAt: string}>>([]);

  /* ── Live jobs from API (fallback to MOCK_JOBS if empty) ── */
  const [liveJobs, setLiveJobs] = useState(MOCK_JOBS);

  // Load real applications from backend, fall back to mock
  useEffect(() => {
    const token = localStorage.getItem("jn_token");
    if (!token) return;
    fetch("/api/applications", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then((data: unknown) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = (data as Record<string, unknown>[]).map((a) => ({
            id: String(a._id),
            title: String(a.jobTitle ?? ""),
            company: String(a.company ?? ""),
            location: String(a.location ?? ""),
            salary: String(a.salary ?? "Negotiable"),
            type: String(a.jobType ?? "full-time"),
            logo: String((a.company as string ?? "?").slice(0, 2).toUpperCase()),
            logoColor: "bg-blue-500",
            appliedDate: new Date(String(a.createdAt)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            status: (a.status as AppStatus) ?? "applied",
            timeline: Array.isArray(a.timeline) ? (a.timeline as Application["timeline"]) : [
              { label: "Applied", date: "Today", done: true },
              { label: "Under Review", date: "—", done: false },
              { label: "Interview", date: "—", done: false },
              { label: "Decision", date: "—", done: false },
            ],
            note: a.note as string | undefined,
          }));
          setApplications(mapped);
        }
      })
      .catch(() => {}); // silently keep mock data
  }, []);

  // Load real notifications from backend
  useEffect(() => {
    const token = localStorage.getItem("jn_token");
    if (!token) return;
    fetch("/api/notifications", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then((data: unknown) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = (data as Record<string, unknown>[]).map((n) => ({
            id: String(n._id),
            type: (n.type as Notification["type"]) ?? "new_job",
            title: String(n.title ?? ""),
            body: String(n.body ?? ""),
            distance: n.distance as string | undefined,
            time: new Date(String(n.createdAt)).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            read: Boolean(n.read),
            logo: typeof n.title === "string" ? n.title.slice(0, 2).toUpperCase() : "?",
            logoColor: "bg-blue-500",
          }));
          setNotifications(mapped);
        }
      })
      .catch(() => {});
  }, []);

  // Load real dashboard stats
  useEffect(() => {
    const token = localStorage.getItem("jn_token");
    if (!token) return;
    fetch("/api/stats/seeker", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then((d: unknown) => {
        if (d && typeof d === "object") {
          const s = d as Record<string, number>;
          setDashStats({ appliedJobs: s["appliedJobs"] ?? 0, savedJobs: s["savedJobs"] ?? 0, interviews: s["interviews"] ?? 0, profileViews: s["profileViews"] ?? 0 });
        }
      })
      .catch(() => {});
  }, []);

  // Load recently viewed from API
  useEffect(() => {
    const token = localStorage.getItem("jn_token");
    if (!token) return;
    fetch("/api/recently-viewed", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then((data: unknown) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = (data as Record<string, unknown>[]).map((rv) => {
            const j = rv["job"] as Record<string, unknown> | null;
            if (!j) return null;
            return {
              id: String(j["_id"] ?? rv["_id"]),
              title: String(j["title"] ?? ""),
              company: String(j["company"] ?? ""),
              logo: String(j["company"] ?? "?").slice(0, 2).toUpperCase(),
              logoColor: "bg-blue-500",
              salary: String(j["salary"] ?? "Negotiable"),
              viewedAt: new Date(String(rv["viewedAt"])).getTime(),
            };
          }).filter(Boolean) as RecentlyViewedJob[];
          if (mapped.length > 0) setRecentlyViewed(mapped);
        }
      })
      .catch(() => {});
  }, []);

  // Load companies hiring from API
  useEffect(() => {
    fetch("/api/companies-hiring")
      .then(r => r.ok ? r.json() : null)
      .then((data: unknown) => {
        if (Array.isArray(data) && data.length > 0) {
          const colors = ["bg-blue-500","bg-violet-500","bg-pink-500","bg-slate-800","bg-gray-700","bg-indigo-500","bg-green-500","bg-rose-500","bg-orange-500","bg-cyan-500"];
          const mapped = (data as Record<string, unknown>[]).map((c, i) => ({
            name: String(c["company"] ?? ""),
            logo: String(c["company"] ?? "?").slice(0, 2).toUpperCase(),
            color: colors[i % colors.length],
            positions: Number(c["openPositions"] ?? 0),
            rating: 4.2,
          }));
          setCompaniesData(mapped);
        }
      })
      .catch(() => {});
  }, []);

  // Load job alerts from API — normalize _id → id
  useEffect(() => {
    const token = localStorage.getItem("jn_token");
    if (!token) return;
    fetch("/api/job-alerts", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then((data: unknown) => {
        if (Array.isArray(data)) {
          const normalized = (data as Record<string, unknown>[]).map((a) => ({
            id: String(a["_id"] ?? a["id"] ?? ""),
            name: String(a["name"] ?? ""),
            keywords: String(a["keywords"] ?? ""),
            jobTypes: Array.isArray(a["jobTypes"]) ? (a["jobTypes"] as string[]) : [],
            radius: Number(a["radius"] ?? 5),
            frequency: String(a["frequency"] ?? "instant"),
            paused: Boolean(a["paused"]),
            updatedAt: String(a["updatedAt"] ?? a["createdAt"] ?? ""),
          }));
          setSavedAlerts(normalized);
        }
      })
      .catch(() => {});
  }, []);

  // Load live jobs from API (browse/recommended/nearby)
  useEffect(() => {
    fetch("/api/jobs")
      .then(r => r.ok ? r.json() : null)
      .then((data: unknown) => {
        if (data && typeof data === "object") {
          const d = data as { jobs?: Record<string, unknown>[] };
          const list = Array.isArray(d.jobs) ? d.jobs : [];
          if (list.length > 0) {
            const colors = ["bg-blue-500","bg-violet-500","bg-green-500","bg-orange-500","bg-pink-500","bg-cyan-500","bg-rose-500","bg-indigo-500","bg-amber-500","bg-teal-500"];
            const mapped = list.map((j, i) => ({
              id: String(j["_id"]),
              title: String(j["title"] ?? ""),
              company: String(j["company"] ?? ""),
              type: String(j["type"] ?? "full-time"),
              location: String(j["location"] ?? ""),
              salary: String(j["salary"] ?? "Negotiable"),
              distance: "Nearby",
              distKm: typeof j["distance"] === "number" ? j["distance"] / 1000 : 5,
              posted: new Date(String(j["createdAt"])).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              skills: Array.isArray(j["skills"]) ? (j["skills"] as string[]) : [],
              logo: String(j["company"] ?? "?").slice(0, 2).toUpperCase(),
              logoColor: colors[i % colors.length],
              match: 75 + (i % 4) * 5,
              rating: 4.0 + (i % 5) * 0.2,
              exp: "1-3 yrs",
            }));
            setLiveJobs(mapped as typeof MOCK_JOBS);
          }
        }
      })
      .catch(() => {});
  }, []);

  /* ── Simulate new job arriving nearby ── */
  useEffect(() => {
    if (!alertSettings.enabled) return;
    const fire = () => {
      const job = SIMULATED_JOBS[simIdx.current % SIMULATED_JOBS.length];
      simIdx.current++;
      const newNotif: Notification = {
        id: `sim-${Date.now()}`, type: "new_job",
        title: "New job near you", body: `${job.title} at ${job.company}`,
        distance: job.distance, time: "Just now",
        read: false, logo: job.logo, logoColor: job.logoColor,
      };
      setNotifications((p) => [newNotif, ...p]);
      setToasts((p) => [...p, { id: newNotif.id, title: newNotif.title, body: newNotif.body, distance: newNotif.distance ?? "", logo: newNotif.logo ?? "", logoColor: newNotif.logoColor ?? "", onDismiss: dismissToast }]);
    };
    const t = setTimeout(fire, 5000);
    const t2 = setTimeout(fire, 14000);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, [alertSettings.enabled]);

  useEffect(() => {
    if (showAI) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, showAI]);

  const dismissToast = (id: string) => setToasts((p) => p.filter((t) => t.id !== id));
  const unreadCount = notifications.filter((n) => !n.read).length;
  const markAllRead = () => {
    setNotifications((p) => p.map((n) => ({ ...n, read: true })));
    const token = localStorage.getItem("jn_token");
    if (token) {
      fetch("/api/notifications/read-all", { method: "PUT", headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    }
  };
  const markRead = (id: string) => {
    setNotifications((p) => p.map((n) => n.id === id ? { ...n, read: true } : n));
    const token = localStorage.getItem("jn_token");
    if (token) {
      fetch(`/api/notifications/${id}/read`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    }
  };
  const signOut = () => { clearSession(); navigate("/"); };

  const addRecentlyViewed = (jobId: string) => {
    const job = liveJobs.find((j) => j.id === jobId);
    if (!job) return;
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((r) => r.id !== jobId);
      return [{ id: job.id, title: job.title, company: job.company, logo: job.logo, logoColor: job.logoColor, salary: job.salary, viewedAt: Date.now() }, ...filtered].slice(0, 6);
    });
    const token = localStorage.getItem("jn_token");
    if (token) {
      fetch("/api/recently-viewed", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jobId: job.id }),
      }).catch(() => {});
    }
  };

  const applyToJob = (jobId: string) => {
    const job = liveJobs.find((j) => j.id === jobId);
    if (!job || applications.some((a) => a.title === job.title && a.company === job.company)) return;

    const newApp: Application = {
      id: `a${Date.now()}`,
      title: job.title, company: job.company, location: job.location,
      salary: job.salary, type: job.type, logo: job.logo, logoColor: job.logoColor,
      appliedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status: "applied",
      timeline: [
        { label: "Applied", date: "Today", done: true },
        { label: "Under Review", date: "—", done: false },
        { label: "Interview", date: "—", done: false },
        { label: "Decision", date: "—", done: false },
      ],
    };
    setApplications((prev) => [newApp, ...prev]);
    setTab("applications");

    // Also add to recently viewed
    setRecentlyViewed((prev) => {
      const filtered = prev.filter(r => r.id !== jobId);
      return [{ id: jobId, title: job.title, company: job.company, logo: job.logo, logoColor: job.logoColor, salary: job.salary, viewedAt: Date.now() }, ...filtered].slice(0, 10);
    });
    const token2 = localStorage.getItem("jn_token");
    if (token2) {
      fetch("/api/recently-viewed", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token2}` },
        body: JSON.stringify({ jobId }),
      }).catch(() => {});
    }

    // Fire API call (best-effort, doesn't block UI)
    const token = localStorage.getItem("jn_token");
    if (token) {
      fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jobId }),
      }).catch(() => {});
    }
  };

  const toggleSave = (id: string) => setSaved((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const filteredJobs = liveJobs.filter((j) => {
    const q = search.toLowerCase();
    return (!search || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.skills.some((s) => s.toLowerCase().includes(q))) && (activeType === "all" || j.type === activeType);
  });

  const nearbyJobs = liveJobs.filter((j) => j.distKm <= nearbyRadius);

  const filteredApps = applications.filter((a) => statusFilter === "all" || a.status === statusFilter);
  const appCounts: Record<string, number> = { all: applications.length };
  applications.forEach((a) => { appCounts[a.status] = (appCounts[a.status] ?? 0) + 1; });

  const toggleJobType = (t: string) =>
    setAlertSettings((p) => ({ ...p, jobTypes: p.jobTypes.includes(t) ? p.jobTypes.filter((x) => x !== t) : [...p.jobTypes, t] }));

  const saveAlerts = () => {
    setAlertSaved(true);
    setTimeout(() => setAlertSaved(false), 2000);
    const token = localStorage.getItem("jn_token");
    if (token) {
      fetch("/api/job-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: alertSettings.keywords.split(",")[0]?.trim() || "My Alert",
          keywords: alertSettings.keywords,
          jobTypes: alertSettings.jobTypes,
          radius: alertSettings.radius,
          frequency: "instant",
        }),
      }).then(r => r.ok ? r.json() : null).then((a: unknown) => {
        if (a && typeof a === "object") {
          setSavedAlerts(prev => [...prev, a as typeof savedAlerts[0]]);
        }
      }).catch(() => {});
    }
  };

  const notifIcon = (type: Notification["type"]) => {
    if (type === "new_job") return <Radar className="w-3.5 h-3.5 text-primary" />;
    if (type === "status_change") return <TrendingUp className="w-3.5 h-3.5 text-amber-500" />;
    return <BookmarkPlus className="w-3.5 h-3.5 text-green-500" />;
  };

  const sendAIMessage = (text: string) => {
    if (!text.trim()) return;
    setChatMessages((p) => [...p, { role: "user", text }]);
    setChatInput("");
    const response = AI_RESPONSES[text] ?? "Great question! I'm analyzing your profile and will have personalized recommendations for you shortly. Meanwhile, check out the recommended jobs on your Overview tab!";
    setTimeout(() => {
      setChatMessages((p) => [...p, { role: "ai", text: response }]);
    }, 800);
  };

  /* ── Quick Filters row ── */
  const QuickFilters = () => (
    <div className="flex gap-2 flex-wrap mb-5">
      {QUICK_FILTERS.map((f) => (
        <button key={f} onClick={() => setActiveQuickFilter(activeQuickFilter === f ? null : f)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${activeQuickFilter === f ? "bg-primary text-white border-primary shadow-sm" : "bg-white text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground"}`}
        >{f}</button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans">

      {/* ── Toast container ── */}
      <div className="fixed bottom-28 right-6 z-[100] flex flex-col-reverse gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto"><JobToast {...t} onDismiss={dismissToast} /></div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── AI Floating Button ── */}
      <button onClick={() => setShowAI((p) => !p)}
        className="fixed bottom-6 right-6 z-[60] w-14 h-14 rounded-full bg-primary text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
      >
        <Bot className="w-6 h-6" />
      </button>

      {/* ── AI Chat Panel ── */}
      <AnimatePresence>
        {showAI && (
          <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-6 bottom-0 w-80 md:w-96 rounded-t-2xl shadow-2xl bg-white z-[60] flex flex-col overflow-hidden border border-border/60"
            style={{ maxHeight: "70vh" }}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-primary text-white rounded-t-2xl flex-shrink-0">
              <div className="flex items-center gap-2"><Bot className="w-5 h-5" /><span className="font-extrabold text-sm">AI Career Assistant</span></div>
              <button onClick={() => setShowAI(false)} className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "ai" && <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5"><Bot className="w-4 h-4 text-primary" /></div>}
                  <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-snug ${m.role === "user" ? "bg-primary text-white rounded-br-md" : "bg-secondary text-foreground rounded-bl-md"}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="px-3 py-2 border-t border-border/40 flex-shrink-0">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {Object.keys(AI_RESPONSES).map((chip) => (
                  <button key={chip} onClick={() => sendAIMessage(chip)}
                    className="px-2.5 py-1 rounded-full bg-primary/8 text-primary text-xs font-medium border border-primary/20 hover:bg-primary/15 transition-colors"
                  >{chip}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendAIMessage(chatInput)}
                  placeholder="Ask me anything…" className="flex-1 h-9 text-sm bg-secondary/30 border-border/60" />
                <Button size="sm" onClick={() => sendAIMessage(chatInput)} className="h-9 w-9 p-0 rounded-xl"><Send className="w-4 h-4" /></Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            <div className="relative">
              <button onClick={() => setShowNotifPanel((p) => !p)}
                className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-colors ${showNotifPanel ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}`}
              >
                {unreadCount > 0 ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                {unreadCount > 0 && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-white"
                  >{unreadCount > 9 ? "9+" : unreadCount}</motion.span>
                )}
              </button>
              <AnimatePresence>
                {showNotifPanel && (
                  <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNotifPanel(false)} className="fixed inset-0 z-40" />
                    <motion.div initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.97 }} transition={{ type: "spring", stiffness: 320, damping: 28 }}
                      className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-border/60 z-50 overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                        <div>
                          <h4 className="font-extrabold text-sm">Notifications</h4>
                          {unreadCount > 0 && <p className="text-xs text-muted-foreground">{unreadCount} unread</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          {unreadCount > 0 && <button onClick={markAllRead} className="text-xs text-primary font-semibold hover:text-primary/80 transition-colors">Mark all read</button>}
                          <button onClick={() => setShowNotifPanel(false)} className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-secondary/80"><X className="w-3 h-3" /></button>
                        </div>
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-border/40">
                        {notifications.length === 0 && (
                          <div className="py-10 text-center text-muted-foreground"><BellOff className="w-8 h-8 mx-auto mb-2 opacity-20" /><p className="text-sm font-medium">No notifications yet</p></div>
                        )}
                        {notifications.map((n) => (
                          <button key={n.id} onClick={() => markRead(n.id)} className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-secondary/40 transition-colors ${!n.read ? "bg-primary/4" : ""}`}>
                            <div className={`w-9 h-9 rounded-xl ${n.logoColor ?? "bg-secondary"} flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0`}>{n.logo ?? "?"}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">{notifIcon(n.type)}<p className="text-xs font-bold truncate">{n.title}</p>{!n.read && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 ml-auto" />}</div>
                              <p className="text-xs text-muted-foreground leading-snug">{n.body}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {n.distance && <span className="text-[10px] text-primary font-semibold flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{n.distance}</span>}
                                <span className="text-[10px] text-muted-foreground">{n.time}</span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                      <div className="px-4 py-2.5 border-t border-border/50">
                        <button onClick={() => { setShowNotifPanel(false); setTab("alerts"); }}
                          className="w-full text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1.5 py-1"
                        ><Sliders className="w-3.5 h-3.5" /> Manage alert settings</button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-2 pl-3 border-l border-border">
              <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-bold">{user?.fullName?.[0]?.toUpperCase() ?? "U"}</div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold leading-none">{user?.fullName ?? "Seeker"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Job Seeker</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <button onClick={signOut} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors ml-1">
              <LogOut className="w-4 h-4" /><span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* ── Welcome banner ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary/90 to-yellow-400 rounded-2xl p-6 mb-8 flex items-center justify-between overflow-hidden relative"
        >
          <div className="absolute right-0 top-0 w-48 h-48 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/4" />
          <div className="absolute right-24 bottom-0 w-24 h-24 rounded-full bg-white/10 translate-y-1/2" />
          <div className="relative">
            <p className="text-yellow-900/70 text-sm font-medium mb-1">Good morning</p>
            <h1 className="text-2xl font-extrabold text-yellow-950">Hi, {user?.fullName?.split(" ")[0] ?? "there"}!</h1>
            <p className="text-yellow-900/70 text-sm mt-1">
              {applications.filter(a => a.status !== "rejected").length} active application{applications.filter(a => a.status !== "rejected").length !== 1 ? "s" : ""} · {unreadCount > 0 ? `${unreadCount} new alert${unreadCount !== 1 ? "s" : ""}` : "all caught up"}
            </p>
          </div>
          <div className="relative hidden md:flex items-center gap-6 text-yellow-950">
            {[
              { icon: Briefcase, label: "Jobs nearby",   value: "24" },
              { icon: TrendingUp, label: "Applications",  value: String(applications.length) },
              { icon: Radar,     label: "Alerts active", value: alertSettings.enabled ? "On" : "Off" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center">
                <div className="w-10 h-10 rounded-xl bg-white/25 flex items-center justify-center mx-auto mb-1"><Icon className="w-5 h-5" /></div>
                <p className="text-xl font-extrabold leading-none">{value}</p>
                <p className="text-xs text-yellow-900/60 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Tab switcher ── */}
        <div className="flex items-center gap-1 p-1 bg-white border border-border/50 rounded-xl shadow-sm w-fit mb-6 flex-wrap">
          {([
            { key: "overview",     label: "Overview",        icon: TrendingUp, count: undefined },
            { key: "browse",       label: "Browse Jobs",     icon: Search,     count: undefined },
            { key: "applications", label: "My Applications", icon: Inbox,      count: applications.length },
            { key: "alerts",       label: "Job Alerts",      icon: BellRing,   count: unreadCount || undefined },
            { key: "profile",      label: "Profile",         icon: User,       count: undefined },
          ] as const).map(({ key, label, icon: Icon, count }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${tab === key ? "bg-white/25 text-white" : key === "alerts" ? "bg-red-500 text-white" : "bg-secondary text-muted-foreground"}`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ══════════════ OVERVIEW TAB ══════════════ */}
          {tab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-8">

              {/* Quick Filters */}
              <div>
                <h3 className="font-extrabold mb-3 flex items-center gap-2"><Filter className="w-4 h-4 text-primary" /> Quick Filters</h3>
                <QuickFilters />
              </div>

              {/* Recommended Jobs */}
              <div>
                <h3 className="font-extrabold mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Recommended for You</h3>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {liveJobs.slice(0, 4).map((job) => {
                    const applied = applications.some((a) => a.title === job.title && a.company === job.company);
                    return (
                      <motion.div key={job.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <JobCard job={job} saved={saved} onSave={toggleSave} onApply={applyToJob} onView={addRecentlyViewed} applied={applied} showMatch />
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Nearby Jobs */}
              <div>
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h3 className="font-extrabold flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Jobs Near You</h3>
                  <div className="flex gap-1">
                    {[2, 5, 10].map((km) => (
                      <button key={km} onClick={() => setNearbyRadius(km)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${nearbyRadius === km ? "bg-primary text-white border-primary" : "bg-white border-border/60 text-muted-foreground hover:border-primary/40"}`}
                      >{km} km</button>
                    ))}
                  </div>
                </div>
                {nearbyJobs.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground"><MapPin className="w-10 h-10 mx-auto mb-2 opacity-20" /><p className="font-semibold">No jobs within {nearbyRadius}km</p><p className="text-sm mt-1">Try increasing the radius</p></div>
                ) : (
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {nearbyJobs.map((job) => {
                      const applied = applications.some((a) => a.title === job.title && a.company === job.company);
                      return (
                        <motion.div key={job.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                          <JobCard job={job} saved={saved} onSave={toggleSave} onApply={applyToJob} onView={addRecentlyViewed} applied={applied} showDistance />
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recently Viewed */}
              <div>
                <h3 className="font-extrabold mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Recently Viewed</h3>
                {recentlyViewed.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-border/50 shadow-sm py-12 text-center text-muted-foreground">
                    <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="font-semibold">No recently viewed jobs</p>
                    <p className="text-sm mt-1">Browse jobs to see your history here</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {recentlyViewed.map((r) => (
                      <div key={r.id} className="bg-white rounded-xl border border-border/50 shadow-sm p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-9 h-9 rounded-lg ${r.logoColor} flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0`}>{r.logo}</div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate">{r.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{r.company}</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(r.viewedAt)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Companies Hiring */}
              <div>
                <h3 className="font-extrabold mb-4 flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /> Companies Hiring Near You</h3>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {companiesData.map((co) => (
                    <div key={co.name} className="bg-white rounded-xl border border-border/50 shadow-sm p-4 flex flex-col items-center gap-2 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer flex-shrink-0 w-32">
                      <div className={`w-12 h-12 rounded-xl ${co.color} flex items-center justify-center text-white text-sm font-extrabold`}>{co.logo}</div>
                      <p className="text-xs font-bold text-center">{co.name}</p>
                      <p className="text-xs text-muted-foreground">{co.positions} open</p>
                      <div className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" /><span className="text-xs text-muted-foreground">{co.rating}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════════════ BROWSE TAB ══════════════ */}
          {tab === "browse" && (
            <motion.div key="browse" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search jobs, companies, or skills…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-white shadow-sm border-border/60 h-11" />
                </div>
                <Button variant="outline" className="h-11 gap-2 bg-white shadow-sm border-border/60 font-medium"><SlidersHorizontal className="w-4 h-4" /> Filters</Button>
              </div>
              <QuickFilters />
              <div className="flex gap-2 mb-5 flex-wrap">
                {["all", "full-time", "part-time", "contract", "freelance"].map((t) => (
                  <button key={t} onClick={() => setActiveType(t)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeType === t ? "bg-primary text-primary-foreground shadow-sm" : "bg-white text-muted-foreground border border-border/60 hover:border-primary/40 hover:text-foreground"}`}
                  >{t === "all" ? "All jobs" : TYPE_LABELS[t]}</button>
                ))}
              </div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">{filteredJobs.length}</span> jobs found</p>
                <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Filter className="w-3.5 h-3.5" /> Sort: Most recent <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredJobs.map((job, i) => {
                  const applied = applications.some((a) => a.title === job.title && a.company === job.company);
                  return (
                    <motion.div key={job.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <JobCard job={job} saved={saved} onSave={toggleSave} onApply={applyToJob} onView={addRecentlyViewed} applied={applied} />
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ══════════════ APPLICATIONS TAB ══════════════ */}
          {tab === "applications" && (
            <motion.div key="apps" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { label: "Total Applied", value: applications.length,                                                                   color: "text-foreground", bg: "bg-white" },
                  { label: "In Progress",   value: applications.filter(a => a.status === "reviewing" || a.status === "applied").length,    color: "text-blue-600",  bg: "bg-blue-50" },
                  { label: "Interviews",    value: appCounts["interview"] ?? 0,                                                            color: "text-amber-600", bg: "bg-amber-50" },
                  { label: "Offers",        value: appCounts["offer"] ?? 0,                                                                color: "text-green-600", bg: "bg-green-50" },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} className={`${bg} rounded-2xl border border-border/40 shadow-sm p-4 text-center`}>
                    <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 font-medium">{label}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mb-5 flex-wrap">
                {(["all", "applied", "reviewing", "interview", "offer", "rejected"] as const).map((s) => {
                  const cfg = s === "all" ? null : STATUS_CONFIG[s];
                  const count = appCounts[s] ?? 0;
                  if (s !== "all" && count === 0) return null;
                  return (
                    <button key={s} onClick={() => setStatusFilter(s)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${statusFilter === s ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-white border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}
                    >
                      {cfg?.icon}{s === "all" ? "All" : cfg?.label}
                      <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${statusFilter === s ? "bg-white/25 text-white" : "bg-secondary"}`}>{count}</span>
                    </button>
                  );
                })}
              </div>
              <div className="space-y-3">
                {filteredApps.map((app, i) => (
                  <motion.div key={app.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${app.status === "offer" ? "border-green-300 shadow-green-100" : app.status === "rejected" ? "border-border/30" : "border-border/50"}`}
                  >
                    {app.status === "offer" && (
                      <div className="bg-green-500 text-white text-xs font-bold px-5 py-1.5 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Congratulations — you received an offer!
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl ${app.logoColor} flex items-center justify-center text-white text-sm font-extrabold flex-shrink-0 ${app.status === "rejected" ? "opacity-50" : ""}`}>{app.logo}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              <h3 className={`font-bold leading-tight ${app.status === "rejected" ? "text-muted-foreground line-through" : ""}`}>{app.title}</h3>
                              <p className="text-sm text-muted-foreground mt-0.5">{app.company} · {app.location}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_CONFIG[app.status].bg} ${STATUS_CONFIG[app.status].color}`}>
                                {STATUS_CONFIG[app.status].icon}{STATUS_CONFIG[app.status].label}
                              </span>
                              <button onClick={() => setExpanded(expanded === app.id ? null : app.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{app.salary}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Applied {app.appliedDate}</span>
                            <span className={`px-2 py-0.5 rounded-full font-semibold ${TYPE_COLORS[app.type]}`}>{TYPE_LABELS[app.type]}</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 px-1"><Timeline steps={app.timeline} status={app.status} /></div>
                      <AnimatePresence>
                        {expanded === app.id && app.note && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <div className="mt-4 bg-primary/6 border border-primary/15 rounded-xl px-4 py-3 text-sm text-foreground">
                              <p className="text-xs font-semibold text-primary mb-1">Notes</p>{app.note}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {(app.status === "offer" || app.status === "interview") && (
                        <div className="flex gap-2 mt-4">
                          {app.status === "offer" && (
                            <><Button size="sm" className="h-8 rounded-lg font-semibold text-xs gap-1 flex-1"><CheckCircle2 className="w-3.5 h-3.5" /> Accept Offer</Button>
                            <Button size="sm" variant="outline" className="h-8 rounded-lg font-semibold text-xs gap-1 flex-1"><XCircle className="w-3.5 h-3.5" /> Decline</Button></>
                          )}
                          {app.status === "interview" && <Button size="sm" variant="outline" className="h-8 rounded-lg font-semibold text-xs gap-1"><CalendarClock className="w-3.5 h-3.5" /> View Interview Details</Button>}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                {filteredApps.length === 0 && (
                  <div className="text-center py-20 text-muted-foreground">
                    <Inbox className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="font-semibold text-base">No applications yet</p>
                    <p className="text-sm mt-1 mb-5">Browse jobs and hit Apply Now to track them here</p>
                    <Button size="sm" variant="outline" onClick={() => setTab("browse")} className="gap-2"><Search className="w-3.5 h-3.5" /> Browse Jobs</Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ══════════════ JOB ALERTS TAB ══════════════ */}
          {tab === "alerts" && (
            <motion.div key="alerts" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <div className="grid lg:grid-cols-[1fr_360px] gap-6">
                <div className="space-y-5">
                  {/* Master toggle */}
                  <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${alertSettings.enabled ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}><Radar className="w-5 h-5" /></div>
                        <div>
                          <h3 className="font-extrabold">Job Alerts</h3>
                          <p className="text-sm text-muted-foreground">{alertSettings.enabled ? "Actively scanning for jobs nearby" : "Alerts are paused"}</p>
                        </div>
                      </div>
                      <button onClick={() => setAlertSettings((p) => ({ ...p, enabled: !p.enabled }))}
                        className={`relative w-12 h-6 rounded-full transition-colors ${alertSettings.enabled ? "bg-primary" : "bg-border"}`}
                      >
                        <motion.span animate={{ x: alertSettings.enabled ? 26 : 2 }} transition={{ type: "spring", stiffness: 400, damping: 28 }}
                          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm block" />
                      </button>
                    </div>
                    {alertSettings.enabled && (
                      <div className="mt-4 flex items-center gap-2 text-xs text-primary bg-primary/6 rounded-xl px-4 py-2.5 border border-primary/15">
                        <CircleDot className="w-3.5 h-3.5 animate-pulse flex-shrink-0" />
                        Scanning for new jobs within <strong>{alertSettings.radius} miles</strong> of your location in real time.
                      </div>
                    )}
                  </div>

                  {/* Radius */}
                  <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
                    <h3 className="font-extrabold mb-1 flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Search Radius</h3>
                    <p className="text-sm text-muted-foreground mb-4">Get notified for jobs within this distance from you</p>
                    <div className="flex items-center gap-4 mb-3">
                      <input type="range" min={1} max={50} step={1} value={alertSettings.radius}
                        onChange={(e) => setAlertSettings((p) => ({ ...p, radius: Number(e.target.value) }))}
                        className="flex-1 h-2 rounded-full accent-primary cursor-pointer"
                      />
                      <div className="w-20 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="font-extrabold text-primary text-sm">{alertSettings.radius} mi</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground px-0.5">
                      {[1, 5, 10, 25, 50].map((v) => (
                        <button key={v} onClick={() => setAlertSettings((p) => ({ ...p, radius: v }))}
                          className={`px-2 py-1 rounded-full transition-all ${alertSettings.radius === v ? "bg-primary text-white font-bold" : "hover:bg-secondary"}`}
                        >{v} mi</button>
                      ))}
                    </div>
                  </div>

                  {/* Job types */}
                  <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
                    <h3 className="font-extrabold mb-1 flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary" /> Job Types</h3>
                    <p className="text-sm text-muted-foreground mb-4">Only alert me for these job types</p>
                    <div className="flex flex-wrap gap-2">
                      {["full-time", "part-time", "contract", "freelance"].map((t) => {
                        const on = alertSettings.jobTypes.includes(t);
                        return (
                          <button key={t} onClick={() => toggleJobType(t)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${on ? "bg-primary text-white border-primary shadow-sm" : "bg-white border-border/60 text-muted-foreground hover:border-primary/40"}`}
                          >
                            {on && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5" />}{TYPE_LABELS[t]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Keywords */}
                  <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
                    <h3 className="font-extrabold mb-1 flex items-center gap-2"><Search className="w-4 h-4 text-primary" /> Keywords</h3>
                    <p className="text-sm text-muted-foreground mb-3">Alert me when job titles or skills match these keywords</p>
                    <Input value={alertSettings.keywords} onChange={(e) => setAlertSettings((p) => ({ ...p, keywords: e.target.value }))}
                      placeholder="e.g. React, TypeScript, Frontend…" className="bg-secondary/30 border-border/60" />
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {alertSettings.keywords.split(",").map((k) => k.trim()).filter(Boolean).map((k) => (
                        <span key={k} className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">{k}</span>
                      ))}
                    </div>
                  </div>

                  {/* Notification delivery */}
                  <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
                    <h3 className="font-extrabold mb-1 flex items-center gap-2"><Bell className="w-4 h-4 text-primary" /> Notification Delivery</h3>
                    <p className="text-sm text-muted-foreground mb-4">Choose how you want to receive job alerts</p>
                    <div className="space-y-3">
                      {[
                        { key: "emailAlerts" as const, icon: Mail, label: "Email Alerts", sub: "Get a digest of new jobs near you" },
                        { key: "pushAlerts" as const, icon: Smartphone, label: "In-App Alerts", sub: "Live toast notifications while browsing" },
                      ].map(({ key, icon: Icon, label, sub }) => (
                        <div key={key} className="flex items-center justify-between py-2">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground"><Icon className="w-4 h-4" /></div>
                            <div><p className="text-sm font-semibold">{label}</p><p className="text-xs text-muted-foreground">{sub}</p></div>
                          </div>
                          <button onClick={() => setAlertSettings((p) => ({ ...p, [key]: !p[key] }))}
                            className={`relative w-10 h-5 rounded-full transition-colors ${alertSettings[key] ? "bg-primary" : "bg-border"}`}
                          >
                            <motion.span animate={{ x: alertSettings[key] ? 21 : 2 }} transition={{ type: "spring", stiffness: 400, damping: 28 }}
                              className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm block" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button onClick={saveAlerts} className="w-full h-11 rounded-xl font-bold gap-2 shadow-sm shadow-primary/20">
                    {alertSaved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : <><Zap className="w-4 h-4" /> Save Alert Preferences</>}
                  </Button>

                  {/* Saved alerts from API */}
                  {savedAlerts.length > 0 && (
                    <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5">
                      <h3 className="font-extrabold mb-3 text-sm">Saved Alerts ({savedAlerts.length})</h3>
                      <div className="space-y-2">
                        {savedAlerts.map((a) => (
                          <div key={a.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-secondary/20">
                            <div>
                              <p className="text-sm font-semibold">{a.name || a.keywords || "Alert"}</p>
                              <p className="text-xs text-muted-foreground">{a.frequency} · {a.radius}km radius</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${a.paused ? "bg-slate-100 text-slate-600" : "bg-green-100 text-green-600"}`}>
                                {a.paused ? "Paused" : "Active"}
                              </span>
                              <button onClick={() => {
                                const token = localStorage.getItem("jn_token");
                                if (token) fetch(`/api/job-alerts/${a.id}/pause`, { method: "PUT", headers: { Authorization: `Bearer ${token}` } })
                                  .then(() => setSavedAlerts(prev => prev.map(x => x.id === a.id ? { ...x, paused: !x.paused } : x))).catch(() => {});
                              }} className="text-xs text-primary hover:text-primary/80 font-medium">{a.paused ? "Resume" : "Pause"}</button>
                              <button onClick={() => {
                                const token = localStorage.getItem("jn_token");
                                if (token) fetch(`/api/job-alerts/${a.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
                                  .then(() => setSavedAlerts(prev => prev.filter(x => x.id !== a.id))).catch(() => {});
                              }} className="text-xs text-red-500 hover:text-red-600 font-medium">Delete</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Recent alerts feed */}
                <div>
                  <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                      <div><h3 className="font-extrabold">Recent Alerts</h3><p className="text-xs text-muted-foreground mt-0.5">{unreadCount} unread</p></div>
                      {unreadCount > 0 && <button onClick={markAllRead} className="text-xs text-primary font-semibold hover:text-primary/80 transition-colors">Mark all read</button>}
                    </div>
                    <div className="divide-y divide-border/40 max-h-[640px] overflow-y-auto">
                      {notifications.map((n) => (
                        <motion.button key={n.id} layout onClick={() => markRead(n.id)}
                          className={`w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-secondary/40 transition-colors ${!n.read ? "bg-primary/4" : ""}`}
                        >
                          <div className={`w-10 h-10 rounded-xl ${n.logoColor ?? "bg-secondary"} flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0`}>{n.logo ?? "?"}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">{notifIcon(n.type)}<p className="text-xs font-bold truncate">{n.title}</p>{!n.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 ml-auto" />}</div>
                            <p className="text-xs text-muted-foreground leading-snug">{n.body}</p>
                            <div className="flex items-center gap-3 mt-1.5">
                              {n.distance && <span className="text-[10px] text-primary font-semibold flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{n.distance}</span>}
                              <span className="text-[10px] text-muted-foreground">{n.time}</span>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                      {notifications.length === 0 && (
                        <div className="py-16 text-center text-muted-foreground">
                          <BellOff className="w-10 h-10 mx-auto mb-3 opacity-20" />
                          <p className="font-semibold text-sm">No alerts yet</p>
                          <p className="text-xs mt-1">Enable alerts above to start receiving job notifications</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ══════════════ PROFILE TAB ══════════════ */}
          {tab === "profile" && (
            <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} className="space-y-6">

              {/* ── Welcome banner ── */}
              <div className="bg-gradient-to-r from-primary/90 to-yellow-400 rounded-2xl p-6 flex items-center justify-between overflow-hidden relative">
                <div className="absolute right-0 top-0 w-48 h-48 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/4" />
                <div className="absolute right-24 bottom-0 w-24 h-24 rounded-full bg-white/10 translate-y-1/2" />
                <div className="relative">
                  <p className="text-yellow-900/70 text-sm font-medium mb-1">Good morning</p>
                  <h1 className="text-2xl font-extrabold text-yellow-950">Hi, {user?.fullName?.split(" ")[0] ?? "there"}!</h1>
                  <p className="text-yellow-900/70 text-sm mt-1">
                    {applications.filter(a => a.status !== "rejected").length} active application{applications.filter(a => a.status !== "rejected").length !== 1 ? "s" : ""} · {unreadCount > 0 ? `${unreadCount} new alert${unreadCount !== 1 ? "s" : ""}` : "all caught up"}
                  </p>
                </div>
                <div className="relative hidden md:flex items-center gap-6 text-yellow-950">
                  {[
                    { icon: Briefcase,   label: "Jobs nearby",   value: "24" },
                    { icon: TrendingUp,  label: "Applications",  value: String(applications.length) },
                    { icon: Radar,       label: "Alerts active", value: alertSettings.enabled ? "On" : "Off" },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="text-center">
                      <div className="w-10 h-10 rounded-xl bg-white/25 flex items-center justify-center mx-auto mb-1"><Icon className="w-5 h-5" /></div>
                      <p className="text-xl font-extrabold leading-none">{value}</p>
                      <p className="text-xs text-yellow-900/60 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Stats Cards ── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Briefcase,     label: "Applied Jobs",  value: dashStats.appliedJobs  || applications.length,              growth: "+2 this week", color: "text-blue-600",   bg: "bg-blue-50" },
                  { icon: Bookmark,      label: "Saved Jobs",    value: dashStats.savedJobs    || saved.size,                        growth: "+1 this week", color: "text-violet-600", bg: "bg-violet-50" },
                  { icon: CalendarClock, label: "Interviews",    value: dashStats.interviews   || (appCounts["interview"] ?? 0),     growth: "+1 this week", color: "text-amber-600",  bg: "bg-amber-50" },
                  { icon: Eye,           label: "Profile Views", value: dashStats.profileViews || 12,                                growth: "+3 this week", color: "text-green-600",  bg: "bg-green-50" },
                ].map(({ icon: Icon, label, value, growth, color, bg }) => (
                  <div key={label} className="bg-white rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow p-5">
                    <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}><Icon className={`w-5 h-5 ${color}`} /></div>
                    <p className="text-3xl font-extrabold">{value}</p>
                    <p className="text-sm text-muted-foreground mt-0.5 font-medium">{label}</p>
                    <p className="text-xs text-green-600 font-semibold mt-1">{growth}</p>
                  </div>
                ))}
              </div>

              {/* Resume card */}
              <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6">
                <h3 className="font-extrabold mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-primary" /> My Resume</h3>
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-14 h-16 rounded-xl bg-red-50 border-2 border-red-200 flex flex-col items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-red-500 mb-0.5" />
                    <span className="text-[10px] font-bold text-red-500">PDF</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold">MyResume_2026.pdf</p>
                    <p className="text-sm text-muted-foreground mt-0.5">Last updated: Jul 10, 2026</p>
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-muted-foreground">Resume Score</span>
                        <span className="text-xs font-bold text-green-600">78 / 100</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: "78%" }} transition={{ duration: 0.8, ease: "easeOut" }} className="h-full bg-green-500 rounded-full" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Good score! Add certifications and portfolio links to reach 90+</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <Button size="sm" className="gap-2 h-9 rounded-xl"><Upload className="w-3.5 h-3.5" /> Upload New Resume</Button>
                  <Button size="sm" variant="outline" className="gap-2 h-9 rounded-xl"><Download className="w-3.5 h-3.5" /> Download Resume</Button>
                </div>
              </div>

              {/* Profile Completion */}
              <ProfileCompletion />

              {/* Personal Info */}
              <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6">
                <h3 className="font-extrabold mb-4 flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Personal Information</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: "Full Name", value: user?.fullName ?? "—" },
                    { label: "Email", value: user?.email ?? "—" },
                    { label: "Location", value: "San Francisco, CA" },
                    { label: "Phone", value: "+1 (555) 000-0000" },
                    { label: "Experience", value: "3 years" },
                    { label: "Job Type", value: "Full-time, Contract" },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl bg-secondary/30 px-4 py-3">
                      <p className="text-xs text-muted-foreground font-medium mb-0.5">{label}</p>
                      <p className="text-sm font-semibold">{value}</p>
                    </div>
                  ))}
                </div>
                <Button size="sm" variant="outline" className="mt-4 gap-2 h-9 rounded-xl"><ExternalLink className="w-3.5 h-3.5" /> Edit Profile</Button>
              </div>

              {/* Skills */}
              <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-6">
                <h3 className="font-extrabold mb-4 flex items-center gap-2"><Star className="w-4 h-4 text-primary" /> Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {["React", "TypeScript", "Tailwind CSS", "Node.js", "GraphQL", "Figma", "Git", "AWS"].map((skill) => (
                    <span key={skill} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20">{skill}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
