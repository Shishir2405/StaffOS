"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  RiMenuLine,
  RiCloseLine,
  RiArrowRightLine,
  RiPlayCircleLine,
  RiGroupLine,
  RiBarChartBoxLine,
  RiCalendarCheckLine,
  RiStarSFill,
  RiCheckLine,
  RiMapPinLine,
  RiShieldCheckLine,
  RiTimeLine,
} from "react-icons/ri";
import { buttonTap, fadeUp, staggerContainer } from "@/lib/animations";

/* ─── Nav links ──────────────────────────────────────────── */
const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

/* ─── Stats ──────────────────────────────────────────────── */
const stats = [
  { value: "12K+", label: "Companies" },
  { value: "2.4M", label: "Employees managed" },
  { value: "99.9%", label: "Uptime" },
  { value: "4.9/5", label: "Average rating" },
];

/* ─── Feature pills ──────────────────────────────────────── */
const pills = [
  { icon: RiGroupLine, label: "People Management" },
  { icon: RiBarChartBoxLine, label: "HR Analytics" },
  { icon: RiCalendarCheckLine, label: "Leave & Attendance" },
];

/* ─── Features section data ──────────────────────────────── */
const features = [
  {
    icon: RiMapPinLine,
    title: "Geofence Attendance",
    desc: "Automatic check-in and check-out based on GPS location. No manual punching, no buddy punching.",
    accent: "var(--brand)",
  },
  {
    icon: RiCalendarCheckLine,
    title: "Leave Management",
    desc: "Apply, approve, and track leave requests with automated balance calculations and policy enforcement.",
    accent: "var(--success)",
  },
  {
    icon: RiBarChartBoxLine,
    title: "Payroll Processing",
    desc: "End-to-end salary computation with statutory compliance, deductions, and automated payslip generation.",
    accent: "var(--info)",
  },
  {
    icon: RiGroupLine,
    title: "Employee Directory",
    desc: "Centralized employee profiles with department hierarchy, contact info, and employment history.",
    accent: "#7C3AED",
  },
  {
    icon: RiShieldCheckLine,
    title: "Role-Based Access",
    desc: "Granular permissions for admins, HR managers, and employees. Everyone sees exactly what they need.",
    accent: "var(--warning)",
  },
  {
    icon: RiTimeLine,
    title: "Real-time Dashboard",
    desc: "Live attendance tracking, department analytics, and workforce insights at a glance.",
    accent: "var(--danger)",
  },
];

/* ─── How it works steps ─────────────────────────────────── */
const steps = [
  { num: "01", title: "Set up your org", desc: "Add departments, roles, and configure your company structure in minutes." },
  { num: "02", title: "Onboard your team", desc: "Invite employees, assign geofence zones, and set leave policies." },
  { num: "03", title: "Let it run", desc: "Automated attendance, payroll, and leave management. Focus on what matters." },
];

