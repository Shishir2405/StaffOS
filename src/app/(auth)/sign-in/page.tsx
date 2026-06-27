"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiMailLine,
  RiLockPasswordLine,
  RiEyeLine,
  RiEyeOffLine,
  RiArrowRightLine,
  RiGoogleLine,
  RiLoader4Line,
  RiStarSFill,
} from "react-icons/ri";
import { toast } from "@/components/ui/custom-toast";
import { authClient } from "@/lib/auth-client";
import { buttonTap, fadeUp } from "@/lib/animations";

/* ─── Testimonials ───────────────────────────────────────── */
const testimonials = [
  {
    name: "Priya Mehta",
    role: "VP People, Zenith Corp",
    avatar: "PM",
    color: "#4A154B",
    text: "StaffOS cut our onboarding time in half. The interface just makes sense.",
  },
  {
    name: "Rahul Sharma",
    role: "HR Director, Novex",
    avatar: "RS",
    color: "#1C1208",
    text: "Finally an HRMS that HR teams actually enjoy using every single day.",
  },
];

/* ─── Field component ────────────────────────────────────── */
function Field({
  label,
  id,
  type,
  placeholder,
  value,
  onChange,
  disabled,
  icon,
  right,
  autoComplete,
}: {
  label: string;
  id: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  icon: React.ReactNode;
  right?: React.ReactNode;
  autoComplete?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block mb-2 label-caps"
      >
        {label}
      </label>
      <div className="s-input-wrap">
        <span style={{ color: "var(--text-3)", flexShrink: 0 }}>
          {icon}
        </span>
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          autoComplete={autoComplete}
          className="s-input"
        />
        {right}
      </div>
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────── */
export default function SignInPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
        rememberMe,
        callbackURL: "/dashboard",
      });
      if (error?.code) {
        toast.error("Invalid email or password. Please try again.");
        setIsLoading(false);
        return;
      }
      toast.success("Welcome back!");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div
      className="h-screen flex overflow-hidden"
      style={{ fontFamily: "var(--font-body)", background: "var(--bg-page)" }}
    >
      {/* ── LEFT -- Form ──────────────────────────────────── */}
      <section className="flex-1 flex items-center justify-center px-6 sm:px-8 py-12 overflow-y-auto">
        <div className="w-full max-w-[400px]">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2.5 mb-12"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "var(--brand)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span
              className="font-bold text-lg tracking-tight"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-1)" }}
            >
              StaffOS
            </span>
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="mb-8"
          >
            <h1
              className="mb-2.5"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-1)", fontSize: "32px", fontWeight: 800, letterSpacing: "-0.6px", lineHeight: 1.08 }}
            >
              Welcome{" "}
              <span style={{ color: "var(--brand)", fontStyle: "italic" }}>
                back.
              </span>
            </h1>
            <p className="text-sm" style={{ color: "var(--text-3)" }}>
              Sign in to your HRMS workspace to continue
            </p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.16 }}
              >
                <Field
                  label="Email Address"
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={setEmail}
                  disabled={isLoading}
                  icon={<RiMailLine size={16} />}
                  autoComplete="email"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.24 }}
              >
                <Field
                  label="Password"
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={setPassword}
                  disabled={isLoading}
                  icon={<RiLockPasswordLine size={16} />}
                  autoComplete="current-password"
                  right={
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      tabIndex={-1}
                      style={{ color: "var(--text-3)", flexShrink: 0 }}
                      className="hover:opacity-70 transition-opacity"
                    >
                      {showPw ? <RiEyeOffLine size={15} /> : <RiEyeLine size={15} />}
                    </button>
                  }
                />
              </motion.div>

              {/* Remember + Forgot */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.32 }}
                className="flex items-center justify-between pt-0.5"
              >
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="s-check"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="text-sm" style={{ color: "var(--text-3)" }}>
                    Keep me signed in
                  </span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm transition-opacity hover:opacity-70"
                  style={{ color: "var(--brand)" }}
                >
                  Forgot password?
                </Link>
              </motion.div>

              {/* Submit */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="pt-1"
              >
                <motion.button whileTap={buttonTap} type="submit" className="btn-primary" disabled={isLoading}>
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-2">
                        <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.75, repeat: Infinity, ease: "linear" }} className="inline-flex">
                          <RiLoader4Line size={16} />
                        </motion.span>
                        Signing in...
                      </motion.span>
                    ) : (
                      <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-2">
                        Sign In <RiArrowRightLine size={16} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.div>

              {/* Divider */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.48 }}
                className="relative flex items-center gap-4 py-1"
              >
                <div className="flex-1 h-px" style={{ background: "var(--border-1)" }} />
                <span className="text-xs shrink-0" style={{ color: "var(--text-3)" }}>
                  or continue with
                </span>
                <div className="flex-1 h-px" style={{ background: "var(--border-1)" }} />
              </motion.div>

              {/* Google */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.56 }}>
                <motion.button whileTap={buttonTap} type="button" className="btn-ghost">
                  <RiGoogleLine size={17} />
                  Continue with Google
                </motion.button>
              </motion.div>

              {/* Demo logins */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.62 }}
                className="rounded-xl p-3"
                style={{ background: "var(--brand-xlight)", border: "1px solid var(--border-1)" }}
              >
                <p className="label-caps mb-2">Demo logins — tap to fill</p>
                <div className="grid gap-1.5">
                  {[
                    { r: "Admin", e: "admin@staffos.com", p: "Admin@123" },
                    { r: "HR Manager", e: "hr@staffos.com", p: "Hr@12345" },
                    { r: "Employee", e: "employee@staffos.com", p: "Employee@123" },
                  ].map((c) => (
                    <button
                      key={c.e}
                      type="button"
                      onClick={() => { setEmail(c.e); setPassword(c.p); }}
                      className="flex items-center justify-between gap-2 text-left rounded-lg px-2.5 py-1.5 transition-opacity hover:opacity-80"
                      style={{ background: "var(--bg-raised)", border: "1px solid var(--border-1)" }}
                    >
                      <span className="text-xs font-semibold shrink-0" style={{ color: "var(--brand)" }}>{c.r}</span>
                      <span className="text-[11px] truncate" style={{ color: "var(--text-3)" }}>{c.e} · {c.p}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          </form>

          {/* Sign up */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.64 }}
            className="text-sm text-center mt-7"
            style={{ color: "var(--text-3)" }}
          >
            Don't have an account?{" "}
            <Link href="/sign-up" className="font-medium transition-opacity hover:opacity-70" style={{ color: "var(--brand)" }}>
              Create one free
            </Link>
          </motion.p>

          {/* Security note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.72 }}
            className="flex items-center justify-center gap-1.5 mt-6"
          >
            <span className="text-xs" style={{ color: "var(--text-3)", opacity: 0.5 }}>
              256-bit SSL encrypted
            </span>
          </motion.div>
        </div>
      </section>

      {/* ── RIGHT -- Hero + Testimonials ──────────────────── */}
      <motion.section
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:block relative flex-1 m-3"
        style={{ borderRadius: "var(--r-xl)", overflow: "hidden" }}
      >
        {/* Hero image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80')` }}
        />
        {/* Overlay -- warm dark */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(160deg, rgba(30,10,35,0.78) 0%, rgba(74,21,75,0.88) 100%)" }}
        />

        {/* Top-left brand mark */}
        <div className="absolute top-8 left-8 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1C1208" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-white font-bold text-base" style={{ fontFamily: "var(--font-display)" }}>
            StaffOS
          </span>
        </div>

        {/* Center headline */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-12 text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-xs font-medium tracking-[0.2em] uppercase mb-4"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Trusted by 12,000+ companies
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.62, duration: 0.65 }}
            className="text-4xl font-bold text-white leading-[1.08] mb-5"
            style={{ fontFamily: "var(--font-display)" }}
          >
            HR that works
            <br />
            <span style={{ color: "var(--brand-light)", fontStyle: "italic" }}>
              as hard as you do
            </span>
          </motion.h2>

          {/* Stars */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }} className="flex items-center gap-1 mb-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <RiStarSFill key={i} size={14} color="#FDE68A" />
            ))}
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.82 }} className="text-xs" style={{ color: "rgba(255,255,255,0.42)" }}>
            4.9 / 5 from 3,200+ reviews
          </motion.p>
        </div>

        {/* Testimonial cards */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 px-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + i * 0.15, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className={`tc ${i === 1 ? "hidden xl:block" : ""}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
                  style={{ background: t.color }}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-medium text-white leading-tight">{t.name}</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.50)" }}>{t.role}</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.72)" }}>
                &ldquo;{t.text}&rdquo;
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
