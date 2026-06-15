import { useState, useEffect, useRef, lazy, Suspense, useCallback } from "react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Search, Briefcase, ArrowLeft, SlidersHorizontal,
  Clock, DollarSign, ChevronRight, Locate, X, Star,
  Navigation2, Loader2,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { getUser } from "@/lib/api";

/* ─── Types ─────────────────────────────────────────────────── */
interface Job {
  id: string;
  title: string;
  company: string;
  type: string;
  salary: string;
  distance: string;
  distanceMi: number;
  skills: string[];
  posted: string;
  lat: number;
  lng: number;
  color: string;
  logo: string;
  logoColor: string;
}

/* ─── Mock jobs with real SF coordinates ────────────────────── */
const ALL_JOBS: Job[] = [
  { id: "1", title: "Frontend Developer",    company: "TechHub SF",    type: "full-time",  salary: "$90k–$120k",  distance: "1.2 mi", distanceMi: 1.2,  skills: ["React", "TypeScript", "Tailwind"],       posted: "2d ago",  lat: 37.7749,  lng: -122.4194, color: "#3b82f6",  logo: "TH", logoColor: "#3b82f6" },
  { id: "2", title: "UX Designer",           company: "DesignCo",      type: "contract",   salary: "$75k–$95k",   distance: "0.8 mi", distanceMi: 0.8,  skills: ["Figma", "Prototyping", "User Research"],  posted: "1d ago",  lat: 37.7858,  lng: -122.4064, color: "#a855f7",  logo: "DC", logoColor: "#a855f7" },
  { id: "3", title: "Product Manager",       company: "GrowthLabs",    type: "full-time",  salary: "$110k–$140k", distance: "3.4 mi", distanceMi: 3.4,  skills: ["Roadmapping", "Agile", "Analytics"],      posted: "Today",   lat: 37.8044,  lng: -122.2712, color: "#22c55e",  logo: "GL", logoColor: "#22c55e" },
  { id: "4", title: "Backend Engineer",      company: "DataStream",    type: "part-time",  salary: "$70k–$90k",   distance: "2.1 mi", distanceMi: 2.1,  skills: ["Node.js", "MongoDB", "AWS"],              posted: "3d ago",  lat: 37.7590,  lng: -122.4040, color: "#f97316",  logo: "DS", logoColor: "#f97316" },
  { id: "5", title: "Marketing Specialist",  company: "BrandForward",  type: "full-time",  salary: "$60k–$80k",   distance: "1.8 mi", distanceMi: 1.8,  skills: ["SEO", "Content", "Analytics"],            posted: "Today",   lat: 37.7700,  lng: -122.4400, color: "#ec4899",  logo: "BF", logoColor: "#ec4899" },
  { id: "6", title: "DevOps Engineer",       company: "CloudBase",     type: "contract",   salary: "$100k–$130k", distance: "Remote", distanceMi: 0,    skills: ["Kubernetes", "Docker", "CI/CD"],          posted: "5d ago",  lat: 37.7825,  lng: -122.4100, color: "#06b6d4",  logo: "CB", logoColor: "#06b6d4" },
  { id: "7", title: "Data Scientist",        company: "AnalyticHub",   type: "full-time",  salary: "$105k–$135k", distance: "1.1 mi", distanceMi: 1.1,  skills: ["Python", "ML", "TensorFlow"],             posted: "2d ago",  lat: 37.7680,  lng: -122.4300, color: "#6366f1",  logo: "AH", logoColor: "#6366f1" },
  { id: "8", title: "React Native Dev",      company: "MobileFirst",   type: "contract",   salary: "$95k–$125k",  distance: "0.4 mi", distanceMi: 0.4,  skills: ["React Native", "Expo", "iOS"],            posted: "Today",   lat: 37.7760,  lng: -122.4180, color: "#10b981",  logo: "MF", logoColor: "#10b981" },
];

const TYPE_COLORS: Record<string, string> = {
  "full-time": "bg-green-100 text-green-700",
  "part-time":  "bg-blue-100 text-blue-700",
  contract:     "bg-orange-100 text-orange-700",
  freelance:    "bg-purple-100 text-purple-700",
};
const TYPE_LABELS: Record<string, string> = {
  "full-time": "Full-time", "part-time": "Part-time",
  contract: "Contract", freelance: "Freelance",
};