/* ══════════════════════════════════════════════════════════ */
/*  NAVBAR                                                    */
/* ══════════════════════════════════════════════════════════ */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50"
        style={{ fontFamily: "var(--font-body)" }}
      >
        <div
          className="transition-all duration-300"
          style={{
            background: scrolled ? "rgba(253,250,245,0.95)" : "transparent",
            backdropFilter: scrolled ? "blur(20px) saturate(160%)" : "none",
            borderBottom: scrolled ? "1px solid var(--border-1)" : "1px solid transparent",
          }}
        >
          <div
            className="max-w-7xl mx-auto flex items-center justify-between px-6 sm:px-8"
            style={{ height: scrolled ? "60px" : "72px", transition: "height 0.25s ease" }}
          >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5" style={{ textDecoration: "none" }}>
              <div className="flex items-center justify-center rounded-xl w-9 h-9" style={{ background: "var(--brand)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="font-bold text-lg tracking-tight" style={{ fontFamily: "var(--font-display)", color: scrolled ? "var(--text-1)" : "white" }}>
                StaffOS
              </span>
            </Link>

            {/* Desktop nav links */}
            <nav className="hidden md:flex items-center gap-7">
              {navLinks.map((l) => (
                <Link key={l.label} href={l.href} className="text-sm transition-opacity hover:opacity-60" style={{ color: scrolled ? "var(--text-2)" : "rgba(255,255,255,0.75)", textDecoration: "none" }}>
                  {l.label}
                </Link>
              ))}
            </nav>

            {/* CTA */}
            <div className="hidden md:flex items-center gap-2.5">
              <Link href="/sign-in" className="text-sm font-medium transition-opacity hover:opacity-70 px-4 py-2" style={{ color: scrolled ? "var(--text-1)" : "white", textDecoration: "none", borderRadius: "var(--r-md)" }}>
                Sign In
              </Link>
              <Link href="/sign-up" className="text-sm font-semibold inline-flex items-center gap-1.5 transition-all hover:opacity-90"
                style={{ textDecoration: "none", padding: "9px 18px", borderRadius: "var(--r-md)", background: scrolled ? "var(--brand)" : "white", color: scrolled ? "white" : "var(--text-1)", boxShadow: "var(--shadow-sm)" }}>
                Get Started <RiArrowRightLine size={13} />
              </Link>
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden p-2 rounded-lg" style={{ color: scrolled ? "var(--text-1)" : "white", background: "none", border: "none", cursor: "pointer" }} onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <RiCloseLine size={22} /> : <RiMenuLine size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              style={{ background: "rgba(253,250,245,0.98)", backdropFilter: "blur(20px)", borderBottom: "1px solid var(--border-1)", overflow: "hidden" }}
            >
              <div className="px-6 py-5 space-y-1">
                {navLinks.map((l) => (
                  <Link key={l.label} href={l.href} onClick={() => setMobileOpen(false)} className="block py-2.5 text-sm transition-opacity hover:opacity-60" style={{ color: "var(--text-1)", textDecoration: "none" }}>
                    {l.label}
                  </Link>
                ))}
                <div className="flex flex-col gap-2 pt-4" style={{ borderTop: "1px solid var(--border-1)" }}>
                  <Link href="/sign-in" onClick={() => setMobileOpen(false)} className="btn-ghost text-center" style={{ display: "block", textDecoration: "none", padding: "11px 24px" }}>Sign In</Link>
                  <Link href="/sign-up" onClick={() => setMobileOpen(false)} className="btn-primary text-center" style={{ display: "block", textDecoration: "none" }}>Get Started Free</Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}

/* ══════════════════════════════════════════════════════════ */
/*  HERO SECTION                                              */
/* ══════════════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden" style={{ fontFamily: "var(--font-body)" }}>
      {/* Full-bleed hero image */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=1800&q=85')` }} />
      {/* Warm dark overlay */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(155deg, rgba(30,10,35,0.88) 0%, rgba(74,21,75,0.78) 50%, rgba(30,10,35,0.90) 100%)" }} />
      {/* Warm bottom vignette */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: "40%", background: "linear-gradient(to top, rgba(74,21,75,0.08), transparent)" }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 text-center px-6" style={{ paddingTop: "120px", paddingBottom: "80px" }}>
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="inline-flex items-center gap-2 mb-7 px-4 py-2 rounded-full"
          style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", backdropFilter: "blur(10px)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--brand)" }} />
          <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.80)" }}>
            Now with AI-powered HR insights
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 max-w-4xl"
          style={{ fontFamily: "var(--font-display)", lineHeight: 1.04, letterSpacing: "-0.025em" }}
        >
          The HRMS your
          <br />
          <span style={{ color: "var(--brand-light)", fontStyle: "italic" }}>
            people deserve.
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.36 }}
          className="text-base md:text-lg max-w-xl mb-10 leading-relaxed"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          StaffOS brings together hiring, onboarding, payroll, attendance, and
          performance -- in one beautifully unified platform.
        </motion.p>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.44 }}
          className="flex flex-wrap items-center justify-center gap-2.5 mb-10"
        >
          {pills.map((p) => (
            <div key={p.label} className="flex items-center gap-2 px-3.5 py-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
              <p.icon size={13} style={{ color: "var(--brand-light)" }} />
              <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.72)" }}>{p.label}</span>
            </div>
          ))}
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.52 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14"
        >
          <Link href="/sign-up" className="inline-flex items-center gap-2 font-semibold transition-all hover:opacity-90 hover:-translate-y-0.5"
            style={{ textDecoration: "none", padding: "14px 28px", borderRadius: "var(--r-md)", background: "var(--brand)", color: "white", fontSize: "0.9rem", fontFamily: "var(--font-body)", boxShadow: "0 8px 28px -6px rgba(74,21,75,0.45)", letterSpacing: "0.01em" }}>
            Start for free <RiArrowRightLine size={16} />
          </Link>
          <button className="inline-flex items-center gap-2 font-medium transition-all hover:opacity-80"
            style={{ padding: "13px 24px", borderRadius: "var(--r-md)", background: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(255,255,255,0.18)", backdropFilter: "blur(10px)", color: "white", fontSize: "0.9rem", fontFamily: "var(--font-body)", cursor: "pointer" }}>
            <RiPlayCircleLine size={17} /> Watch demo
          </button>
        </motion.div>

        {/* Social proof */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }} className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2.5">
              {["AM", "SK", "RV", "PL", "NJ"].map((av, i) => (
                <div key={av} className="w-8 h-8 rounded-full border-2 border-white/20 flex items-center justify-center text-[10px] font-semibold text-white"
                  style={{ background: ["var(--brand)", "#1C1208", "#2563EB", "#7C3AED", "#16A34A"][i], zIndex: 5 - i }}>
                  {av}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (<RiStarSFill key={i} size={13} color="#E9D5EE" />))}
            </div>
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.50)" }}>4.9 from 3,200+ reviews</span>
          </div>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>No credit card required. 14-day free trial. Cancel anytime.</p>
        </motion.div>
      </div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.75 }}
        className="relative z-10"
        style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(16px) saturate(140%)", borderTop: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0">
          {stats.map((s, i) => (
            <div key={s.label} className="text-center" style={{ borderRight: i < 3 ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
              <p className="text-2xl font-bold text-white mb-0.5" style={{ fontFamily: "var(--font-mono-face)" }}>{s.value}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.40)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════ */
/*  FEATURES SECTION                                          */
/* ══════════════════════════════════════════════════════════ */
function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-6 sm:px-8" style={{ background: "var(--bg-page)" }}>
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="label-caps mb-3 inline-block">Features</span>
          <h2 className="mt-2" style={{ fontFamily: "var(--font-display)", color: "var(--text-1)" }}>
            Everything you need to manage your workforce
          </h2>
          <p className="text-sm mt-3 max-w-lg mx-auto" style={{ color: "var(--text-3)" }}>
            From automated attendance to payroll processing, StaffOS handles the complexity so your HR team can focus on people.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="p-6 rounded-[var(--r-lg)] transition-all duration-200"
              style={{ background: "var(--bg-raised)", border: "1px solid var(--border-1)", boxShadow: "var(--shadow-sm)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-sm)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
              }}
            >
              <div className="w-10 h-10 rounded-[var(--r-md)] flex items-center justify-center mb-4" style={{ background: `color-mix(in srgb, ${f.accent} 12%, transparent)` }}>
                <f.icon size={20} style={{ color: f.accent }} />
              </div>
              <h3 className="text-base font-bold mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--text-1)" }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════ */
/*  HOW IT WORKS                                              */
/* ══════════════════════════════════════════════════════════ */
function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 sm:px-8" style={{ background: "var(--bg-surface)" }}>
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="label-caps mb-3 inline-block">How it works</span>
          <h2 className="mt-2" style={{ fontFamily: "var(--font-display)", color: "var(--text-1)" }}>
            Up and running in three steps
          </h2>
        </motion.div>

        <div className="space-y-6">
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="flex items-start gap-6 p-6 rounded-[var(--r-lg)]"
              style={{ background: "var(--bg-raised)", border: "1px solid var(--border-1)" }}
            >
              <span className="text-3xl font-extrabold shrink-0" style={{ fontFamily: "var(--font-mono-face)", color: "var(--brand)", opacity: 0.4 }}>
                {s.num}
              </span>
              <div>
                <h3 className="text-base font-bold mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--text-1)" }}>{s.title}</h3>
                <p className="text-sm" style={{ color: "var(--text-2)" }}>{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════ */
/*  CTA SECTION                                               */
/* ══════════════════════════════════════════════════════════ */
function CTASection() {
  return (
    <section className="py-24 px-6 sm:px-8" style={{ background: "var(--bg-page)" }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto text-center p-12 rounded-[var(--r-xl)]"
        style={{ background: "linear-gradient(135deg, #1C1208 0%, #3D2B14 100%)" }}
      >
        <h2 className="text-white mb-3" style={{ fontFamily: "var(--font-display)" }}>
          Ready to transform your HR?
        </h2>
        <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.55)" }}>
          Join 12,000+ companies already using StaffOS to streamline their workforce management.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/sign-up" className="inline-flex items-center gap-2 font-semibold"
            style={{ textDecoration: "none", padding: "14px 28px", borderRadius: "var(--r-md)", background: "var(--brand)", color: "white", fontSize: "0.9rem" }}>
            Start free trial <RiArrowRightLine size={16} />
          </Link>
          <Link href="/sign-in" className="inline-flex items-center gap-2 font-medium"
            style={{ textDecoration: "none", padding: "13px 24px", borderRadius: "var(--r-md)", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "white", fontSize: "0.9rem" }}>
            Sign in
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════ */
/*  FOOTER                                                    */
/* ══════════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer className="py-12 px-6 sm:px-8" style={{ borderTop: "1px solid var(--border-1)", background: "var(--bg-subtle)" }}>
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--brand)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-bold text-sm" style={{ fontFamily: "var(--font-display)", color: "var(--text-1)" }}>StaffOS</span>
        </div>
        <p className="text-xs" style={{ color: "var(--text-3)" }}>
          2024 StaffOS. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

/* ── Default export ──────────────────────────────────────── */
export default function LandingPage() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorks />
      <CTASection />
      <Footer />
    </>
  );
}
