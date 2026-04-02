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
  RiArrowLeftLine,
  RiGoogleLine,
  RiLoader4Line,
  RiUserLine,
  RiGroupLine,
  RiBarChartLine,
  RiBuildingLine,
} from "react-icons/ri";
import { toast } from "@/components/ui/custom-toast";
import { authClient } from "@/lib/auth-client";
import { buttonTap } from "@/lib/animations";

/* ─── Error codes ────────────────────────────────────────── */
type ErrorTypes = Partial<Record<keyof typeof authClient.$ERROR_CODES, string>>;
const errorCodes = {
  USER_ALREADY_EXISTS: "This email is already registered",
} satisfies ErrorTypes;

const getErrorMessage = (code: string) =>
  code in errorCodes
    ? errorCodes[code as keyof typeof errorCodes]
    : "Registration failed. Please try again.";

/* ─── Password strength ──────────────────────────────────── */
function getStrength(pw: string) {
  if (!pw) return { score: 0, label: "", color: "var(--border-1)" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 1) return { score: 1, label: "Weak", color: "var(--danger)" };
  if (s <= 2) return { score: 2, label: "Fair", color: "var(--warning)" };
  if (s <= 3) return { score: 3, label: "Good", color: "var(--info)" };
  return { score: 4, label: "Strong", color: "var(--success)" };
}

/* ─── Feature cards ──────────────────────────────────────── */
const featureCards = [
  { icon: RiGroupLine, title: "People Management", desc: "Unified profiles for every employee, from hire to retire." },
  { icon: RiBarChartLine, title: "Real-time Analytics", desc: "HR dashboards that surface what matters instantly." },
  { icon: RiBuildingLine, title: "Multi-location", desc: "Manage teams across offices, time zones, and countries." },
];