/* ─── Map helpers ────────────────────────────────────────────── */
function makeJobIcon(color: string, selected: boolean) {
  const size = selected ? 44 : 36;
  const anchor = selected ? 22 : 18;
  return L.divIcon({
    className: "",
    iconSize: [size, Math.round(size * 44 / 36)],
    iconAnchor: [anchor, Math.round(size * 44 / 36)],
    popupAnchor: [0, -Math.round(size * 44 / 36)],
    html: `
      <div style="width:${size}px;height:${Math.round(size*44/36)}px;filter:drop-shadow(0 ${selected?6:4}px ${selected?12:8}px rgba(0,0,0,${selected?0.35:0.22}));transition:all 0.2s">
        <svg viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
          <path d="M18 0C8.059 0 0 8.059 0 18c0 12.255 16.2 24.98 17.135 25.708a1.5 1.5 0 001.73 0C19.8 42.98 36 30.255 36 18 36 8.059 27.941 0 18 0z" fill="${color}"/>
          <circle cx="18" cy="18" r="11" fill="white" opacity="0.95"/>
          <path d="M13 17.5h2.5V15a2.5 2.5 0 015 0v2.5H23a1 1 0 011 1v5a1 1 0 01-1 1H13a1 1 0 01-1-1v-5a1 1 0 011-1zm3.5 0H20V15a2 2 0 00-4 0v2.5zm-1.5 1v5h8v-5h-8z" fill="${color}" fill-rule="evenodd" clip-rule="evenodd"/>
        </svg>
      </div>
    `,
  });
}

function makeUserIcon() {
  return L.divIcon({
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    html: `
      <div style="width:22px;height:22px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 2px 12px rgba(37,99,235,0.55)"></div>
    `,
  });
}

function FlyToJob({ lat, lng, trigger }: { lat: number; lng: number; trigger: number }) {
  const map = useMap();
  useEffect(() => {
    if (trigger > 0) map.flyTo([lat, lng], 15, { animate: true, duration: 0.8 });
  }, [trigger]);
  return null;
}

function SetViewOnce({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (!done.current) { done.current = true; map.setView([lat, lng], 13); }
  }, [lat, lng]);
  return null;
}

