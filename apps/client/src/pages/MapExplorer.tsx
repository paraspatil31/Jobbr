import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useSearch, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Search, Briefcase, ArrowLeft, SlidersHorizontal,
  Clock, DollarSign, ChevronRight, X,
  Navigation2, Loader2, Users, Building2,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { getUser } from "@/lib/api";
import { jobsApi, type Job as ApiJob, type CategoryCount } from "@/api/jobs";

/* ─── Types ─────────────────────────────────────────────────── */
type ClusterView = "jobs" | "seekers" | "both";

interface SeekerPin {
  _id: string;
  fullName: string;
  location: string;
  jobTitle?: string;
  skills?: string[];
  geoLocation?: { type: string; coordinates: [number, number] };
  distance?: number;
}

interface Job {
  id: string;
  title: string;
  company: string;
  category: string;
  type: string;
  salary: string;
  distanceM: number;
  skills: string[];
  posted: string;
  lat: number;
  lng: number;
  color: string;
  logo: string;
}

/* ─── Radius → Zoom mapping ──────────────────────────────────── */
const RADIUS_STEPS = [5, 10, 25, 50, 100];

function radiusToZoom(km: number): number {
  if (km <= 5) return 13;
  if (km <= 10) return 12;
  if (km <= 25) return 11;
  if (km <= 50) return 10;
  return 9;
}

/* ─── Deterministic category color ──────────────────────────── */
function categoryColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0x7fffffff;
  }
  const hue = hash % 360;
  return `hsl(${hue}, 60%, 48%)`;
}

function categoryLogo(company: string): string {
  const words = company.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0]! + words[1][0]!).toUpperCase();
  return company.slice(0, 2).toUpperCase();
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function mapApiJob(j: ApiJob): Job {
  const coords = j.geoLocation?.coordinates;
  const lat = coords ? coords[1] : (j.latitude ?? 0);
  const lng = coords ? coords[0] : (j.longitude ?? 0);
  const color = categoryColor(j.category || "General");
  return {
    id: j._id,
    title: j.title,
    company: j.company,
    category: j.category || "General",
    type: j.type,
    salary: j.salary ?? "",
    distanceM: j.distance ?? 0,
    skills: j.skills,
    posted: timeAgo(j.createdAt),
    lat,
    lng,
    color,
    logo: categoryLogo(j.company),
  };
}

/* ─── Map helpers ────────────────────────────────────────────── */
const TYPE_COLORS: Record<string, string> = {
  "full-time": "bg-green-100 text-green-700",
  "part-time": "bg-blue-100 text-blue-700",
  contract: "bg-orange-100 text-orange-700",
  freelance: "bg-purple-100 text-purple-700",
};
const TYPE_LABELS: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  freelance: "Freelance",
};

function makeJobIcon(color: string, selected: boolean) {
  const size = selected ? 44 : 36;
  const anchor = selected ? 22 : 18;
  return L.divIcon({
    className: "",
    iconSize: [size, Math.round(size * 44 / 36)],
    iconAnchor: [anchor, Math.round(size * 44 / 36)],
    popupAnchor: [0, -Math.round(size * 44 / 36)],
    html: `
      <div style="width:${size}px;height:${Math.round(size * 44 / 36)}px;filter:drop-shadow(0 ${selected ? 6 : 4}px ${selected ? 12 : 8}px rgba(0,0,0,${selected ? 0.35 : 0.22}));transition:all 0.2s">
        <svg viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
          <path d="M18 0C8.059 0 0 8.059 0 18c0 12.255 16.2 24.98 17.135 25.708a1.5 1.5 0 001.73 0C19.8 42.98 36 30.255 36 18 36 8.059 27.941 0 18 0z" fill="${color}"/>
          <circle cx="18" cy="18" r="11" fill="white" opacity="0.95"/>
          <path d="M13 17.5h2.5V15a2.5 2.5 0 015 0v2.5H23a1 1 0 011 1v5a1 1 0 01-1 1H13a1 1 0 01-1-1v-5a1 1 0 011-1zm3.5 0H20V15a2 2 0 00-4 0v2.5zm-1.5 1v5h8v-5h-8z" fill="${color}" fill-rule="evenodd" clip-rule="evenodd"/>
        </svg>
      </div>
    `,
  });
}

