import { useState, useEffect, lazy, Suspense, useRef, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  MapPin, Briefcase, Globe, Search, ChevronDown,
  LogOut, Bell, Bookmark, FileText, Settings2, Users,
  Zap, Shield, Target, Twitter, Linkedin, Github, Loader2,
  Building2, UserCircle, DollarSign, Filter, X,
  Bot, Send, Star, Clock, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { getUser, clearSession, type AuthUser } from "@/lib/api";
import type { CategoryLegendItem } from "@/components/JobMap";
import { jobsApi, type Job as ApiJob } from "@/api/jobs";

const JobMap = lazy(() => import("@/components/JobMap"));

/* ─── Nav items ──────────────────────────────────────────────── */
const PUBLIC_NAV = [
  { label: "Home", href: "/" },
  { label: "Browse Jobs", href: "/explore" },
  { label: "About", href: "#about" },
];
const SEEKER_NAV = [
  { label: "Home", href: "/" },
];
const LANGUAGES = ["EN", "FR", "ES", "DE", "AR"];

/* ─── Home page constants ─────────────────────────────────────── */
const QUICK_FILTERS = ["Full Time", "Part Time", "Internship", "Remote", "Fresher", "Nearby", "High Salary", "Recently Posted"];

const HOME_MOCK_JOBS = [
  { id: "h1", title: "Frontend Developer",   company: "TechHub SF",   type: "Full-time", location: "San Francisco, CA", salary: "$90k–$120k",  distKm: 1.5,  logo: "TH", logoColor: "bg-blue-500" },
  { id: "h2", title: "UX Designer",          company: "DesignCo",     type: "Contract",  location: "San Francisco, CA", salary: "$75k–$95k",   distKm: 2.1,  logo: "DC", logoColor: "bg-purple-500" },
  { id: "h3", title: "Product Manager",      company: "GrowthLabs",   type: "Full-time", location: "Oakland, CA",       salary: "$110k–$140k", distKm: 3.8,  logo: "GL", logoColor: "bg-green-500" },
  { id: "h4", title: "Backend Engineer",     company: "DataStream",   type: "Part-time", location: "San Francisco, CA", salary: "$70k–$90k",   distKm: 4.9,  logo: "DS", logoColor: "bg-orange-500" },
  { id: "h5", title: "Marketing Specialist", company: "BrandForward", type: "Full-time", location: "San Francisco, CA", salary: "$60k–$80k",   distKm: 7.2,  logo: "BF", logoColor: "bg-pink-500" },
  { id: "h6", title: "DevOps Engineer",      company: "CloudBase",    type: "Contract",  location: "Remote / SF",       salary: "$100k–$130k", distKm: 9.5,  logo: "CB", logoColor: "bg-cyan-500" },
];

const HOME_COMPANIES = [
  { name: "Google",   logo: "Go", color: "bg-blue-500",   positions: 42, rating: 4.8 },
  { name: "Stripe",   logo: "St", color: "bg-violet-500", positions: 18, rating: 4.6 },
  { name: "Figma",    logo: "Fi", color: "bg-pink-500",   positions: 11, rating: 4.5 },
  { name: "Vercel",   logo: "Ve", color: "bg-slate-800",  positions: 7,  rating: 4.7 },
  { name: "Notion",   logo: "No", color: "bg-gray-700",   positions: 9,  rating: 4.4 },
  { name: "Linear",   logo: "Li", color: "bg-indigo-500", positions: 5,  rating: 4.9 },
  { name: "Supabase", logo: "Su", color: "bg-green-500",  positions: 14, rating: 4.6 },
];

const AI_RESPONSES: Record<string, string> = {
  "Find jobs near me": "I found 5 jobs near you! Top picks: Frontend Developer at TechHub SF (1.5km) and UX Designer at DesignCo (2.1km). Scroll down to browse them!",
  "Improve my resume": "3 quick tips: 1) Add quantifiable achievements (e.g. 'Increased performance by 40%'). 2) Include keywords from job descriptions. 3) Add a skills section with your top 6-8 technical skills.",
  "Interview tips": "Top interview tips: 1) Research the company thoroughly. 2) Prepare STAR-method answers. 3) Ask thoughtful questions. 4) Follow up with a thank-you email within 24 hours.",
  "Suggest careers": "Based on your profile, great paths include: Senior Frontend Engineer, Full-Stack Developer, UI Engineer, or Frontend Architect. Market demand for these is very high right now!",
};

const COMPANY_COLORS = ["bg-blue-500","bg-violet-500","bg-green-500","bg-orange-500","bg-pink-500","bg-cyan-500","bg-indigo-500","bg-rose-500"];

interface HomeJob {
  id: string; title: string; company: string;
  logo: string; logoColor: string;
  salary?: string; type: string; location: string; distKm?: number;
}


/* ─── Globe / language menu ──────────────────────────────────── */
function GlobeMenu({ lang, setLang }: { lang: string; setLang: (l: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} title="Language"
        className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">
        <Globe className="w-[18px] h-[18px]" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }} transition={{ duration: 0.12 }}
            className="absolute right-0 top-11 bg-white rounded-xl shadow-lg border border-border/60 py-1 w-24 z-50">
            {LANGUAGES.map(l => (
              <button key={l} onClick={() => { setLang(l); setOpen(false); }}
                className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${lang === l ? "text-primary bg-primary/5" : "text-foreground hover:bg-secondary"}`}>
                {l}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Profile dropdown ───────────────────────────────────────── */
const PROFILE_ITEMS = [
  { icon: UserCircle, label: "My Profile",    href: "/profile" },
  { icon: FileText,   label: "Applied Jobs",  href: "/applied-jobs" },
  { icon: Bookmark,   label: "Saved Jobs",    href: "/saved-jobs" },
  { icon: Settings2,  label: "Settings",      href: "/profile" },
];

function ProfileMenu({ user, navigate }: { user: AuthUser; navigate: (p: string) => void }) {
  const [open, setOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirmLogout(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const handleLogout = () => { clearSession(); window.location.href = "/"; };
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => { setOpen(o => !o); setConfirmLogout(false); }}
        className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm hover:bg-primary/25 transition-colors">
        {user.fullName?.[0]?.toUpperCase() ?? "U"}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }} transition={{ duration: 0.12 }}
            className="absolute right-0 top-11 bg-white rounded-xl shadow-lg border border-border/60 py-1 w-56 z-50">
            <div className="px-4 py-3 border-b border-border/40">
              <p className="text-sm font-bold text-foreground truncate">{user.fullName}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            {PROFILE_ITEMS.map(({ icon: Icon, label, href }) => (
              <button key={label} onClick={() => { navigate(href); setOpen(false); setConfirmLogout(false); }}
                className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-secondary flex items-center gap-3 transition-colors">
                <Icon className="w-4 h-4 text-muted-foreground" />{label}
              </button>
            ))}
            <div className="border-t border-border/40 mt-1">
              {confirmLogout ? (
                <div className="px-4 py-3">
                  <p className="text-xs text-muted-foreground mb-2.5 font-medium">Are you sure you want to log out?</p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmLogout(false)}
                      className="flex-1 py-1.5 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-secondary transition-colors">
                      Cancel
                    </button>
                    <button onClick={handleLogout}
                      className="flex-1 py-1.5 rounded-lg bg-destructive text-white text-xs font-semibold hover:bg-destructive/90 transition-colors">
                      Log Out
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirmLogout(true)}
                  className="w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 flex items-center gap-3 transition-colors">
                  <LogOut className="w-4 h-4" />Logout
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Notification bell ──────────────────────────────────────── */
function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} title="Notifications"
        className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors relative">
        <Bell className="w-[18px] h-[18px]" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary border-2 border-white" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 6, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }} transition={{ duration: 0.12 }}
            className="absolute right-0 top-11 bg-white rounded-xl shadow-lg border border-border/60 w-80 z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
              <p className="text-sm font-bold">Notifications</p>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">0 new</span>
            </div>
            <div className="py-12 flex flex-col items-center text-center px-6">
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-semibold text-foreground">No new notifications</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                We'll let you know when new jobs matching your profile are posted nearby.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Stats section ──────────────────────────────────────────── */
const STATS = [
  { value: "10,000+", label: "Active Jobs" },
  { value: "2,500+", label: "Employers" },
  { value: "50+", label: "Cities" },
  { value: "100,000+", label: "Applications" },
];

function StatsSection() {
  return (
    <section className="py-20 bg-white relative z-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {STATS.map((s, i) => (
            <motion.div key={s.label} initial={{ y: 30, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="text-center p-6 rounded-2xl bg-primary/5 border border-primary/10">
              <p className="text-3xl font-extrabold text-primary mb-1">{s.value}</p>
              <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Why Choose section ─────────────────────────────────────── */
const WHY_FEATURES = [
  { icon: MapPin, title: "Location-Based Search", desc: "Find jobs near your current location." },
  { icon: Zap, title: "Quick Apply", desc: "Apply to jobs in seconds." },
  { icon: Shield, title: "Verified Companies", desc: "Only trusted and verified employers." },
  { icon: Target, title: "Radius-Based Matching", desc: "Jobs filtered based on your selected radius." },
];

function WhyChooseSection() {
  return (
    <section className="py-24 bg-background relative z-10">
      <div className="absolute inset-0 bg-primary/3 -skew-y-2 transform origin-top-left z-0" />
      <div className="container mx-auto px-4 relative z-10">
        <motion.div initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            Why Choose <span className="text-primary">JobNearby?</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Built for local job markets — fast, verified, and radius-aware.</p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {WHY_FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <motion.div key={title} initial={{ y: 30, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="bg-white/70 backdrop-blur-sm border border-white/60 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-foreground mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works section ───────────────────────────────────── */
const HOW_SEEKER = [{ n: 1, label: "Set Location" }, { n: 2, label: "Browse Nearby Jobs" }, { n: 3, label: "Apply Instantly" }];
const HOW_RECRUITER = [{ n: 1, label: "Post Job" }, { n: 2, label: "Receive Applications" }, { n: 3, label: "Hire Local Talent" }];

function HowItWorksSection() {
  return (
    <section className="py-24 bg-white relative z-10">
      <div className="container mx-auto px-4">
        <motion.div initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            How <span className="text-primary">JobNearby</span> Works
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Simple steps for seekers and recruiters alike.</p>
        </motion.div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <motion.div initial={{ x: -30, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} viewport={{ once: true }}
            className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl p-8 border border-primary/15">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-extrabold text-lg">For Job Seekers</h3>
            </div>
            <div className="space-y-4">
              {HOW_SEEKER.map(({ n, label }) => (
                <div key={n} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{n}</div>
                  <p className="font-medium">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div initial={{ x: 30, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} viewport={{ once: true }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-extrabold text-lg">For Recruiters</h3>
            </div>
            <div className="space-y-4">
              {HOW_RECRUITER.map(({ n, label }) => (
                <div key={n} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{n}</div>
                  <p className="font-medium">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── CTA section ────────────────────────────────────────────── */
function CTASection({ navigate }: { navigate: (p: string) => void }) {
  return (
    <section className="py-24 bg-primary relative overflow-hidden z-10">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.div initial={{ y: 30, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }}>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Ready to find your next opportunity?
          </h2>
          <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
            Join thousands of job seekers and top employers on JobNearby.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate("/explore")} size="lg"
              className="bg-white text-primary hover:bg-white/90 font-bold px-10 rounded-full shadow-lg">
              Find Jobs
            </Button>
            <Button onClick={() => navigate("/auth")} size="lg" variant="outline"
              className="border-white/50 text-white hover:bg-white/10 font-bold px-10 rounded-full">
              Post a Job
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Footer ─────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="bg-white border-t py-12 relative z-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <span className="font-bold text-lg tracking-tight">JobNearby</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground font-medium">
            <Link href="/about" className="hover:text-primary transition-colors">About</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
          </div>
          <div className="flex items-center gap-4 text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors"><Linkedin className="w-5 h-5" /></a>
            <a href="#" className="hover:text-primary transition-colors"><Twitter className="w-5 h-5" /></a>
            <a href="#" className="hover:text-primary transition-colors"><Github className="w-5 h-5" /></a>
          </div>
        </div>
        <div className="text-center text-sm text-muted-foreground mt-8">
          &copy; {new Date().getFullYear()} JobNearby. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

/* ─── Search bar (shared) ────────────────────────────────────── */
function SearchBar({ onSubmit }: { onSubmit: (job: string, location: string) => void }) {
  const [jobQ, setJobQ] = useState("");
  const [locQ, setLocQ] = useState("");
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(jobQ, locQ); }}
      className="max-w-3xl mx-auto bg-white/85 backdrop-blur-md border border-white/60 shadow-xl rounded-2xl overflow-hidden hover:shadow-2xl hover:bg-white/95 transition-all">
      <div className="flex items-stretch">
        <div className="flex items-center gap-3 flex-1 px-5 py-4 min-w-0">
          <Briefcase className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-0.5">What</span>
            <input type="text" value={jobQ} onChange={e => setJobQ(e.target.value)}
              placeholder="Job title, keywords, or company"
              className="bg-transparent border-none outline-none text-sm font-medium text-foreground placeholder:text-muted-foreground/50 w-full" />
          </div>
        </div>
        <div className="w-px bg-border/50 my-3 flex-shrink-0" />
        <div className="flex items-center gap-3 flex-1 px-5 py-4 min-w-0">
          <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-0.5">Where</span>
            <input type="text" value={locQ} onChange={e => setLocQ(e.target.value)}
              placeholder="City, state, or zip code"
              className="bg-transparent border-none outline-none text-sm font-medium text-foreground placeholder:text-muted-foreground/50 w-full" />
          </div>
        </div>
        <div className="flex items-center pr-3 pl-2 flex-shrink-0">
          <Button type="submit" className="h-11 px-7 rounded-xl text-sm font-semibold gap-2">
            <Search className="w-4 h-4" /> Explore Map
          </Button>
        </div>
      </div>
    </form>
  );
}

/* ─── Authenticated seeker home ──────────────────────────────── */
function AuthenticatedSeekerHome({ user, navigate }: { user: AuthUser; navigate: (p: string) => void }) {
  const [lang, setLang] = useState("EN");
  const [radius, setRadius] = useState([25]);
  const [categories, setCategories] = useState<CategoryLegendItem[]>([]);
  const [browseJobs, setBrowseJobs] = useState<ApiJob[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [browseSearch, setBrowseSearch] = useState("");
  // Quick filters
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);
  // Nearby radius + jobs from real API
  const [nearbyRadius, setNearbyRadius] = useState(5);
  const [nearbyJobs, setNearbyJobs] = useState<HomeJob[]>(HOME_MOCK_JOBS);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  // Recently viewed — persisted in localStorage
  const [recentlyViewed, setRecentlyViewed] = useState<HomeJob[]>([]);
  // AI bot
  const [showAI, setShowAI] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Hi! I'm your AI Career Assistant. Ask me to find jobs, improve your resume, or prep for interviews! 🚀" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch all jobs for browse section
  useEffect(() => {
    setBrowseLoading(true);
    jobsApi.list().then(res => setBrowseJobs(res.jobs ?? [])).catch(() => {}).finally(() => setBrowseLoading(false));
  }, []);

  // Load recently viewed from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("jn_recently_viewed");
      if (stored) setRecentlyViewed(JSON.parse(stored));
    } catch {}
  }, []);

  // Fetch nearby jobs using browser geolocation → real API
  useEffect(() => {
    if (!navigator.geolocation) return;
    setNearbyLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        jobsApi.nearby({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          radius: nearbyRadius,
        }).then(res => {
          if (res.jobs?.length) {
            setNearbyJobs(res.jobs.map((j, idx) => ({
              id: j._id,
              title: j.title,
              company: j.company,
              logo: j.company.slice(0, 2).toUpperCase(),
              logoColor: COMPANY_COLORS[idx % COMPANY_COLORS.length],
              salary: j.salary,
              type: j.type,
              location: j.location,
              distKm: j.distance,
            })));
          }
        }).catch(() => {}).finally(() => setNearbyLoading(false));
      },
      () => setNearbyLoading(false),
      { timeout: 6000 }
    );
  }, [nearbyRadius]);

  useEffect(() => {
    if (showAI) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, showAI]);

  const handleSearch = (jobQ: string, locQ: string) => {
    const p = new URLSearchParams();
    if (jobQ) p.set("q", jobQ);
    if (locQ) p.set("location", locQ);
    navigate(`/explore?${p.toString()}`);
  };

  const scrollToBrowse = () => {
    document.getElementById("browse-jobs")?.scrollIntoView({ behavior: "smooth" });
  };

  // Browse jobs filtered by search + active quick filter
  const filtered = browseJobs.filter(j => {
    const q = browseSearch.toLowerCase();
    const matchesSearch = !browseSearch || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q);
    let matchesFilter = true;
    if (activeQuickFilter) {
      if (activeQuickFilter === "Full Time")   matchesFilter = j.type === "full-time";
      else if (activeQuickFilter === "Part Time")   matchesFilter = j.type === "part-time";
      else if (activeQuickFilter === "Contract")    matchesFilter = j.type === "contract";
      else if (activeQuickFilter === "Remote")      matchesFilter = j.location.toLowerCase().includes("remote");
      else if (activeQuickFilter === "Internship")  matchesFilter = j.type.includes("intern") || j.title.toLowerCase().includes("intern");
      else if (activeQuickFilter === "Fresher")     matchesFilter = j.title.toLowerCase().includes("junior") || j.title.toLowerCase().includes("entry") || j.title.toLowerCase().includes("fresher");
    }
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    if (activeQuickFilter === "Recently Posted") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (activeQuickFilter === "High Salary") {
      const parse = (s?: string) => parseInt((s ?? "0").replace(/[^0-9]/g, "").slice(0, 6) || "0");
      return parse(b.salary) - parse(a.salary);
    }
    return 0;
  });

  // Companies derived from real job data (fallback to static list)
  const companiesDerived = useMemo(() => {
    if (!browseJobs.length) return HOME_COMPANIES;
    const map = new Map<string, { name: string; logo: string; color: string; positions: number; rating: number }>();
    browseJobs.forEach(job => {
      if (!map.has(job.company)) {
        map.set(job.company, {
          name: job.company,
          logo: job.company.slice(0, 2).toUpperCase(),
          color: COMPANY_COLORS[map.size % COMPANY_COLORS.length],
          positions: 0,
          rating: parseFloat((4.0 + (map.size % 10) * 0.1).toFixed(1)),
        });
      }
      map.get(job.company)!.positions++;
    });
    return Array.from(map.values()).sort((a, b) => b.positions - a.positions).slice(0, 8);
  }, [browseJobs]);

  const sendAIMessage = (text: string) => {
    if (!text.trim()) return;
    setChatMessages(p => [...p, { role: "user", text }]);
    setChatInput("");
    const response = AI_RESPONSES[text] ?? "Great question! I'm analyzing your profile and will have personalized recommendations shortly. Meanwhile, scroll down to browse recommended jobs!";
    setTimeout(() => setChatMessages(p => [...p, { role: "ai", text: response }]), 700);
  };

  const viewJob = (job: HomeJob) => {
    setRecentlyViewed(prev => {
      const next = [job, ...prev.filter(j => j.id !== job.id)].slice(0, 8);
      try { localStorage.setItem("jn_recently_viewed", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">

      {/* ── AI Floating Button ── */}
      <button onClick={() => setShowAI(p => !p)}
        className="fixed bottom-6 right-6 z-[60] w-14 h-14 rounded-full bg-primary text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-transform">
        <Bot className="w-6 h-6" />
      </button>

      {/* ── AI Chat Panel ── */}
      <AnimatePresence>
        {showAI && (
          <motion.div initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-6 bottom-0 w-80 md:w-96 rounded-t-2xl shadow-2xl bg-white z-[60] flex flex-col overflow-hidden border border-border/60"
            style={{ maxHeight: "70vh" }}>
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
                {Object.keys(AI_RESPONSES).map(chip => (
                  <button key={chip} onClick={() => sendAIMessage(chip)}
                    className="px-2.5 py-1 rounded-full bg-primary/8 text-primary text-xs font-medium border border-primary/20 hover:bg-primary/15 transition-colors">
                    {chip}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendAIMessage(chatInput)}
                  placeholder="Ask me anything…" className="flex-1 h-9 text-sm bg-secondary/30 border-border/60" />
                <Button size="sm" onClick={() => sendAIMessage(chatInput)} className="h-9 w-9 p-0 rounded-xl"><Send className="w-4 h-4" /></Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border/40 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <MapPin className="w-6 h-6 text-primary" />
            <span className="font-extrabold text-xl tracking-tight">JobNearby</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {SEEKER_NAV.map(({ label, href }) => (
              <Link key={label} href={href} className="text-muted-foreground hover:text-foreground transition-colors">{label}</Link>
            ))}
            <button onClick={scrollToBrowse} className="text-muted-foreground hover:text-foreground transition-colors font-medium">
              Browse Jobs
            </button>
          </nav>
          <div className="flex items-center gap-2">
            <GlobeMenu lang={lang} setLang={setLang} />
            <NotificationBell />
            <ProfileMenu user={user} navigate={navigate} />
          </div>
        </div>
      </header>

      {/* Map section */}
      <section className="relative w-full h-screen min-h-[600px] flex flex-col overflow-hidden">
        <Suspense fallback={<div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-slate-200" />}>
          <JobMap radius={radius[0]} onCategoriesChange={setCategories} />
        </Suspense>
        <div className="absolute inset-0 z-[1] pointer-events-none"
          style={{ background: "linear-gradient(to bottom, rgba(248,250,252,0.72) 0%, rgba(248,250,252,0.45) 40%, rgba(248,250,252,0.15) 70%, transparent 100%)" }} />
        <div className="container mx-auto px-4 z-10 relative pt-10">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="max-w-2xl mx-auto text-center mb-6">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
              Welcome back, {user.fullName.split(" ")[0]}! 👋
            </h2>
            <p className="text-muted-foreground">Find your next opportunity on the map.</p>
          </motion.div>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }} className="mb-8">
            <SearchBar onSubmit={handleSearch} />
          </motion.div>
        </div>
        <div className="absolute bottom-8 left-0 right-0 px-4 md:px-8 z-10 flex flex-col md:flex-row justify-between items-end gap-4 pointer-events-none">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.8 }}
            className="bg-white/70 backdrop-blur-sm border border-white/50 p-4 rounded-2xl shadow-lg pointer-events-auto w-full md:w-auto">
            <h3 className="font-semibold mb-3 text-sm">Job Categories</h3>
            {categories.length === 0
              ? <p className="text-xs text-muted-foreground">No jobs in this area yet</p>
              : <div className="space-y-2 text-sm">{categories.map(cat => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    <span>{cat.name}</span>
                  </div>
                ))}</div>}
          </motion.div>
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.9 }}
            className="bg-white/70 backdrop-blur-sm border border-white/50 p-6 rounded-2xl shadow-lg pointer-events-auto w-full md:w-[320px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm flex items-center gap-2"><Filter className="w-4 h-4" /> Search Radius</h3>
              <span className="text-primary font-bold">{radius[0]} km</span>
            </div>
            <Slider defaultValue={[25]} max={50} min={5} step={5} value={radius} onValueChange={setRadius} className="mb-6" />
            <div className="flex justify-between text-xs text-muted-foreground"><span>5km</span><span>25km</span><span>50km</span></div>
          </motion.div>
        </div>
      </section>

      {/* ── Quick Filters (below map) ── */}
      <section className="pt-12 pb-4 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-lg font-extrabold mb-4 flex items-center gap-2"><Filter className="w-4 h-4 text-primary" /> Quick Filters</h2>
          <div className="flex flex-wrap gap-2">
            {QUICK_FILTERS.map(f => (
              <button key={f} onClick={() => setActiveQuickFilter(activeQuickFilter === f ? null : f)}
                className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${activeQuickFilter === f ? "bg-primary text-white border-primary shadow-sm" : "bg-white text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Jobs Near You (below map) ── */}
      <section className="py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <h2 className="text-xl font-extrabold flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> Jobs Near You</h2>
            <div className="flex gap-1">
              {[2, 5, 10].map(km => (
                <button key={km} onClick={() => setNearbyRadius(km)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${nearbyRadius === km ? "bg-primary text-white border-primary" : "bg-white border-border/60 text-muted-foreground hover:border-primary/40"}`}>
                  {km} km
                </button>
              ))}
            </div>
          </div>
          {nearbyLoading ? (
            <div className="py-10 text-center text-muted-foreground">
              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin opacity-30" />
              <p className="text-sm">Finding jobs near you…</p>
            </div>
          ) : nearbyJobs.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <MapPin className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="font-semibold">No jobs within {nearbyRadius}km</p>
              <p className="text-sm mt-1">Try increasing the radius</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nearbyJobs.map((job, i) => (
                <motion.div key={job.id} initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  onClick={() => viewJob(job)}
                  className="bg-white border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl ${job.logoColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                      {job.logo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm group-hover:text-primary transition-colors truncate">{job.title}</p>
                      <p className="text-xs text-muted-foreground">{job.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-muted-foreground">{job.type}</span>
                    {job.distKm != null && <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><MapPin className="w-2.5 h-2.5" />{job.distKm.toFixed(1)} km away</span>}
                    {job.salary && <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><DollarSign className="w-2.5 h-2.5" />{job.salary}</span>}
                  </div>
                  <Button size="sm" className="w-full h-8 text-xs font-semibold mt-4">Apply Now</Button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Recently Viewed (below map) ── */}
      <section className="py-10 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-extrabold mb-5 flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Recently Viewed</h2>
          {recentlyViewed.length === 0 ? (
            <div className="bg-white rounded-2xl border border-border/50 shadow-sm py-12 text-center text-muted-foreground">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-semibold">No recently viewed jobs</p>
              <p className="text-sm mt-1">Click on any job card to track your history here</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {recentlyViewed.map(job => (
                <div key={job.id} className="bg-white rounded-xl border border-border/50 shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-9 h-9 rounded-lg ${job.logoColor} flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0`}>{job.logo}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{job.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{job.company}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> Just now</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Companies Hiring Near You (below map) ── */}
      <section className="py-10 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-xl font-extrabold mb-5 flex items-center gap-2"><Building2 className="w-5 h-5 text-primary" /> Companies Hiring Near You</h2>
          <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
            {companiesDerived.map(co => (
              <div key={co.name} className="bg-white rounded-xl border border-border/50 shadow-sm p-4 flex flex-col items-center gap-2 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer flex-shrink-0 w-32">
                <div className={`w-12 h-12 rounded-xl ${co.color} flex items-center justify-center text-white text-sm font-extrabold`}>{co.logo}</div>
                <p className="text-xs font-bold text-center">{co.name}</p>
                <p className="text-xs text-muted-foreground">{co.positions} open</p>
                <div className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400 fill-amber-400" /><span className="text-xs text-muted-foreground">{co.rating}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Browse Jobs section ── */}
      <section id="browse-jobs" className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> Browse Jobs</h2>
              <p className="text-muted-foreground text-sm mt-1">All available listings</p>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={browseSearch} onChange={e => setBrowseSearch(e.target.value)}
                placeholder="Search jobs…"
                className="pl-9 h-9 w-56 rounded-full bg-secondary border-0 shadow-none text-sm" />
              {browseSearch && (
                <button onClick={() => setBrowseSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
          {browseLoading ? (
            <div className="py-16 text-center text-muted-foreground">
              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin opacity-30" />
              <p className="text-sm">Loading jobs…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-medium">{browseSearch ? "No jobs match your search" : "No jobs available yet"}</p>
              <p className="text-sm mt-1 opacity-70">Recruiters will post jobs here.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((job, i) => (
                <motion.div key={job._id} initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                  className="bg-white/70 backdrop-blur-sm border border-white/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                      {job.company.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">{job.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{job.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-muted-foreground">{job.type}</span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><MapPin className="w-2.5 h-2.5" />{job.location}</span>
                    {job.salary && <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><DollarSign className="w-2.5 h-2.5" />{job.salary}</span>}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {job.skills?.slice(0, 3).map(s => (
                      <span key={s} className="px-1.5 py-0.5 bg-secondary rounded text-[10px] text-muted-foreground">{s}</span>
                    ))}
                  </div>
                  <Button size="sm" className="w-full h-8 text-xs font-semibold mt-4">Apply Now</Button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

/* ─── Marketing home (before login) ─────────────────────────── */
function MarketingHome({ navigate }: { navigate: (p: string) => void }) {
  const [lang, setLang] = useState("EN");
  const [radius, setRadius] = useState([25]);
  const [categories, setCategories] = useState<CategoryLegendItem[]>([]);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 520], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 520], [1, 0.88]);
  const heroY = useTransform(scrollY, [0, 520], [0, -80]);
  const navbarY = useTransform(scrollY, [300, 480], [-72, 0]);
  const navbarOpacity = useTransform(scrollY, [300, 480], [0, 1]);

  const handleSearch = (jobQ: string, locQ: string) => {
    const p = new URLSearchParams();
    if (jobQ) p.set("q", jobQ);
    if (locQ) p.set("location", locQ);
    navigate(`/explore?${p.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">

      {/* Scroll-driven navbar */}
      <motion.header style={{ y: navbarY, opacity: navbarOpacity }}
        className="fixed top-0 left-0 right-0 z-50 w-full backdrop-blur-md bg-white/80 border-b border-white/40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-6 h-6 text-primary" />
            <span className="font-extrabold text-xl tracking-tight">JobNearby</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {PUBLIC_NAV.map(({ label, href }) => (
              <Link key={label} href={href} className="text-muted-foreground hover:text-foreground transition-colors">{label}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <GlobeMenu lang={lang} setLang={setLang} />
            <Button variant="outline" className="hidden sm:inline-flex rounded-full" onClick={() => navigate("/auth")}>Sign In</Button>
            <Button className="rounded-full" onClick={() => navigate("/auth")}>Get Started</Button>
          </div>
        </div>
      </motion.header>

      {/* Fixed hero */}
      <motion.section style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        className="fixed inset-0 z-40 flex flex-col items-center justify-center pointer-events-none select-none" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_40%,_#fef9c3_0%,_#f8fafc_60%)]" />
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(circle, #cbd5e1 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <motion.div animate={{ scale: [1, 1.08, 1], opacity: [0.25, 0.4, 0.25] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[520px] h-[520px] rounded-full bg-primary/30 blur-[100px]" />
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative z-10 text-center px-6">
          <div className="flex items-center justify-center mb-6">
            <MapPin className="w-10 h-10 text-primary" strokeWidth={2.5} />
          </div>
          <h1 className="text-7xl sm:text-8xl md:text-9xl font-extrabold tracking-tighter leading-none text-foreground">
            Job<span className="text-primary">Nearby</span>
          </h1>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.6 }}
            className="mt-6 text-lg md:text-xl text-muted-foreground font-medium max-w-md mx-auto">
            Connecting talent with opportunity — right in your neighbourhood.
          </motion.p>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          className="absolute bottom-12 flex flex-col items-center gap-2 text-muted-foreground">
          <span className="text-xs font-medium tracking-widest uppercase">Scroll to explore</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}>
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </motion.section>

      <div className="h-screen" aria-hidden />

      <main className="flex-1 relative z-10 bg-background">

        {/* Map + search section */}
        <section className="relative w-full h-screen min-h-[600px] flex flex-col overflow-hidden">
          <Suspense fallback={<div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-slate-200" />}>
            <JobMap radius={radius[0]} onCategoriesChange={setCategories} />
          </Suspense>
          <div className="absolute inset-0 z-[1] pointer-events-none"
            style={{ background: "linear-gradient(to bottom, rgba(248,250,252,0.72) 0%, rgba(248,250,252,0.45) 40%, rgba(248,250,252,0.15) 70%, transparent 100%)" }} />
          <div className="container mx-auto px-4 z-10 relative pt-16">
            <motion.div initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }}
              className="max-w-2xl mx-auto text-center mb-8">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Find Jobs Near You</h2>
              <p className="text-muted-foreground text-lg">Connect with local opportunities within your preferred radius.</p>
            </motion.div>
            <motion.div initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="mb-12">
              <SearchBar onSubmit={handleSearch} />
            </motion.div>
          </div>
          <div className="absolute bottom-8 left-0 right-0 px-4 md:px-8 z-10 flex flex-col md:flex-row justify-between items-end gap-4 pointer-events-none">
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.8 }}
              className="bg-white/70 backdrop-blur-sm border border-white/50 p-4 rounded-2xl shadow-lg pointer-events-auto w-full md:w-auto">
              <h3 className="font-semibold mb-3 text-sm">Job Categories</h3>
              {categories.length === 0
                ? <p className="text-xs text-muted-foreground">No jobs in this area yet</p>
                : <div className="space-y-2 text-sm">{categories.map(cat => (
                    <div key={cat.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                      <span>{cat.name}</span>
                    </div>
                  ))}</div>}
            </motion.div>
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.9 }}
              className="bg-white/70 backdrop-blur-sm border border-white/50 p-6 rounded-2xl shadow-lg pointer-events-auto w-full md:w-[320px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm flex items-center gap-2"><Filter className="w-4 h-4" /> Search Radius</h3>
                <span className="text-primary font-bold">{radius[0]} km</span>
              </div>
              <Slider defaultValue={[25]} max={50} min={5} step={5} value={radius} onValueChange={setRadius} className="mb-6" data-testid="slider-map-radius" />
              <div className="flex justify-between text-xs text-muted-foreground"><span>5km</span><span>25km</span><span>50km</span></div>
            </motion.div>
          </div>
        </section>

        <StatsSection />
        <WhyChooseSection />
        <HowItWorksSection />
        <CTASection navigate={navigate} />
      </main>

      <Footer />
    </div>
  );
}

/* ─── Main export ────────────────────────────────────────────── */
export default function Home() {
  const [, navigate] = useLocation();
  const user = getUser();

  useEffect(() => {
    if (user?.role === "recruiter") navigate("/dashboard/recruiter");
  }, []);

  if (user?.role === "seeker") return <AuthenticatedSeekerHome user={user} navigate={navigate} />;
  return <MarketingHome navigate={navigate} />;
}