/* ─── Main page ──────────────────────────────────────────────── */
export default function MapExplorer() {
  const [, navigate] = useLocation();
  const user = getUser();

  const [userPos, setUserPos]       = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating]     = useState(true);
  const [search, setSearch]         = useState("");
  const [radius, setRadius]         = useState([10]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [selected, setSelected]     = useState<string | null>(null);
  const [flyTrigger, setFlyTrigger] = useState(0);
  const [flyTarget, setFlyTarget]   = useState({ lat: 37.7749, lng: -122.4194 });
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  /* ── Geolocation ── */
  useEffect(() => {
    if (!navigator.geolocation) { setLocating(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  const mapCenter: [number, number] = userPos
    ? [userPos.lat, userPos.lng]
    : [37.7749, -122.4194];

  /* ── Filter jobs ── */
  const filteredJobs = ALL_JOBS.filter((j) => {
    const q = search.toLowerCase();
    const matchSearch = !search
      || j.title.toLowerCase().includes(q)
      || j.company.toLowerCase().includes(q)
      || j.skills.some((s) => s.toLowerCase().includes(q));
    const matchType = typeFilter === "all" || j.type === typeFilter;
    const matchRadius = j.distanceMi === 0 || j.distanceMi <= radius[0];
    return matchSearch && matchType && matchRadius;
  });

  /* ── Select a job (pan map + scroll card) ── */
  const selectJob = useCallback((job: Job) => {
    setSelected(job.id);
    setFlyTarget({ lat: job.lat, lng: job.lng });
    setFlyTrigger((n) => n + 1);
    setTimeout(() => {
      cardRefs.current[job.id]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 100);
  }, []);

  /* ── Re-centre on user ── */
  const recentre = () => {
    if (!userPos) return;
    setFlyTarget(userPos);
    setFlyTrigger((n) => n + 1);
    setSelected(null);
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-[#f8fafc] font-sans">

      {/* ── Top bar ── */}
      <header className="flex-shrink-0 bg-white/95 backdrop-blur-md border-b border-border/50 shadow-sm z-[1000] relative">
        <div className="px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-secondary/80 flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <Link href="/" className="flex items-center gap-1.5 flex-shrink-0 mr-2">
            <div className="w-6 h-6 rounded-md bg-primary/15 flex items-center justify-center text-primary">
              <MapPin className="w-3 h-3" strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-sm tracking-tight">JobNearby</span>
          </Link>

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs, skills, companies…"
              className="pl-9 pr-8 h-9 rounded-full bg-secondary border-0 shadow-none focus-visible:ring-1 focus-visible:ring-primary/40 text-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Locate me */}
          <button
            onClick={recentre}
            disabled={!userPos}
            title="Re-centre on my location"
            className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors flex-shrink-0 disabled:opacity-40"
          >
            {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation2 className="w-4 h-4" />}
          </button>

          {user && (
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
              {user.fullName?.[0]?.toUpperCase() ?? "U"}
            </div>
          )}
        </div>

        {/* Type filter pills */}
        <div className="px-4 pb-2.5 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {["all", "full-time", "part-time", "contract", "freelance"].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                typeFilter === t
                  ? "bg-primary text-white shadow-sm"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {t === "all" ? "All types" : TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </header>

      {/* ── Body: left panel + map ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Left panel ── */}
        <aside className="w-[360px] flex-shrink-0 flex flex-col bg-white border-r border-border/50 z-10 overflow-hidden">

          {/* Radius */}
          <div className="px-4 pt-4 pb-3 border-b border-border/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                Search Radius
              </div>
              <span className="text-primary font-bold text-sm">{radius[0]} mi</span>
            </div>
            <Slider
              min={1} max={25} step={1}
              value={radius}
              onValueChange={setRadius}
              className="mb-1"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>1 mi</span><span>12 mi</span><span>25 mi</span>
            </div>
          </div>

          {/* Location status */}
          <div className={`px-4 py-2 text-xs font-medium flex items-center gap-2 border-b border-border/30 ${
            locating ? "text-muted-foreground" : userPos ? "text-green-600 bg-green-50" : "text-amber-600 bg-amber-50"
          }`}>
            {locating
              ? <><Loader2 className="w-3 h-3 animate-spin" /> Getting your location…</>
              : userPos
              ? <><MapPin className="w-3 h-3" /> Using your live location</>
              : <><MapPin className="w-3 h-3" /> Location unavailable — showing San Francisco</>
            }
          </div>

          {/* Job count */}
          <div className="px-4 py-2.5 flex items-center justify-between border-b border-border/30">
            <p className="text-sm font-bold text-foreground">
              Jobs near you
              <span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-extrabold">
                {filteredJobs.length}
              </span>
            </p>
            {filteredJobs.length !== ALL_JOBS.length && (
              <button onClick={() => { setSearch(""); setTypeFilter("all"); setRadius([10]); }} className="text-xs text-primary font-semibold hover:underline">
                Clear filters
              </button>
            )}
          </div>

          {/* Job list */}
          <div className="flex-1 overflow-y-auto">
            {filteredJobs.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm font-medium">No jobs match your filters</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    ref={(el) => { cardRefs.current[job.id] = el; }}
                    onClick={() => selectJob(job)}
                    className={`px-4 py-3.5 cursor-pointer transition-all ${
                      selected === job.id
                        ? "bg-primary/5 border-l-2 border-primary"
                        : "hover:bg-secondary/40 border-l-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: job.logoColor }}
                      >
                        {job.logo}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-bold text-foreground leading-snug">{job.title}</p>
                          <ChevronRight className={`w-4 h-4 flex-shrink-0 mt-0.5 transition-colors ${selected === job.id ? "text-primary" : "text-muted-foreground/40"}`} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{job.company}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${TYPE_COLORS[job.type] ?? "bg-secondary text-secondary-foreground"}`}>
                            {TYPE_LABELS[job.type] ?? job.type}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <DollarSign className="w-2.5 h-2.5" />{job.salary}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <MapPin className="w-2.5 h-2.5" />{job.distance}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {job.skills.slice(0, 3).map((s) => (
                            <span key={s} className="px-1.5 py-0.5 bg-secondary rounded text-[10px] text-muted-foreground font-medium">{s}</span>
                          ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground/60 mt-1.5 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />{job.posted}
                        </p>
                      </div>
                    </div>

                    {/* Apply button on selected */}
                    <AnimatePresence>
                      {selected === job.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 overflow-hidden"
                        >
                          <Button size="sm" className="w-full h-8 text-xs font-semibold">
                            Apply Now
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ── Map ── */}
        <div className="flex-1 relative">
          <MapContainer
            center={mapCenter}
            zoom={13}
            zoomControl={true}
            scrollWheelZoom={true}
            style={{ width: "100%", height: "100%" }}
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; OSM &copy; CARTO'
            />

            <SetViewOnce lat={mapCenter[0]} lng={mapCenter[1]} />
            <FlyToJob lat={flyTarget.lat} lng={flyTarget.lng} trigger={flyTrigger} />

            {/* User location */}
            {userPos && (
              <>
                <Circle
                  center={[userPos.lat, userPos.lng]}
                  radius={radius[0] * 1609}
                  pathOptions={{
                    fillColor: "#f59e0b",
                    fillOpacity: 0.07,
                    color: "#f59e0b",
                    weight: 1.5,
                    dashArray: "6 4",
                  }}
                />
                <Marker position={[userPos.lat, userPos.lng]} icon={makeUserIcon()}>
                  <Popup>
                    <div style={{ fontFamily: "sans-serif", fontWeight: 700, fontSize: 13, color: "#1e40af" }}>
                      📍 You are here
                    </div>
                  </Popup>
                </Marker>
              </>
            )}

            {/* Job pins */}
            {filteredJobs.map((job) => (
              <Marker
                key={job.id}
                position={[job.lat, job.lng]}
                icon={makeJobIcon(job.color, selected === job.id)}
                eventHandlers={{ click: () => selectJob(job) }}
              >
                <Popup>
                  <div style={{ minWidth: 170, fontFamily: "sans-serif" }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: "#0f172a", marginBottom: 2 }}>{job.title}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>{job.company}</div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, background: "#f1f5f9", borderRadius: 4, padding: "2px 6px", color: "#475569" }}>{TYPE_LABELS[job.type] ?? job.type}</span>
                      <span style={{ fontSize: 11, background: "#f1f5f9", borderRadius: 4, padding: "2px 6px", color: "#475569" }}>💰 {job.salary}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>📍 {job.distance}</div>
                    <div
                      onClick={() => selectJob(job)}
                      style={{ background: "#f59e0b", color: "white", fontWeight: 700, fontSize: 12, padding: "6px 12px", borderRadius: 8, cursor: "pointer", textAlign: "center" as const }}
                    >
                      View Details →
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Map attribution */}
          <div className="absolute bottom-2 right-2 z-[999] text-[10px] text-muted-foreground/60 bg-white/80 rounded px-1.5 py-0.5">
            © OpenStreetMap © CARTO
          </div>

          {/* Selected job floating card */}
          <AnimatePresence>
            {selected && (() => {
              const job = filteredJobs.find((j) => j.id === selected);
              if (!job) return null;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[999] bg-white rounded-2xl shadow-2xl border border-border/60 p-4 w-80 pointer-events-auto"
                >
                  <button
                    onClick={() => setSelected(null)}
                    className="absolute top-3 right-3 w-5 h-5 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-secondary/80"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0" style={{ backgroundColor: job.logoColor }}>
                      {job.logo}
                    </div>
                    <div>
                      <p className="text-sm font-extrabold">{job.title}</p>
                      <p className="text-xs text-muted-foreground">{job.company} · {job.distance}</p>
                      <p className="text-xs text-primary font-semibold mt-0.5">{job.salary}</p>
                    </div>
                  </div>
                  <Button size="sm" className="w-full h-8 text-xs font-semibold mt-3">Apply Now</Button>
                </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