/* ─── Field ──────────────────────────────────────────────── */
function Field({
  label, id, type, placeholder, value, onChange, disabled, icon, right, autoComplete, error,
}: {
  label: string; id: string; type: string; placeholder: string; value: string;
  onChange: (v: string) => void; disabled: boolean; icon: React.ReactNode;
  right?: React.ReactNode; autoComplete?: string; error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block mb-1.5 label-caps">{label}</label>
      <div
        className="s-input-wrap"
        style={error ? { borderColor: "var(--danger)", boxShadow: "0 0 0 3px rgba(220,38,38,0.1)" } : {}}
      >
        <span style={{ color: error ? "var(--danger)" : "var(--text-3)", flexShrink: 0 }}>{icon}</span>
        <input id={id} type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} autoComplete={autoComplete} className="s-input" />
        {right}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-1.5 text-xs" style={{ color: "var(--danger)" }}>
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────── */
export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });

  const set = (k: string, v: string) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: "" })); };
  const strength = getStrength(form.password);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Your full name is required";
    if (!form.email.includes("@")) e.email = "Enter a valid email address";
    if (form.password.length < 8) e.password = "Minimum 8 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords don't match";
    if (!agreed) e.agreed = "Please accept the terms to continue";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      const { error } = await authClient.signUp.email({ email: form.email, password: form.password, name: form.name });
      if (error?.code) { toast.error(getErrorMessage(error.code)); setIsLoading(false); return; }
      toast.success("Account created! Please sign in.");
      router.push("/sign-in?registered=true");
    } catch { toast.error("An error occurred. Please try again."); setIsLoading(false); }
  };

  return (
    <div className="h-screen flex overflow-hidden" style={{ fontFamily: "var(--font-body)", background: "var(--bg-page)" }}>
      {/* ── LEFT -- Form ──────────────────────────────────── */}
      <section className="flex-1 flex items-center justify-center px-6 sm:px-8 py-10 overflow-y-auto">
        <div className="w-full max-w-[400px]">
          {/* Logo */}
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--brand)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--text-1)" }}>StaffOS</span>
          </motion.div>

          {/* Heading */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.08 }} className="mb-7">
            <h1 style={{ fontFamily: "var(--font-display)", color: "var(--text-1)", fontSize: "32px", fontWeight: 800, letterSpacing: "-0.6px", lineHeight: 1.08 }}>
              Get{" "}<span style={{ color: "var(--brand)", fontStyle: "italic" }}>started</span><br />for free.
            </h1>
            <p className="text-sm mt-2" style={{ color: "var(--text-3)" }}>Set up your StaffOS workspace in seconds</p>
          </motion.div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-3.5">
              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
                <Field label="Full Name" id="name" type="text" placeholder="John Doe" value={form.name} onChange={(v) => set("name", v)} disabled={isLoading} icon={<RiUserLine size={15} />} autoComplete="name" error={errors.name} />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
                <Field label="Work Email" id="email" type="email" placeholder="you@company.com" value={form.email} onChange={(v) => set("email", v)} disabled={isLoading} icon={<RiMailLine size={15} />} autoComplete="email" error={errors.email} />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
                <Field label="Password" id="password" type={showPw ? "text" : "password"} placeholder="Min. 8 characters" value={form.password} onChange={(v) => set("password", v)} disabled={isLoading} icon={<RiLockPasswordLine size={15} />} autoComplete="new-password" error={errors.password}
                  right={<button type="button" onClick={() => setShowPw(!showPw)} tabIndex={-1} style={{ color: "var(--text-3)", flexShrink: 0 }} className="hover:opacity-70 transition-opacity">{showPw ? <RiEyeOffLine size={14} /> : <RiEyeLine size={14} />}</button>}
                />
                <AnimatePresence>
                  {form.password && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-1.5 mt-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="strength-bar" style={{ background: i <= strength.score ? strength.color : "var(--border-1)" }} />
                      ))}
                      <span className="text-xs ml-1 shrink-0" style={{ color: strength.color, minWidth: 38 }}>{strength.label}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}>
                <Field label="Confirm Password" id="confirmPassword" type={showConfirm ? "text" : "password"} placeholder="Re-enter password" value={form.confirmPassword} onChange={(v) => set("confirmPassword", v)} disabled={isLoading} icon={<RiLockPasswordLine size={15} />} autoComplete="new-password" error={errors.confirmPassword}
                  right={<button type="button" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1} style={{ color: "var(--text-3)", flexShrink: 0 }} className="hover:opacity-70 transition-opacity">{showConfirm ? <RiEyeOffLine size={14} /> : <RiEyeLine size={14} />}</button>}
                />
              </motion.div>

              {/* Terms */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input type="checkbox" className="s-check mt-0.5" checked={agreed} onChange={(e) => { setAgreed(e.target.checked); setErrors((er) => ({ ...er, agreed: "" })); }} />
                  <span className="text-xs leading-relaxed" style={{ color: "var(--text-3)" }}>
                    I agree to the{" "}
                    <Link href="/terms" className="hover:opacity-70 underline underline-offset-2" style={{ color: "var(--brand)" }}>Terms of Service</Link>{" "}and{" "}
                    <Link href="/privacy" className="hover:opacity-70 underline underline-offset-2" style={{ color: "var(--brand)" }}>Privacy Policy</Link>
                  </span>
                </label>
                <AnimatePresence>
                  {errors.agreed && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-1.5 text-xs" style={{ color: "var(--danger)" }}>{errors.agreed}</motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Submit */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46 }} className="pt-1">
                <motion.button whileTap={buttonTap} type="submit" className="btn-primary" disabled={isLoading}>
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <motion.span key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-2">
                        <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.75, repeat: Infinity, ease: "linear" }} className="inline-flex"><RiLoader4Line size={16} /></motion.span>
                        Creating account...
                      </motion.span>
                    ) : (
                      <motion.span key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-2">
                        Create Account <RiArrowRightLine size={16} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.div>

              {/* Divider */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.52 }} className="relative flex items-center gap-4 py-0.5">
                <div className="flex-1 h-px" style={{ background: "var(--border-1)" }} />
                <span className="text-xs shrink-0" style={{ color: "var(--text-3)" }}>or</span>
                <div className="flex-1 h-px" style={{ background: "var(--border-1)" }} />
              </motion.div>

              {/* Google */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.58 }}>
                <motion.button whileTap={buttonTap} type="button" className="btn-ghost">
                  <RiGoogleLine size={16} /> Sign up with Google
                </motion.button>
              </motion.div>
            </div>
          </form>

          {/* Back to sign in */}
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.66 }} className="text-sm text-center mt-6" style={{ color: "var(--text-3)" }}>
            Already have an account?{" "}
            <Link href="/sign-in" className="font-medium hover:opacity-70 transition-opacity inline-flex items-center gap-1" style={{ color: "var(--brand)" }}>
              <RiArrowLeftLine size={13} /> Sign in
            </Link>
          </motion.p>
        </div>
      </section>

      {/* ── RIGHT -- Hero ─────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:block relative flex-1 m-3"
        style={{ borderRadius: "var(--r-xl)", overflow: "hidden" }}
      >
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&q=80')` }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(155deg, rgba(28,18,8,0.78) 0%, rgba(61,43,20,0.88) 100%)" }} />

        {/* Brand */}
        <div className="absolute top-8 left-8 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1C1208" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-white font-bold text-base" style={{ fontFamily: "var(--font-display)" }}>StaffOS</span>
        </div>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-12 text-center">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-xs font-medium tracking-[0.2em] uppercase mb-4" style={{ color: "rgba(255,255,255,0.50)" }}>
            No credit card required. Free 14-day trial.
          </motion.p>
          <motion.h2 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.62 }} className="text-4xl font-bold text-white leading-[1.08] mb-6" style={{ fontFamily: "var(--font-display)" }}>
            Your people.
            <br />
            <span style={{ color: "var(--brand-light)", fontStyle: "italic" }}>One platform.</span>
          </motion.h2>

          {/* Feature cards */}
          <div className="space-y-3 w-full max-w-xs">
            {featureCards.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.74 + i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-3 rounded-[var(--r-lg)] px-4 py-3.5 text-left"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(12px)" }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(217,119,6,0.2)", border: "1px solid rgba(217,119,6,0.3)" }}>
                  <f.icon size={15} color="var(--brand-light)" />
                </div>
                <div>
                  <p className="text-xs font-medium text-white leading-tight">{f.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.48)" }}>{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom badge */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} className="absolute bottom-8 left-0 right-0 flex justify-center">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-full" style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(12px)" }}>
            <div className="flex -space-x-2">
              {["AM", "SK", "RV"].map((av, i) => (
                <div key={av} className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-[9px] font-medium text-white"
                  style={{ background: i === 0 ? "var(--brand)" : i === 1 ? "#1C1208" : "#2563EB", zIndex: 3 - i }}
                >{av}</div>
              ))}
            </div>
            <span className="text-xs text-white/70">
              Join <span className="text-white font-medium">2.4M+</span> employees already on StaffOS
            </span>
          </div>
        </motion.div>
      </motion.section>
    </div>
  );
}
