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
  RiShieldCheckLine,
  RiLoader4Line,
  RiStarSFill,
} from "react-icons/ri";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

/* ─── Testimonials ───────────────────────────────────────── */
const testimonials = [
  {
    name: "Priya Mehta",
    role: "VP People, Zenith Corp",
    avatar: "PM",
    color: "#E11D48",
    text: "StaffOS cut our onboarding time in half. The interface just makes sense.",
  },
  {
    name: "Rahul Sharma",
    role: "HR Director, Novex",
    avatar: "RS",
    color: "#1E2040",
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
        className="block mb-2 text-xs font-medium tracking-[0.10em] uppercase"
        style={{
          color: "var(--muted-foreground)",
          fontFamily: "var(--font-dm-sans)",
        }}
      >
        {label}
      </label>
      <div className="s-input-wrap">
        <span style={{ color: "var(--muted-foreground)", flexShrink: 0 }}>
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
      style={{ fontFamily: "var(--font-dm-sans)" }}
    >
      {/* ── LEFT — Form ──────────────────────────────────── */}
      <section className="flex-1 flex items-center justify-center px-8 py-12 overflow-y-auto">
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
              style={{ background: "var(--brand-navy)" }}
            >
              <RiShieldCheckLine size={18} color="white" />
            </div>
            <span
              className="font-semibold text-lg tracking-tight"
              style={{
                fontFamily: "var(--font-playfair)",
                color: "var(--foreground)",
              }}
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
              className="text-[2.6rem] font-semibold mb-2.5 leading-[1.06]"
              style={{
                fontFamily: "var(--font-playfair)",
                color: "var(--foreground)",
              }}
            >
              Welcome{" "}
              <span style={{ color: "var(--brand-rose)", fontStyle: "italic" }}>
                back.
              </span>
            </h1>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
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
                  placeholder="••••••••••"
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
                      style={{
                        color: "var(--muted-foreground)",
                        flexShrink: 0,
                      }}
                      className="hover:opacity-70 transition-opacity"
                    >
                      {showPw ? (
                        <RiEyeOffLine size={15} />
                      ) : (
                        <RiEyeLine size={15} />
                      )}
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
                  <span
                    className="text-sm"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Keep me signed in
                  </span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm transition-opacity hover:opacity-70"
                  style={{ color: "var(--brand-rose)" }}
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
                <button type="submit" className="btn-navy" disabled={isLoading}>
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <motion.span
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center gap-2"
                      >
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 0.75,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="inline-flex"
                        >
                          <RiLoader4Line size={16} />
                        </motion.span>
                        Signing in…
                      </motion.span>
                    ) : (
                      <motion.span
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center gap-2"
                      >
                        Sign In <RiArrowRightLine size={16} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>

              {/* Divider */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.48 }}
                className="relative flex items-center gap-4 py-1"
              >
                <div
                  className="flex-1 h-px"
                  style={{ background: "var(--border)" }}
                />
                <span
                  className="text-xs flex-shrink-0"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  or continue with
                </span>
                <div
                  className="flex-1 h-px"
                  style={{ background: "var(--border)" }}
                />
              </motion.div>

              {/* Google */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.56 }}
              >
                <button type="button" className="btn-ghost">
                  <RiGoogleLine size={17} />
                  Continue with Google
                </button>
              </motion.div>
            </div>
          </form>

          {/* Sign up */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.64 }}
            className="text-sm text-center mt-7"
            style={{ color: "var(--muted-foreground)" }}
          >
            Don't have an account?{" "}
            <Link
              href="/sign-up"
              className="font-medium transition-opacity hover:opacity-70"
              style={{ color: "var(--brand-rose)" }}
            >
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
            <RiShieldCheckLine
              size={12}
              style={{ color: "var(--muted-foreground)", opacity: 0.5 }}
            />
            <span
              className="text-xs"
              style={{ color: "var(--muted-foreground)", opacity: 0.5 }}
            >
              256-bit SSL · SOC 2 Type II
            </span>
          </motion.div>
        </div>
      </section>

      {/* ── RIGHT — Hero + Testimonials ──────────────────── */}
      <motion.section
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:block relative flex-1 m-3"
        style={{ borderRadius: "20px", overflow: "hidden" }}
      >
        {/* Hero image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80')`,
          }}
        />
        {/* Overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, oklch(0.198 0.068 262 / 0.55) 0%, oklch(0.115 0.030 258 / 0.70) 100%)",
          }}
        />

        {/* Top-left brand mark */}
        <div className="absolute top-8 left-8 flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "white" }}
          >
            <RiShieldCheckLine size={16} color="var(--brand-navy)" />
          </div>
          <span
            className="text-white font-semibold text-base"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
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
            style={{ color: "oklch(1 0 0 / 0.55)" }}
          >
            Trusted by 12,000+ companies
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.62, duration: 0.65 }}
            className="text-4xl font-bold text-white leading-[1.08] mb-5"
            style={{ fontFamily: "var(--font-playfair)" }}
          >
            HR that works
            <br />
            <span
              style={{ color: "var(--brand-rose-muted)", fontStyle: "italic" }}
            >
              as hard as you do
            </span>
          </motion.h2>

          {/* Stars */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.75 }}
            className="flex items-center gap-1 mb-1.5"
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <RiStarSFill key={i} size={14} color="#FCD34D" />
            ))}
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.82 }}
            className="text-xs"
            style={{ color: "oklch(1 0 0 / 0.42)" }}
          >
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
              transition={{
                delay: 0.9 + i * 0.15,
                duration: 0.55,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={`tc ${i === 1 ? "hidden xl:block" : ""}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                  style={{ background: t.color }}
                >
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-medium text-white leading-tight">
                    {t.name}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: "oklch(1 0 0 / 0.50)" }}
                  >
                    {t.role}
                  </p>
                </div>
              </div>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "oklch(1 0 0 / 0.72)" }}
              >
                "{t.text}"
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