function makeSeekerIcon(selected: boolean) {
  const color = selected ? "#0f766e" : "#0d9488";
  const size = selected ? 44 : 36;
  const h = Math.round(size * 44 / 36);
  return L.divIcon({
    className: "",
    iconSize: [size, h],
    iconAnchor: [size / 2, h],
    popupAnchor: [0, -h],
    html: `<div style="width:${size}px;height:${h}px;filter:drop-shadow(0 ${selected ? 6 : 4}px ${selected ? 12 : 8}px rgba(0,0,0,${selected ? 0.35 : 0.22}));transition:all 0.2s">
      <svg viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
        <path d="M18 0C8.059 0 0 8.059 0 18c0 12.255 16.2 24.98 17.135 25.708a1.5 1.5 0 001.73 0C19.8 42.98 36 30.255 36 18 36 8.059 27.941 0 18 0z" fill="${color}"/>
        <circle cx="18" cy="18" r="11" fill="white" opacity="0.95"/>
        <circle cx="18" cy="15" r="4" fill="${color}"/>
        <path d="M10 26c0-4.418 3.582-6 8-6s8 1.582 8 6" stroke="${color}" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    </div>`,
  });
}

function makeUserIcon() {
  return L.divIcon({
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    html: `<div style="width:22px;height:22px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 2px 12px rgba(37,99,235,0.55)"></div>`,
  });
}

function FlyToJob({ lat, lng, trigger }: { lat: number; lng: number; trigger: number }) {
  const map = useMap();
  useEffect(() => {
    if (trigger > 0) map.flyTo([lat, lng], 15, { animate: true, duration: 0.8 });
  }, [trigger]);
  return null;
}

function SetViewOnce({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (!done.current) { done.current = true; map.setView([lat, lng], zoom); }
  }, [lat, lng, zoom]);
  return null;
}

function FlyToRadius({ lat, lng, zoom, trigger }: { lat: number; lng: number; zoom: number; trigger: number }) {
  const map = useMap();
  useEffect(() => {
    if (trigger > 0) {
      map.flyTo([lat, lng], zoom, { animate: true, duration: 1.0 });
    }
  }, [trigger]);
  return null;
}

/* ─── Geocode a location string via Nominatim (free, no key) ── */
async function geocode(query: string): Promise<{ lat: number; lng: number; display: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    const res = await fetch(url, { headers: { "Accept-Language": "en" } });
    const json = await res.json() as Array<{ lat: string; lon: string; display_name: string }>;
    if (!json.length) return null;
    const first = json[0]!;
    return { lat: parseFloat(first.lat), lng: parseFloat(first.lon), display: first.display_name };
  } catch {
    return null;
  }
}

