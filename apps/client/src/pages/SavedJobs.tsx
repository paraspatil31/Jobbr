import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft, MapPin, Bookmark, DollarSign,
  Trash2, Search, ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/api";

interface SavedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  savedAt: string;
  logo: string;
  color: string;
}

/* Placeholder — replace with real API data when available */
const SAVED: SavedJob[] = [];

export default function SavedJobs() {
  const [, navigate] = useLocation();
  const user = getUser();
  const [search, setSearch] = useState("");
  const [jobs, setJobs] = useState<SavedJob[]>(SAVED);

  if (!user) { navigate("/auth"); return null; }

  const filtered = jobs.filter(j => {
    const q = search.toLowerCase();
    return !search || j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q);
  });

  const remove = (id: string) => setJobs(p => p.filter(j => j.id !== id));

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
            <span className="text-sm font-semibold">Saved Jobs</span>
          </div>
          {jobs.length > 0 && (
            <div className="ml-auto relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search saved jobs…"
                className="pl-8 h-8 w-48 rounded-full bg-secondary border-0 text-xs"
              />
            </div>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {jobs.length === 0 ? (
          /* Empty state */
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-3xl bg-amber-50 flex items-center justify-center mb-6">
              <Bookmark className="w-10 h-10 text-amber-400" />
            </div>
            <h2 className="text-xl font-extrabold mb-2">No saved jobs yet</h2>
            <p className="text-muted-foreground text-sm max-w-xs leading-relaxed mb-8">
              Bookmark jobs you're interested in and come back to apply when you're ready.
            </p>
            <button
              onClick={() => navigate("/explore")}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
            >
              <MapPin className="w-4 h-4" /> Find Jobs to Save
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-extrabold text-lg">Saved Jobs</h2>
              <span className="px-3 py-0.5 rounded-full bg-amber-50 text-amber-700 text-sm font-bold border border-amber-200">
                {filtered.length} saved
              </span>
            </div>
            {filtered.map((job, i) => (
              <motion.div key={job.id} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white/80 backdrop-blur-sm border border-white/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-extrabold flex-shrink-0"
                    style={{ backgroundColor: job.color }}>
                    {job.logo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm group-hover:text-primary transition-colors">{job.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{job.company}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <MapPin className="w-2.5 h-2.5" />{job.location}
                      </span>
                      {job.salary && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <DollarSign className="w-2.5 h-2.5" />{job.salary}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary text-muted-foreground">
                        {job.type}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/60 mt-2">Saved {job.savedAt}</p>
                  </div>
                  <div className="flex flex-col gap-1.5 ml-2">
                    <button
                      title="Remove from saved"
                      onClick={() => remove(job.id)}
                      className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      title="View job"
                      className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <Button size="sm" className="w-full h-8 text-xs font-semibold mt-3">Apply Now</Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
