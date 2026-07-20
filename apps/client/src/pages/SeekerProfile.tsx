import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft, Pencil, Save, X, MapPin, Mail, Briefcase,
  FileText, Upload, CheckCircle2, Loader2, Plus, Settings2,
  Shield, Trash2, TrendingUp, Radar, Eye, Bookmark,
  CalendarClock, XCircle, Sparkles, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { getUser, getToken } from "@/lib/api";

interface UserProfile {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  location: string;
  jobTitle?: string;
  skills?: string[];
  preferredRadius?: number;
  createdAt?: string;
}

export default function SeekerProfile() {
  const [, navigate] = useLocation();
  const sessionUser = getUser();
  const token = getToken();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: "", location: "", jobTitle: "", preferredRadius: 25 });
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [resumeName, setResumeName] = useState("");
  const [stats, setStats] = useState({ appliedJobs: 0, savedJobs: 0, interviews: 0, profileViews: 12 });
  const fileRef = useRef<HTMLInputElement>(null);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  useEffect(() => {
    if (!sessionUser) { navigate("/auth"); return; }
    const headers = { Authorization: `Bearer ${token ?? ""}` };

    // Fetch profile, stats, and applications in parallel
    Promise.all([
      fetch(`/api/users/${sessionUser.id}`, { headers }).then(r => r.json()).catch(() => null),
      fetch("/api/stats/seeker", { headers }).then(r => r.json()).catch(() => null),
      fetch("/api/applications", { headers }).then(r => r.json()).catch(() => ({ applications: [] })),
    ]).then(([d, s, apps]) => {
      const profile: UserProfile = d ?? {
        _id: sessionUser.id,
        fullName: sessionUser.fullName,
        email: sessionUser.email,
        role: sessionUser.role,
        location: "",
      };
      setProfile(profile);
      setEditForm({
        fullName: profile.fullName ?? sessionUser.fullName,
        location: profile.location ?? "",
        jobTitle: profile.jobTitle ?? "",
        preferredRadius: profile.preferredRadius ?? 25,
      });
      setSkills(profile.skills ?? []);
      if (s) {
        setStats({
          appliedJobs: s.appliedJobs ?? (apps?.applications?.length ?? 0),
          savedJobs:   s.savedJobs   ?? 0,
          interviews:  s.interviews  ?? 0,
          profileViews:s.profileViews ?? 12,
        });
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!sessionUser) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${sessionUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
        body: JSON.stringify({ ...editForm, skills }),
      });
      if (res.ok) {
        const updated = (await res.json()) as UserProfile;
        setProfile(updated);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
        setEditing(false);
      }
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const startEditing = () => {
    setEditForm({
      fullName: profile?.fullName ?? sessionUser?.fullName ?? "",
      location: profile?.location ?? "",
      jobTitle: profile?.jobTitle ?? "",
      preferredRadius: profile?.preferredRadius ?? 25,
    });
    setSkills(profile?.skills ?? []);
    setEditing(true);
  };

  const addSkill = () => {
    const s = newSkill.trim();
    if (s && !skills.includes(s)) setSkills(p => [...p, s]);
    setNewSkill("");
  };

  if (!sessionUser) return null;

  const displayName = editing ? editForm.fullName : (profile?.fullName ?? sessionUser.fullName);
  const initials = displayName.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "";

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
            <span className="text-sm font-semibold">My Profile</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {editing ? (
              <>
                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={() => setEditing(false)}>
                  <X className="w-3.5 h-3.5" /> Cancel
                </Button>
                <Button size="sm" className="h-8 text-xs gap-1" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Changes
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={startEditing}>
                <Pencil className="w-3.5 h-3.5" /> Edit Profile
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">Loading your profile…</p>
          </div>
        ) : (
          <div className="space-y-5">

            {/* Success toast */}
            {saveSuccess && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-2xl text-green-700 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" /> Profile saved successfully!
              </motion.div>
            )}

            {/* ── Welcome banner ── */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-primary/90 to-yellow-400 rounded-2xl p-6 flex items-center justify-between overflow-hidden relative">
              <div className="absolute right-0 top-0 w-48 h-48 rounded-full bg-white/10 -translate-y-1/2 translate-x-1/4" />
              <div className="absolute right-24 bottom-0 w-24 h-24 rounded-full bg-white/10 translate-y-1/2" />
              <div className="relative">
                <p className="text-yellow-900/70 text-sm font-medium mb-1">{greeting}</p>
                <h1 className="text-2xl font-extrabold text-yellow-950">
                  Hi, {(profile?.fullName ?? sessionUser?.fullName ?? "there").split(" ")[0]}!
                </h1>
                <p className="text-yellow-900/70 text-sm mt-1">
                  {stats.appliedJobs} active application{stats.appliedJobs !== 1 ? "s" : ""} · {stats.profileViews} profile views
                </p>
              </div>
              <div className="relative hidden sm:flex items-center gap-6 text-yellow-950">
                {[
                  { icon: Briefcase,   label: "Jobs nearby",    value: "24" },
                  { icon: TrendingUp,  label: "Applications",   value: String(stats.appliedJobs) },
                  { icon: Radar,       label: "Profile views",  value: String(stats.profileViews) },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="text-center">
                    <div className="w-10 h-10 rounded-xl bg-white/25 flex items-center justify-center mx-auto mb-1">
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="text-xl font-extrabold leading-none">{value}</p>
                    <p className="text-xs text-yellow-900/60 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Briefcase,     label: "Applied Jobs",  value: stats.appliedJobs,  growth: "+2 this week", color: "text-blue-600",   bg: "bg-blue-50" },
                { icon: Bookmark,      label: "Saved Jobs",    value: stats.savedJobs,    growth: "+1 this week", color: "text-violet-600", bg: "bg-violet-50" },
                { icon: CalendarClock, label: "Interviews",    value: stats.interviews,   growth: "+1 this week", color: "text-amber-600",  bg: "bg-amber-50" },
                { icon: Eye,           label: "Profile Views", value: stats.profileViews, growth: "+3 this week", color: "text-green-600",  bg: "bg-green-50" },
              ].map(({ icon: Icon, label, value, growth, color, bg }, i) => (
                <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl p-4 shadow-sm">
                  <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-2`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <p className="text-2xl font-extrabold">{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-medium">{label}</p>
                  <p className="text-xs text-green-600 font-semibold mt-1">{growth}</p>
                </motion.div>
              ))}
            </div>

            {/* ── Profile Completion ── */}
            {(() => {
              const items = [
                { label: "Full Name",  done: !!(profile?.fullName) },
                { label: "Skills",     done: skills.length > 0 },
                { label: "Location",   done: !!(profile?.location) },
                { label: "Experience", done: !!(profile?.jobTitle) },
                { label: "Resume",     done: !!resumeName },
                { label: "Certifications", done: false },
              ];
              const pct = Math.round((items.filter(i => i.done).length / items.length) * 100);
              const radius = 28, stroke = 5, norm = radius - stroke / 2;
              const circ = 2 * Math.PI * norm;
              return (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-3xl p-6 shadow-sm">
                  <h3 className="font-extrabold mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" /> Profile Completion
                  </h3>
                  <div className="flex items-center gap-6">
                    <div className="relative flex-shrink-0 w-16 h-16">
                      <svg width="64" height="64" className="-rotate-90">
                        <circle cx="32" cy="32" r={norm} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
                        <circle cx="32" cy="32" r={norm} fill="none" stroke="hsl(var(--primary))" strokeWidth={stroke}
                          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
                          strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s ease" }} />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-extrabold">{pct}%</span>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-y-2 gap-x-4">
                      {items.map(({ label, done }) => (
                        <div key={label} className={`flex items-center gap-2 text-sm ${done ? "text-green-700" : "text-muted-foreground"}`}>
                          {done
                            ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                            : <XCircle className="w-4 h-4 text-border flex-shrink-0" />}
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
                </motion.div>
              );
            })()}

            {/* Avatar card */}
            <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-3xl p-6 shadow-sm">
              <div className="flex items-start gap-5">
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 rounded-2xl bg-primary/15 flex items-center justify-center text-primary font-extrabold text-2xl">
                    {initials}
                  </div>
                  {editing && (
                    <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white shadow-md hover:bg-primary/90 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {editing ? (
                    <Input
                      value={editForm.fullName}
                      onChange={e => setEditForm(f => ({ ...f, fullName: e.target.value }))}
                      className="font-bold text-lg h-10 mb-2"
                      placeholder="Full name"
                    />
                  ) : (
                    <h2 className="text-xl font-extrabold tracking-tight mb-1.5">{displayName}</h2>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary capitalize">
                      {sessionUser.role}
                    </span>
                    {profile?.jobTitle && !editing && (
                      <span className="text-sm text-muted-foreground">{profile.jobTitle}</span>
                    )}
                  </div>
                  {memberSince && (
                    <p className="text-xs text-muted-foreground mt-2">Member since {memberSince}</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Contact info */}
            <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.06 }}
              className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{sessionUser.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Location</p>
                    {editing ? (
                      <Input
                        value={editForm.location}
                        onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))}
                        className="h-8 text-sm mt-0.5"
                        placeholder="City, Country"
                      />
                    ) : (
                      <p className="text-sm font-medium">{profile?.location || <span className="italic text-muted-foreground/60">Not set</span>}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Job Title</p>
                    {editing ? (
                      <Input
                        value={editForm.jobTitle}
                        onChange={e => setEditForm(f => ({ ...f, jobTitle: e.target.value }))}
                        className="h-8 text-sm mt-0.5"
                        placeholder="e.g. Frontend Developer"
                      />
                    ) : (
                      <p className="text-sm font-medium">{profile?.jobTitle || <span className="italic text-muted-foreground/60">Not set</span>}</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Skills */}
            <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
              className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider mb-4">Skills</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {skills.length === 0 ? (
                  <p className="text-sm text-muted-foreground/60 italic">No skills added yet</p>
                ) : (
                  skills.map(s => (
                    <span key={s}
                      className="flex items-center gap-1.5 px-3 py-1 bg-primary/8 border border-primary/20 rounded-full text-sm font-medium text-primary">
                      {s}
                      {editing && (
                        <button onClick={() => setSkills(p => p.filter(x => x !== s))}
                          className="hover:text-destructive transition-colors ml-0.5">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  ))
                )}
              </div>
              {editing && (
                <div className="flex gap-2 mt-3">
                  <Input
                    value={newSkill}
                    onChange={e => setNewSkill(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                    placeholder="Type a skill and press Enter"
                    className="h-8 text-sm"
                  />
                  <Button onClick={addSkill} size="sm" variant="outline" className="h-8 px-3 flex-shrink-0">
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </motion.div>

            {/* Preferred radius — only in edit mode */}
            {editing && (
              <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-3xl p-6 shadow-sm">
                <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider mb-4">Job Search Radius</h3>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-muted-foreground">Max distance for job recommendations</p>
                  <span className="text-primary font-bold text-sm">{editForm.preferredRadius} km</span>
                </div>
                <Slider
                  value={[editForm.preferredRadius]}
                  onValueChange={v => setEditForm(f => ({ ...f, preferredRadius: v[0]! }))}
                  min={5} max={100} step={5}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>5 km</span><span>50 km</span><span>100 km</span>
                </div>
              </motion.div>
            )}

            {/* Resume upload */}
            <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.14 }}
              className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider mb-4">Resume / CV</h3>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) setResumeName(f.name); }} />
              {resumeName ? (
                <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/15 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{resumeName}</p>
                    <p className="text-xs text-green-600 font-medium mt-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Ready to submit
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => fileRef.current?.click()}
                      className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:bg-secondary/80 transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setResumeName("")}
                      className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()}
                  className="w-full flex flex-col items-center gap-3 py-10 border-2 border-dashed border-border/60 rounded-2xl hover:border-primary/40 hover:bg-primary/3 transition-all group">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                    <Upload className="w-7 h-7 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">Upload your resume</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, DOC, or DOCX · Max 10MB</p>
                  </div>
                </button>
              )}
            </motion.div>

            {/* Account settings */}
            <motion.div initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.18 }}
              className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-wider mb-4">Account</h3>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <Settings2 className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Account Settings</p>
                    <p className="text-xs text-muted-foreground">Manage password and preferences</p>
                  </div>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Privacy & Security</p>
                    <p className="text-xs text-muted-foreground">Control your data and visibility</p>
                  </div>
                </button>
              </div>
            </motion.div>

          </div>
        )}
      </div>
    </div>
  );
}