/* ─── Main page ──────────────────────────────────────────────── */
export default function MapExplorer() {
  const [, navigate] = useLocation();
  const searchStr = useSearch();
  const user = getUser();

  /* ── Parse URL params from home search bar ── */
  const urlParams = new URLSearchParams(searchStr);
  const qParam = urlParams.get("q") ?? "";
  const locationParam = urlParams.get("location") ?? "";

  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [geocodedLabel, setGeocodedLabel] = useState<string>("");
  const [geocoding, setGeocoding] = useState(false);
  const [locating, setLocating] = useState(true);
  const [search, setSearch] = useState(qParam);
  const [radius, setRadius] = useState([10]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [flyTrigger, setFlyTrigger] = useState(0);
  const [flyTarget, setFlyTarget] = useState({ lat: 37.7749, lng: -122.4194 });
  const [radiusTrigger, setRadiusTrigger] = useState(0);

  const [clusterView, setClusterView] = useState<ClusterView>("both");
  const [seekers, setSeekers] = useState<SeekerPin[]>([]);
  const [seekerLoading, setSeekerLoading] = useState(false);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [categories, setCategories] = useState<CategoryCount[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [loading, setLoading] = useState(false);

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  /* ── Geocode location param from URL ── */
  useEffect(() => {
    if (!locationParam) return;
    setGeocoding(true);
    geocode(locationParam).then((result) => {
      setGeocoding(false);
      if (result) {
        setSearchCenter({ lat: result.lat, lng: result.lng });
        setGeocodedLabel(locationParam);
        setFlyTarget({ lat: result.lat, lng: result.lng });
        setFlyTrigger((n) => n + 1);
      }
    });
  }, [locationParam]);

  /* ── Geolocation (only if no location param) ── */
  useEffect(() => {
    if (locationParam) { setLocating(false); return; }
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

  /* ── Effective center for queries: searched location > GPS > SF default ── */
  const effectiveCenter = searchCenter ?? userPos ?? { lat: 37.7749, lng: -122.4194 };

  /* ── Fetch nearby jobs from MongoDB ── */
  const fetchNearby = useCallback(async (center: { lat: number; lng: number }, radiusKm: number) => {
    setLoading(true);
    try {
      const res = await jobsApi.nearby({ latitude: center.lat, longitude: center.lng, radius: radiusKm * 1000 });
      setJobs(res.jobs.map(mapApiJob));
      setCategories(res.categories);
      setTotalJobs(res.totalJobs);
    } catch {
      setJobs([]);
      setCategories([]);
      setTotalJobs(0);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Trigger fetch when center or radius changes (after locating done) ── */
  useEffect(() => {
    if (!locating && !geocoding) {
      void fetchNearby(effectiveCenter, radius[0]);
    }
  }, [locating, geocoding, searchCenter, userPos, radius[0]]);

  /* ── Fetch nearby seekers ── */
  const fetchNearbySeekers = useCallback(async (center: { lat: number; lng: number }, radiusKm: number) => {
    setSeekerLoading(true);
    try {
      const base = (import.meta.env.BASE_URL as string).replace(/\/$/, "");
      const res = await fetch(`${base}/api/users/nearby-seekers?latitude=${center.lat}&longitude=${center.lng}&radius=${radiusKm * 1000}`);
      if (!res.ok) { setSeekers([]); return; }
      const data = await res.json() as { seekers: SeekerPin[]; total: number };
      setSeekers(data.seekers ?? []);
    } catch {
      setSeekers([]);
    } finally {
      setSeekerLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!locating && !geocoding && (clusterView === "seekers" || clusterView === "both")) {
      void fetchNearbySeekers(effectiveCenter, radius[0]);
    } else if (clusterView === "jobs") {
      setSeekers([]);
    }
  }, [locating, geocoding, searchCenter, userPos, radius[0], clusterView]);

  /* ── Trigger map zoom when radius changes ── */
  const prevRadius = useRef(radius[0]);
  useEffect(() => {
    if (radius[0] !== prevRadius.current) {
      prevRadius.current = radius[0];
      setRadiusTrigger((n) => n + 1);
    }
  }, [radius[0]]);

  const mapCenter: [number, number] = [effectiveCenter.lat, effectiveCenter.lng];
  const currentZoom = radiusToZoom(radius[0]);

  /* ── Filter displayed jobs (local search + type + category) ── */
  const filteredJobs = jobs.filter((j) => {
    const q = search.toLowerCase();
    const matchSearch = !search
      || j.title.toLowerCase().includes(q)
      || j.company.toLowerCase().includes(q)
      || j.skills.some((s) => s.toLowerCase().includes(q));
    const matchType = typeFilter === "all" || j.type === typeFilter;
    const matchCat = categoryFilter === "all" || j.category === categoryFilter;
    return matchSearch && matchType && matchCat;
  });

  /* ── Select a job ── */
  const selectJob = useCallback((job: Job) => {
    setSelected(job.id);
    if (job.lat && job.lng) {
      setFlyTarget({ lat: job.lat, lng: job.lng });
      setFlyTrigger((n) => n + 1);
    }
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

  /* ── Snap radius to allowed steps ── */
  const handleRadiusChange = (val: number[]) => {
    const v = val[0]!;
    const snapped = RADIUS_STEPS.reduce((prev, curr) =>
      Math.abs(curr - v) < Math.abs(prev - v) ? curr : prev
    );
    setRadius([snapped]);
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

          {/* Cluster view toggle */}
          <div className="px-4 pt-4 pb-3 border-b border-border/40">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">Show on Map</p>
            <div className="flex gap-1.5">
              {([
                { id: "jobs" as ClusterView, label: "Jobs", Icon: Building2, activeClass: "bg-primary text-white" },
                { id: "seekers" as ClusterView, label: "Seekers", Icon: Users, activeClass: "bg-teal-600 text-white" },
                { id: "both" as ClusterView, label: "Both", Icon: MapPin, activeClass: "bg-foreground text-white" },
              ] as const).map(({ id, label, Icon, activeClass }) => (
                <button
                  key={id}
                  onClick={() => setClusterView(id)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all ${
                    clusterView === id ? activeClass : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  }`}
                >
                  <Icon className="w-3 h-3" />{label}
                </button>
              ))}
            </div>
          </div>

          {/* Radius */}
          <div className="px-4 pt-4 pb-3 border-b border-border/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                Search Radius
              </div>
              <span className="text-primary font-bold text-sm">{radius[0]} km</span>
            </div>
            <Slider
              min={5} max={100} step={1}
              value={radius}
              onValueChange={handleRadiusChange}
              className="mb-1"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>5 km</span><span>25 km</span><span>50 km</span><span>100 km</span>
            </div>
          </div>

          {/* Location status */}
          <div className={`px-4 py-2 text-xs font-medium flex items-center gap-2 border-b border-border/30 ${
            geocoding ? "text-muted-foreground" :
            geocodedLabel ? "text-blue-700 bg-blue-50" :
            locating ? "text-muted-foreground" :
            userPos ? "text-green-600 bg-green-50" : "text-amber-600 bg-amber-50"
          }`}>
            {geocoding
              ? <><Loader2 className="w-3 h-3 animate-spin" /> Finding "{locationParam}"…</>
              : geocodedLabel
              ? <><MapPin className="w-3 h-3" /> Showing jobs near <span className="font-bold ml-0.5">{geocodedLabel}</span></>
              : locating
              ? <><Loader2 className="w-3 h-3 animate-spin" /> Getting your location…</>
              : userPos
              ? <><MapPin className="w-3 h-3" /> Using your live location</>
              : <><MapPin className="w-3 h-3" /> Location unavailable — showing San Francisco</>
            }
          </div>

          {/* Dynamic category filters */}
          {categories.length > 0 && (
            <div className="px-4 py-3 border-b border-border/30">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">Categories</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setCategoryFilter("all")}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                    categoryFilter === "all"
                      ? "bg-primary text-white"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  }`}
                >
                  All ({totalJobs})
                </button>
                {categories.map((cat) => {
                  const color = categoryColor(cat.name);
                  const isActive = categoryFilter === cat.name;
                  return (
                    <button
                      key={cat.name}
                      onClick={() => setCategoryFilter(isActive ? "all" : cat.name)}
                      className="px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all"
                      style={{
                        backgroundColor: isActive ? color : `${color}18`,
                        color: isActive ? "white" : color,
                        border: `1.5px solid ${color}40`,
                      }}
                    >
                      {cat.name} ({cat.count})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Count bar */}
          <div className="px-4 py-2.5 flex items-center justify-between border-b border-border/30">
            <div className="flex items-center gap-3 flex-wrap">
              {(clusterView === "jobs" || clusterView === "both") && (
                <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-primary" />
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-extrabold">
                    {loading ? <Loader2 className="w-3 h-3 animate-spin inline" /> : filteredJobs.length}
                  </span>
                  <span className="text-xs text-muted-foreground font-normal">jobs</span>
                </p>
              )}
              {(clusterView === "seekers" || clusterView === "both") && (
                <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-teal-600" />
                  <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-xs font-extrabold">
                    {seekerLoading ? <Loader2 className="w-3 h-3 animate-spin inline" /> : seekers.filter(s => s.geoLocation?.coordinates).length}
                  </span>
                  <span className="text-xs text-muted-foreground font-normal">seekers</span>
                </p>
              )}
            </div>
            {(search || typeFilter !== "all" || categoryFilter !== "all") && (
              <button
                onClick={() => { setSearch(""); setTypeFilter("all"); setCategoryFilter("all"); }}
                className="text-xs text-primary font-semibold hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Job list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="py-16 text-center text-muted-foreground">
                <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin opacity-30" />
                <p className="text-sm font-medium">Searching nearby jobs…</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm font-medium">
                  {totalJobs === 0
                    ? `No jobs found within ${radius[0]} km radius`
                    : "No jobs match your filters"}
                </p>
                {totalJobs === 0 && (
                  <p className="text-xs mt-1 opacity-60">Try increasing the radius</p>
                )}
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
                        style={{ backgroundColor: job.color }}
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
                          {job.salary && (
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <DollarSign className="w-2.5 h-2.5" />{job.salary}
                            </span>
                          )}
                          {job.distanceM > 0 && (
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <MapPin className="w-2.5 h-2.5" />{formatDistance(job.distanceM)}
                            </span>
                          )}
                        </div>
                        {job.category && (
                          <div className="mt-1.5">
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                              style={{ backgroundColor: `${job.color}18`, color: job.color }}
                            >
                              {job.category}
                            </span>
                          </div>
                        )}
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
            zoom={currentZoom}
            zoomControl={true}
            scrollWheelZoom={true}
            style={{ width: "100%", height: "100%" }}
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; OSM &copy; CARTO'
            />

            <SetViewOnce lat={mapCenter[0]} lng={mapCenter[1]} zoom={currentZoom} />
            <FlyToJob lat={flyTarget.lat} lng={flyTarget.lng} trigger={flyTrigger} />
            {userPos && (
              <FlyToRadius
                lat={userPos.lat}
                lng={userPos.lng}
                zoom={currentZoom}
                trigger={radiusTrigger}
              />
            )}

            {/* Radius circle + user marker */}
            {userPos && (
              <>
                <Circle
                  center={[userPos.lat, userPos.lng]}
                  radius={radius[0] * 1000}
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

            {/* Recruiter cluster — job pins */}
            {(clusterView === "jobs" || clusterView === "both") &&
              filteredJobs
                .filter((job) => job.lat !== 0 || job.lng !== 0)
                .map((job) => (
                  <Marker
                    key={job.id}
                    position={[job.lat, job.lng]}
                    icon={makeJobIcon(job.color, selected === job.id)}
                    eventHandlers={{ click: () => selectJob(job) }}
                  >
                    <Popup>
                      <div style={{ minWidth: 170, fontFamily: "sans-serif" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>💼 Job Posting</div>
                        <div style={{ fontWeight: 800, fontSize: 13, color: "#0f172a", marginBottom: 2 }}>{job.title}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>{job.company}</div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" as const, marginBottom: 6 }}>
                          <span style={{ fontSize: 11, background: "#f1f5f9", borderRadius: 4, padding: "2px 6px", color: "#475569" }}>
                            {TYPE_LABELS[job.type] ?? job.type}
                          </span>
                          {job.salary && (
                            <span style={{ fontSize: 11, background: "#f1f5f9", borderRadius: 4, padding: "2px 6px", color: "#475569" }}>
                              💰 {job.salary}
                            </span>
                          )}
                        </div>
                        {job.distanceM > 0 && (
                          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>
                            📍 {formatDistance(job.distanceM)}
                          </div>
                        )}
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

            {/* Seeker cluster — job seeker pins (teal) */}
            {(clusterView === "seekers" || clusterView === "both") &&
              seekers
                .filter((s) => s.geoLocation?.coordinates)
                .map((s) => {
                  const [lng, lat] = s.geoLocation!.coordinates;
                  return (
                    <Marker
                      key={s._id}
                      position={[lat, lng]}
                      icon={makeSeekerIcon(false)}
                    >
                      <Popup>
                        <div style={{ minWidth: 155, fontFamily: "sans-serif" }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: "#0d9488", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>👤 Job Seeker</div>
                          <div style={{ fontWeight: 800, fontSize: 13, color: "#0f172a", marginBottom: 2 }}>{s.fullName}</div>
                          {s.jobTitle && <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{s.jobTitle}</div>}
                          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>📍 {s.location}</div>
                          {s.skills && s.skills.length > 0 && (
                            <div style={{ display: "flex", gap: 3, flexWrap: "wrap" as const }}>
                              {s.skills.slice(0, 3).map(skill => (
                                <span key={skill} style={{ fontSize: 10, background: "#f0fdfa", borderRadius: 4, padding: "2px 5px", color: "#0f766e", border: "1px solid #99f6e4" }}>{skill}</span>
                              ))}
                            </div>
                          )}
                          {s.distance && (
                            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 6 }}>
                              📍 {(s.distance / 1000).toFixed(1)} km away
                            </div>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
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
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-extrabold flex-shrink-0"
                      style={{ backgroundColor: job.color }}
                    >
                      {job.logo}
                    </div>
                    <div>
                      <p className="text-sm font-extrabold">{job.title}</p>
                      <p className="text-xs text-muted-foreground">{job.company}</p>
                      {job.salary && <p className="text-xs text-primary font-semibold mt-0.5">{job.salary}</p>}
                      {job.distanceM > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">📍 {formatDistance(job.distanceM)}</p>
                      )}
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
