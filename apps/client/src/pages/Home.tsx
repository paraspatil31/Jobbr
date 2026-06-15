import { useState, lazy, Suspense } from "react";
import { Link, useLocation } from "wouter";
import { MapPin, Briefcase, Linkedin, Twitter, Github, Search, Filter, ChevronDown, ExternalLink } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

const JobMap = lazy(() => import("@/components/JobMap"));
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Home() {
  const [, navigate] = useLocation();
  const [radius, setRadius] = useState([25]);
  const [seekerRadius, setSeekerRadius] = useState([10]);
  const [language, setLanguage] = useState("EN");
  const [jobType, setJobType] = useState("");
  const { scrollY } = useScroll();


  // Hero: long gradual fade — starts immediately, fully gone at 520px
  const heroOpacity = useTransform(scrollY, [0, 520], [1, 0]);
  const heroScale   = useTransform(scrollY, [0, 520], [1, 0.88]);
  const heroY       = useTransform(scrollY, [0, 520], [0, -80]);

  // Navbar: purely scroll-driven, no React re-renders
  // Starts appearing at 300px (hero is ~58% faded), fully visible at 480px
  const navbarY       = useTransform(scrollY, [300, 480], [-72, 0]);
  const navbarOpacity = useTransform(scrollY, [300, 480], [0, 1]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">

      {/* ── Sticky Navbar — scroll-driven, no React re-renders ── */}
      <motion.header
        style={{ y: navbarY, opacity: navbarOpacity }}
        className="fixed top-0 left-0 right-0 z-50 w-full backdrop-blur-md bg-white/80 border-b border-white/40"
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center text-primary">
              <MapPin className="w-6 h-6 absolute" />
              <Briefcase className="w-3 h-3 z-10 text-foreground" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-foreground">
              JobNearby
            </span>
          </div>

          {/* Center: name */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 font-bold text-lg tracking-tight">
            JobNearby
          </div>

          {/* Right: language + actions */}
          <div className="flex items-center gap-4">
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger
                className="w-[80px] bg-transparent border-none shadow-none font-medium focus:ring-0"
                data-testid="select-language"
              >
                <SelectValue placeholder="Lang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EN">EN</SelectItem>
                <SelectItem value="FR">FR</SelectItem>
                <SelectItem value="ES">ES</SelectItem>
                <SelectItem value="DE">DE</SelectItem>
                <SelectItem value="AR">AR</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="hidden sm:inline-flex" data-testid="btn-signin" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
            <Button data-testid="btn-getstarted" onClick={() => navigate("/auth")}>Get Started</Button>
          </div>
        </div>
      </motion.header>

      {/* ── Full-screen Hero — visible at top, fades/scales out on scroll ── */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        className="fixed inset-0 z-40 flex flex-col items-center justify-center pointer-events-none select-none"
        aria-hidden="true"
      >
        {/* Dot-grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_40%,_#fef9c3_0%,_#f8fafc_60%)]" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Animated glow blob */}
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.25, 0.4, 0.25] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[520px] h-[520px] rounded-full bg-primary/30 blur-[100px]"
        />

        {/* Name */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative z-10 text-center px-6"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="relative flex items-center justify-center text-primary">
              <MapPin className="w-10 h-10" strokeWidth={2.5} />
            </div>
          </div>

          <h1 className="text-7xl sm:text-8xl md:text-9xl font-extrabold tracking-tighter leading-none text-foreground">
            Job<span className="text-primary">Nearby</span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            className="mt-6 text-lg md:text-xl text-muted-foreground font-medium max-w-md mx-auto"
          >
            Connecting talent with opportunity — right in your neighbourhood.
          </motion.p>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-12 flex flex-col items-center gap-2 text-muted-foreground"
        >
          <span className="text-xs font-medium tracking-widest uppercase">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ── Spacer so content starts below the hero ── */}
      <div className="h-screen" aria-hidden />

      <main className="flex-1 relative z-10 bg-background">
        {/* Section 1: Map Explorer */}
        <section className="relative w-full h-screen min-h-[600px] flex flex-col overflow-hidden">
          {/* Real Map Background */}
          <Suspense fallback={<div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-slate-200" />}>
            <JobMap radius={radius[0]} />
          </Suspense>

          {/* Gradient overlay so text stays readable */}
          <div className="absolute inset-0 z-[1] pointer-events-none"
            style={{
              background: "linear-gradient(to bottom, rgba(248,250,252,0.72) 0%, rgba(248,250,252,0.45) 40%, rgba(248,250,252,0.15) 70%, transparent 100%)",
            }}
          />

          <div className="container mx-auto px-4 z-10 relative pt-16">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="max-w-2xl mx-auto text-center mb-8"
            >
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                Find Jobs Near You
              </h2>
              <p className="text-muted-foreground text-lg">
                Connect with local opportunities within your preferred radius.
              </p>
            </motion.div>

            {/* Search Bar — clicking navigates to full Map Explorer */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              onClick={() => navigate("/explore")}
              className="max-w-3xl mx-auto bg-white/70 backdrop-blur-md border border-white/50 shadow-xl rounded-full p-2 flex items-center gap-2 mb-12 cursor-pointer hover:shadow-2xl hover:bg-white/90 transition-all group"
            >
              <div className="pl-4 text-muted-foreground">
                <Search className="w-5 h-5" />
              </div>
              <span className="flex-1 text-base text-muted-foreground pl-1 select-none">
                Search jobs, skills, companies near you…
              </span>
              <Button className="rounded-full px-8 gap-2 group-hover:gap-3 transition-all" data-testid="btn-map-search">
                Explore Map <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </motion.div>
          </div>

          {/* Map Controls */}
          <div className="absolute bottom-8 left-0 right-0 px-4 md:px-8 z-10 flex flex-col md:flex-row justify-between items-end gap-4 pointer-events-none">
            {/* Legend Card */}
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="bg-white/70 backdrop-blur-sm border border-white/50 p-4 rounded-2xl shadow-lg pointer-events-auto w-full md:w-auto"
            >
              <h3 className="font-semibold mb-3 text-sm">Job Categories</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span>Tech &amp; Engineering</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span>Sales &amp; Marketing</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Healthcare</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span>Design &amp; Creative</span>
                </div>
              </div>
            </motion.div>

            {/* Radius Selector Card */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="bg-white/70 backdrop-blur-sm border border-white/50 p-6 rounded-2xl shadow-lg pointer-events-auto w-full md:w-[320px]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Search Radius
                </h3>
                <span className="text-primary font-bold">{radius[0]} km</span>
              </div>
              <Slider
                defaultValue={[25]}
                max={50}
                min={5}
                step={5}
                value={radius}
                onValueChange={setRadius}
                className="mb-6"
                data-testid="slider-map-radius"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5km</span>
                <span>25km</span>
                <span>50km</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 2: Profile Edit Panel */}
        <section className="py-24 bg-background relative">
          <div className="absolute inset-0 bg-primary/5 -skew-y-3 transform origin-top-left z-0" />

          <div className="container mx-auto px-4 z-10 relative">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-extrabold tracking-tight mb-4">
                Join the Network
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Whether you're looking for your next career move or searching for the perfect local candidate, JobNearby makes it seamless.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Job Seeker Card */}
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-white/70 backdrop-blur-sm border border-white/50 shadow-xl rounded-3xl p-8"
              >
                <h3 className="text-2xl font-bold mb-6 text-center">Your Profile</h3>

                <div className="flex justify-center mb-8">
                  <Avatar className="w-24 h-24 border-4 border-white shadow-md bg-gradient-to-br from-primary to-orange-300">
                    <AvatarFallback className="text-2xl font-bold bg-transparent text-primary-foreground">JN</AvatarFallback>
                  </Avatar>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Full Name</label>
                    <Input placeholder="Jane Doe" data-testid="input-seeker-name" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role Seeking</label>
                    <Input placeholder="Senior Frontend Developer" data-testid="input-seeker-role" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Skills</label>
                    <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-white/50">
                      <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md">React</span>
                      <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md">TypeScript</span>
                      <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md">Node.js</span>
                      <Input placeholder="Add skill..." className="border-0 h-6 p-0 w-24 bg-transparent focus-visible:ring-0 shadow-none text-xs" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Location</label>
                    <Input placeholder="San Francisco, CA" data-testid="input-seeker-location" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Bio</label>
                    <Textarea placeholder="Tell recruiters about your experience..." className="resize-none" data-testid="input-seeker-bio" />
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex justify-between text-sm">
                      <label className="font-medium">Preferred Commute Radius</label>
                      <span className="font-bold text-primary">{seekerRadius[0]} km</span>
                    </div>
                    <Slider
                      max={100}
                      min={5}
                      step={1}
                      value={seekerRadius}
                      onValueChange={setSeekerRadius}
                      data-testid="slider-seeker-radius"
                    />
                  </div>

                  <div className="pt-4 space-y-3">
                    <Button variant="outline" className="w-full bg-white/50" data-testid="btn-seeker-resume">
                      Upload Resume
                    </Button>
                    <Button className="w-full text-primary-foreground font-semibold" data-testid="btn-seeker-save">
                      Save Profile
                    </Button>
                  </div>
                </div>
              </motion.div>

              {/* Recruiter Card */}
              <motion.div
                initial={{ y: 40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-white/70 backdrop-blur-sm border border-white/50 shadow-xl rounded-3xl p-8"
              >
                <h3 className="text-2xl font-bold mb-6 text-center">Post a Job</h3>

                <div className="flex justify-center mb-8">
                  <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-white/50 text-muted-foreground flex-col gap-1 cursor-pointer hover:bg-white transition-colors">
                    <Briefcase className="w-6 h-6" />
                    <span className="text-xs font-medium">Add Logo</span>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company Name</label>
                    <Input placeholder="Acme Corp" data-testid="input-job-company" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Job Title</label>
                    <Input placeholder="Product Designer" data-testid="input-job-title" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Job Type</label>
                    <Select value={jobType} onValueChange={setJobType}>
                      <SelectTrigger className="bg-white/50" data-testid="select-job-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">Full-time</SelectItem>
                        <SelectItem value="part-time">Part-time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="freelance">Freelance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Office Location</label>
                    <Input placeholder="123 Market St, City" data-testid="input-job-location" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Salary Range</label>
                    <Input placeholder="$80,000 - $120,000" data-testid="input-job-salary" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Required Skills</label>
                    <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-white/50">
                      <span className="px-2 py-1 bg-primary/10 text-primary-foreground text-xs rounded-md">Figma</span>
                      <span className="px-2 py-1 bg-primary/10 text-primary-foreground text-xs rounded-md">UX Research</span>
                      <Input placeholder="Add skill..." className="border-0 h-6 p-0 w-24 bg-transparent focus-visible:ring-0 shadow-none text-xs" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Job Description</label>
                    <Textarea placeholder="Describe the role and responsibilities..." className="resize-none h-24" data-testid="input-job-desc" />
                  </div>

                  <div className="pt-4">
                    <Button className="w-full text-primary-foreground font-semibold" data-testid="btn-job-publish">
                      Publish Job Listing
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
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
              <a href="#" className="hover:text-primary transition-colors" data-testid="link-linkedin"><Linkedin className="w-5 h-5" /></a>
              <a href="#" className="hover:text-primary transition-colors" data-testid="link-twitter"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="hover:text-primary transition-colors" data-testid="link-github"><Github className="w-5 h-5" /></a>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground mt-8">
            &copy; {new Date().getFullYear()} JobNearby. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
