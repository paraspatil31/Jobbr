import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  MapPin, UserSearch, Building2, CheckCircle2,
  ArrowLeft, Eye, EyeOff, Briefcase, Users, TrendingUp, Globe, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth, saveSession } from "@/lib/api";

type Role = "seeker" | "recruiter" | null;
type Tab = "signin" | "signup";

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const signUpSeekerSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  location: z.string().min(2, "Location is required"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const signUpRecruiterSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  fullName: z.string().min(2, "Your name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  location: z.string().min(2, "Location is required"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-destructive text-xs mt-1 font-medium"
    >
      {message}
    </motion.p>
  );
}

function PasswordInput({ id, testId, placeholder, registration }: {
  id: string; testId: string; placeholder?: string;
  registration: ReturnType<ReturnType<typeof useForm>["register"]>;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        placeholder={placeholder ?? "••••••••"}
        className="pr-10 bg-white/60"
        data-testid={testId}
        {...registration}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir * 80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -80, opacity: 0 }),
};

export default function Auth() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [dir, setDir] = useState(1);
  const [role, setRole] = useState<Role>(null);
  const [activeTab, setActiveTab] = useState<Tab>("signin");
  const [userName, setUserName] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const goTo = (next: 1 | 2 | 3) => {
    setDir(next > step ? 1 : -1);
    setApiError(null);
    setStep(next);
  };

  const signInForm = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });
  const signUpSeekerForm = useForm({
    resolver: zodResolver(signUpSeekerSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "", location: "" },
  });
  const signUpRecruiterForm = useForm({
    resolver: zodResolver(signUpRecruiterSchema),
    defaultValues: { companyName: "", fullName: "", email: "", password: "", confirmPassword: "", location: "" },
  });

  const onSignIn = async (data: z.infer<typeof signInSchema>) => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await auth.login({ email: data.email, password: data.password });
      saveSession(res);
      setUserName(res.user.fullName || res.user.email.split("@")[0]);
      setRole(res.user.role);
      goTo(3);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const onSignUpSeeker = async (data: z.infer<typeof signUpSeekerSchema>) => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await auth.register({
        role: "seeker",
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        location: data.location,
      });
      saveSession(res);
      setUserName(res.user.fullName);
      goTo(3);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const onSignUpRecruiter = async (data: z.infer<typeof signUpRecruiterSchema>) => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await auth.register({
        role: "recruiter",
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        location: data.location,
        companyName: data.companyName,
      });
      saveSession(res);
      setUserName(res.user.fullName);
      goTo(3);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === 3) {
      const dest = role === "recruiter" ? "/dashboard/recruiter" : "/dashboard/seeker";
      const t = setTimeout(() => navigate(dest), 2200);
      return () => clearTimeout(t);
    }
  }, [step, navigate, role]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden font-sans">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_40%,_#fef9c3_0%,_#f8fafc_65%)] -z-10" />
      <div
        className="absolute inset-0 opacity-40 -z-10"
        style={{
          backgroundImage: "radial-gradient(circle, #cbd5e1 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.22, 0.38, 0.22] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/25 blur-[120px] -z-10"
      />

      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-5 md:px-10">
        <Link href="/" className="flex items-center gap-2 group" data-testid="link-logo-home">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary group-hover:bg-primary/25 transition-colors">
            <MapPin className="w-4 h-4" strokeWidth={2.5} />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-foreground">JobNearby</span>
        </Link>
        <Link href="/" data-testid="link-back-home">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 rounded-full bg-white/70 backdrop-blur-sm border-white/60 hover:bg-white shadow-sm font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Button>
        </Link>
      </header>

      {/* Step progress dots */}
      {step < 3 && (
        <div className="flex justify-center gap-2 mt-2 mb-6">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step >= s ? "w-8 bg-primary" : "w-4 bg-border"
              }`}
            />
          ))}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <AnimatePresence mode="wait" custom={dir}>

          {/* Step 1 — Role Selection */}
          {step === 1 && (
            <motion.div
              key="step1"
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="w-full max-w-3xl flex flex-col items-center"
            >
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center mb-10"
              >
                <span className="inline-block mb-4 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold tracking-wide uppercase">
                  Get started
                </span>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3 text-foreground">
                  Welcome to <span className="text-primary">JobNearby</span>
                </h1>
                <p className="text-muted-foreground text-base max-w-sm mx-auto">
                  Tell us who you are so we can personalise your experience.
                </p>
              </motion.div>

              <div className="grid md:grid-cols-2 gap-5 w-full max-w-2xl mb-8">
                {/* Seeker card */}
                <motion.div
                  whileHover={{ y: -6, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.12), 0 0 0 2px hsl(var(--primary))" }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => setRole("seeker")}
                  data-testid="card-role-seeker"
                  className={`relative bg-white/75 backdrop-blur-sm border-2 rounded-3xl p-8 cursor-pointer transition-all duration-200 ${
                    role === "seeker"
                      ? "border-primary shadow-lg shadow-primary/10"
                      : "border-white/60 shadow-md hover:border-primary/30"
                  }`}
                >
                  {role === "seeker" && (
                    <motion.div
                      layoutId="selected-dot"
                      className="absolute top-5 right-5 w-5 h-5 rounded-full bg-primary shadow-sm flex items-center justify-center"
                    >
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </motion.div>
                  )}
                  <div className="w-14 h-14 rounded-2xl bg-primary/12 flex items-center justify-center text-primary mb-5 shadow-sm">
                    <UserSearch className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-1.5">I'm a Job Seeker</h3>
                  <p className="text-muted-foreground text-sm mb-5">Find local opportunities within your preferred radius.</p>
                  <ul className="space-y-1.5">
                    {["Browse nearby jobs", "Set commute radius", "One-tap apply"].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Recruiter card */}
                <motion.div
                  whileHover={{ y: -6, boxShadow: "0 20px 40px -12px rgba(0,0,0,0.12), 0 0 0 2px hsl(var(--primary))" }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => setRole("recruiter")}
                  data-testid="card-role-recruiter"
                  className={`relative bg-white/75 backdrop-blur-sm border-2 rounded-3xl p-8 cursor-pointer transition-all duration-200 ${
                    role === "recruiter"
                      ? "border-primary shadow-lg shadow-primary/10"
                      : "border-white/60 shadow-md hover:border-primary/30"
                  }`}
                >
                  {role === "recruiter" && (
                    <motion.div
                      layoutId="selected-dot"
                      className="absolute top-5 right-5 w-5 h-5 rounded-full bg-primary shadow-sm flex items-center justify-center"
                    >
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </motion.div>
                  )}
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 mb-5 shadow-sm">
                    <Building2 className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-1.5">I'm a Recruiter</h3>
                  <p className="text-muted-foreground text-sm mb-5">Post local jobs and discover nearby talent fast.</p>
                  <ul className="space-y-1.5">
                    {["Post job listings", "Reach local talent", "Manage applicants"].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </div>

              <Button
                size="lg"
                className="px-14 rounded-full font-bold text-base shadow-md shadow-primary/20"
                disabled={!role}
                onClick={() => goTo(2)}
                data-testid="btn-continue-role"
              >
                Continue →
              </Button>

              <div className="flex items-center gap-6 mt-10 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-primary" />12k+ Jobs posted</div>
                <div className="h-3 w-px bg-border" />
                <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-primary" />8k+ Seekers</div>
                <div className="h-3 w-px bg-border" />
                <div className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-primary" />50+ Cities</div>
                <div className="h-3 w-px bg-border" />
                <div className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-primary" />94% match rate</div>
              </div>
            </motion.div>
          )}

          {/* Step 2 — Auth Form */}
          {step === 2 && (
            <motion.div
              key="step2"
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="w-full max-w-md"
            >
              <div className="bg-white/80 backdrop-blur-md border border-white/60 shadow-2xl shadow-black/8 rounded-3xl overflow-hidden">
                <div className="px-8 pt-8 pb-6 border-b border-border/50">
                  <button
                    onClick={() => goTo(1)}
                    className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-5"
                    data-testid="btn-back"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-extrabold tracking-tight">
                        {activeTab === "signin" ? "Sign in" : "Create account"}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {activeTab === "signin"
                          ? "Welcome back! Enter your details."
                          : "Start your journey with JobNearby."}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                      role === "seeker" ? "bg-primary/12 text-primary" : "bg-blue-500/10 text-blue-600"
                    }`}>
                      {role === "seeker"
                        ? <><UserSearch className="w-3 h-3" /> Job Seeker</>
                        : <><Building2 className="w-3 h-3" /> Recruiter</>}
                    </span>
                  </div>
                </div>

                <div className="px-8 pt-6">
                  {/* API error banner */}
                  <AnimatePresence>
                    {apiError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-start gap-2.5 bg-destructive/8 border border-destructive/20 text-destructive rounded-xl px-4 py-3 mb-4 text-sm font-medium overflow-hidden"
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        {apiError}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Tab switcher */}
                  <div className="flex p-1 bg-secondary/60 rounded-xl mb-6">
                    {(["signin", "signup"] as Tab[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => { setActiveTab(t); setApiError(null); }}
                        data-testid={`tab-${t}`}
                        className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all duration-200 ${
                          activeTab === t
                            ? "bg-white shadow-sm text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t === "signin" ? "Sign In" : "Sign Up"}
                      </button>
                    ))}
                  </div>

                  {/* Sign In */}
                  {activeTab === "signin" && (
                    <form onSubmit={signInForm.handleSubmit(onSignIn)} className="space-y-4 pb-8">
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                        <Label htmlFor="si-email" className="text-sm font-medium mb-1.5 block">Email</Label>
                        <Input id="si-email" type="email" placeholder="you@example.com"
                          {...signInForm.register("email")} data-testid="input-signin-email" className="bg-white/60"
                        />
                        <FieldError message={signInForm.formState.errors.email?.message} />
                      </motion.div>
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <Label htmlFor="si-password" className="text-sm font-medium">Password</Label>
                          <a href="#" className="text-xs text-primary font-medium hover:underline">Forgot password?</a>
                        </div>
                        <PasswordInput id="si-password" testId="input-signin-password" registration={signInForm.register("password")} />
                        <FieldError message={signInForm.formState.errors.password?.message} />
                      </motion.div>
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="pt-1">
                        <Button type="submit" disabled={loading} className="w-full font-bold rounded-xl h-11 shadow-sm shadow-primary/20" data-testid="btn-submit-signin">
                          {loading ? "Signing in…" : "Sign In"}
                        </Button>
                      </motion.div>
                    </form>
                  )}

                  {/* Sign Up — Job Seeker */}
                  {activeTab === "signup" && role === "seeker" && (
                    <form onSubmit={signUpSeekerForm.handleSubmit(onSignUpSeeker)} className="space-y-3.5 pb-8">
                      {[
                        { id: "sk-name", label: "Full Name", placeholder: "Jane Doe", field: "fullName", testId: "input-seeker-name" },
                        { id: "sk-email", label: "Email", placeholder: "you@example.com", field: "email", testId: "input-seeker-email", type: "email" },
                        { id: "sk-loc", label: "City / Location", placeholder: "San Francisco, CA", field: "location", testId: "input-seeker-location" },
                      ].map(({ id, label, placeholder, field, testId, type }, i) => (
                        <motion.div key={id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 + 0.05 }}>
                          <Label htmlFor={id} className="text-sm font-medium mb-1.5 block">{label}</Label>
                          <Input id={id} type={type ?? "text"} placeholder={placeholder}
                            {...signUpSeekerForm.register(field as "fullName" | "email" | "location")}
                            data-testid={testId} className="bg-white/60"
                          />
                          <FieldError message={signUpSeekerForm.formState.errors[field as keyof typeof signUpSeekerSchema.shape]?.message} />
                        </motion.div>
                      ))}
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <Label htmlFor="sk-pw" className="text-sm font-medium mb-1.5 block">Password</Label>
                        <PasswordInput id="sk-pw" testId="input-seeker-password" registration={signUpSeekerForm.register("password")} />
                        <FieldError message={signUpSeekerForm.formState.errors.password?.message} />
                      </motion.div>
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                        <Label htmlFor="sk-cpw" className="text-sm font-medium mb-1.5 block">Confirm Password</Label>
                        <PasswordInput id="sk-cpw" testId="input-seeker-confirm-password" registration={signUpSeekerForm.register("confirmPassword")} />
                        <FieldError message={signUpSeekerForm.formState.errors.confirmPassword?.message} />
                      </motion.div>
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="pt-1">
                        <Button type="submit" disabled={loading} className="w-full font-bold rounded-xl h-11 shadow-sm shadow-primary/20" data-testid="btn-submit-signup-seeker">
                          {loading ? "Creating account…" : "Create Account"}
                        </Button>
                      </motion.div>
                    </form>
                  )}

                  {/* Sign Up — Recruiter */}
                  {activeTab === "signup" && role === "recruiter" && (
                    <form onSubmit={signUpRecruiterForm.handleSubmit(onSignUpRecruiter)} className="space-y-3.5 pb-8">
                      {[
                        { id: "rc-co", label: "Company Name", placeholder: "Acme Corp", field: "companyName", testId: "input-recruiter-company" },
                        { id: "rc-name", label: "Your Name", placeholder: "John Doe", field: "fullName", testId: "input-recruiter-name" },
                        { id: "rc-email", label: "Work Email", placeholder: "you@acme.com", field: "email", testId: "input-recruiter-email", type: "email" },
                        { id: "rc-loc", label: "Company Location", placeholder: "San Francisco, CA", field: "location", testId: "input-recruiter-location" },
                      ].map(({ id, label, placeholder, field, testId, type }, i) => (
                        <motion.div key={id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 + 0.05 }}>
                          <Label htmlFor={id} className="text-sm font-medium mb-1.5 block">{label}</Label>
                          <Input id={id} type={type ?? "text"} placeholder={placeholder}
                            {...signUpRecruiterForm.register(field as "companyName" | "fullName" | "email" | "location")}
                            data-testid={testId} className="bg-white/60"
                          />
                          <FieldError message={signUpRecruiterForm.formState.errors[field as keyof typeof signUpRecruiterSchema.shape]?.message} />
                        </motion.div>
                      ))}
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                        <Label htmlFor="rc-pw" className="text-sm font-medium mb-1.5 block">Password</Label>
                        <PasswordInput id="rc-pw" testId="input-recruiter-password" registration={signUpRecruiterForm.register("password")} />
                        <FieldError message={signUpRecruiterForm.formState.errors.password?.message} />
                      </motion.div>
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <Label htmlFor="rc-cpw" className="text-sm font-medium mb-1.5 block">Confirm Password</Label>
                        <PasswordInput id="rc-cpw" testId="input-recruiter-confirm-password" registration={signUpRecruiterForm.register("confirmPassword")} />
                        <FieldError message={signUpRecruiterForm.formState.errors.confirmPassword?.message} />
                      </motion.div>
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="pt-1">
                        <Button type="submit" disabled={loading} className="w-full font-bold rounded-xl h-11 shadow-sm shadow-primary/20" data-testid="btn-submit-signup-recruiter">
                          {loading ? "Creating account…" : "Create Account"}
                        </Button>
                      </motion.div>
                    </form>
                  )}
                </div>
              </div>

              <p className="text-center text-xs text-muted-foreground mt-5">
                By continuing you agree to our{" "}
                <a href="#" className="underline hover:text-foreground">Terms</a> and{" "}
                <a href="#" className="underline hover:text-foreground">Privacy Policy</a>.
              </p>
            </motion.div>
          )}

          {/* Step 3 — Success */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", duration: 0.55 }}
              className="flex flex-col items-center text-center px-4"
            >
              <div className="relative mb-8">
                <motion.div
                  animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.4, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-green-400/30 blur-xl"
                />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2, stiffness: 200, damping: 12 }}
                  className="relative w-28 h-28 rounded-full bg-green-500/10 border-2 border-green-500/20 flex items-center justify-center"
                >
                  <CheckCircle2 className="w-14 h-14 text-green-500" strokeWidth={1.5} />
                </motion.div>
              </div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-extrabold mb-2"
              >
                {activeTab === "signin" ? "Welcome back" : "You're all set"},{" "}
                <span className="text-primary">{userName}</span>!
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                className="text-muted-foreground"
              >
                Taking you to your dashboard…
              </motion.p>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.7, duration: 1.5, ease: "linear" }}
                style={{ transformOrigin: "left" }}
                className="mt-8 w-48 h-1 rounded-full bg-primary/40"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
