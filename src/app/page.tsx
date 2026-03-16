"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiShieldCheckLine,
  RiMenuLine,
  RiCloseLine,
  RiArrowRightLine,
  RiPlayCircleLine,
  RiGroupLine,
  RiBarChartBoxLine,
  RiCalendarCheckLine,
  RiStarSFill,
  RiCheckLine,
} from "react-icons/ri";

/* ─── Nav links ──────────────────────────────────────────── */
const navLinks = [
  { label: "Product", href: "#product" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "About", href: "#about" },
];

/* ─── Stats ──────────────────────────────────────────────── */
const stats = [
  { value: "12K+", label: "Companies" },
  { value: "2.4M", label: "Employees managed" },
  { value: "99.9%", label: "Uptime guarantee" },
  { value: "4.9★", label: "Average rating" },
];

/* ─── Trust logos (placeholder names) ───────────────────── */
const trustedBy = [
  "Nexus Corp",
  "Orbis Health",
  "Verity Labs",
  "Zenith Group",
  "Apex Finance",
];

/* ─── Feature pills ──────────────────────────────────────── */
const pills = [
  { icon: RiGroupLine, label: "People Management" },
  { icon: RiBarChartBoxLine, label: "HR Analytics" },
  { icon: RiCalendarCheckLine, label: "Leave & Attendance" },
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
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          fontFamily: "var(--font-dm-sans)",
          paddingTop: scrolled ? "0" : "0",
        }}
      >
        {/* Main bar */}
        <div
          className="transition-all duration-300"
          style={{
            background: scrolled ? "oklch(1 0 0 / 0.92)" : "transparent",
            backdropFilter: scrolled ? "blur(20px) saturate(160%)" : "none",
            borderBottom: scrolled
              ? "1px solid var(--border)"
              : "1px solid transparent",
          }}
        >
          <div
            className="max-w-7xl mx-auto flex items-center justify-between"
            style={{
              padding: "0 2rem",
              height: scrolled ? "60px" : "72px",
              transition: "height 0.25s ease",
            }}
          >
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5"
              style={{ textDecoration: "none" }}
            >
              <div
                className="flex items-center justify-center rounded-xl transition-all"
                style={{
                  width: 36,
                  height: 36,
                  background: "var(--brand-navy)",
                }}
              >
                <RiShieldCheckLine size={18} color="white" />
              </div>
              <span
                className="font-semibold text-lg tracking-tight"
                style={{
                  fontFamily: "var(--font-playfair)",
                  color: scrolled ? "var(--foreground)" : "white",
                }}
              >
                StaffOS
              </span>
            </Link>

            {/* Desktop nav links */}
            <nav className="hidden md:flex items-center gap-7">
              {navLinks.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="text-sm transition-opacity hover:opacity-60"
                  style={{
                    color: scrolled
                      ? "var(--muted-foreground)"
                      : "oklch(1 0 0 / 0.75)",
                    textDecoration: "none",
                    fontWeight: 400,
                  }}
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            {/* CTA buttons */}
            <div className="hidden md:flex items-center gap-2.5">
              <Link
                href="/sign-in"
                className="text-sm font-medium transition-opacity hover:opacity-70 px-4 py-2"
                style={{
                  color: scrolled ? "var(--foreground)" : "white",
                  textDecoration: "none",
                  borderRadius: "10px",
                }}
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="text-sm font-medium inline-flex items-center gap-1.5 transition-all hover:opacity-90"
                style={{
                  textDecoration: "none",
                  padding: "9px 18px",
                  borderRadius: "10px",
                  background: scrolled ? "var(--brand-navy)" : "white",
                  color: scrolled ? "white" : "var(--brand-navy)",
                  boxShadow: scrolled
                    ? "0 4px 14px -4px oklch(0.198 0.068 262 / 0.30)"
                    : "0 4px 14px -4px oklch(0 0 0 / 0.20)",
                }}
              >
                Get Started
                <RiArrowRightLine size={13} />
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: scrolled ? "var(--foreground)" : "white" }}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <RiCloseLine size={22} />
              ) : (
                <RiMenuLine size={22} />
              )}
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
              style={{
                background: "oklch(1 0 0 / 0.97)",
                backdropFilter: "blur(20px)",
                borderBottom: "1px solid var(--border)",
                overflow: "hidden",
                fontFamily: "var(--font-dm-sans)",
              }}
            >
              <div className="px-6 py-5 space-y-1">
                {navLinks.map((l) => (
                  <Link
                    key={l.label}
                    href={l.href}
                    onClick={() => setMobileOpen(false)}
                    className="block py-2.5 text-sm transition-opacity hover:opacity-60"
                    style={{
                      color: "var(--foreground)",
                      textDecoration: "none",
                    }}
                  >
                    {l.label}
                  </Link>
                ))}
                <div
                  className="flex flex-col gap-2 pt-4 border-t"
                  style={{ borderColor: "var(--border)" }}
                >
                  <Link
                    href="/sign-in"
                    onClick={() => setMobileOpen(false)}
                    className="btn-ghost text-center"
                    style={{
                      display: "block",
                      textDecoration: "none",
                      padding: "11px 24px",
                    }}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    onClick={() => setMobileOpen(false)}
                    className="btn-navy text-center"
                    style={{ display: "block", textDecoration: "none" }}
                  >
                    Get Started Free
                  </Link>
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
    <section
      className="relative min-h-screen flex flex-col overflow-hidden"
      style={{ fontFamily: "var(--font-dm-sans)" }}
    >
      {/* Full-bleed hero image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=1800&q=85')`,
        }}
      />
      {/* Dark overlay — navy gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(155deg, oklch(0.112 0.030 258 / 0.88) 0%, oklch(0.198 0.068 262 / 0.78) 50%, oklch(0.112 0.030 258 / 0.90) 100%)",
        }}
      />
      {/* Rose bottom vignette */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: "40%",
          background:
            "linear-gradient(to top, oklch(0.578 0.232 13 / 0.12), transparent)",
        }}
      />

      {/* Content */}
      <div
        className="relative z-10 flex flex-col items-center justify-center flex-1 text-center px-6"
        style={{ paddingTop: "120px", paddingBottom: "80px" }}
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="inline-flex items-center gap-2 mb-7 px-4 py-2 rounded-full"
          style={{
            background: "oklch(1 0 0 / 0.10)",
            border: "1px solid oklch(1 0 0 / 0.18)",
            backdropFilter: "blur(10px)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: "var(--brand-rose)" }}
          />
          <span
            className="text-xs font-medium"
            style={{ color: "oklch(1 0 0 / 0.80)" }}
          >
            Now with AI-powered HR insights →
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 max-w-4xl"
          style={{
            fontFamily: "var(--font-playfair)",
            lineHeight: 1.04,
            letterSpacing: "-0.025em",
          }}
        >
          The HRMS your
          <br />
          <span
            style={{ color: "var(--brand-rose-muted)", fontStyle: "italic" }}
          >
            people deserve.
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.36 }}
          className="text-base md:text-lg max-w-xl mb-10 leading-relaxed"
          style={{ color: "oklch(1 0 0 / 0.58)" }}
        >
          StaffOS brings together hiring, onboarding, payroll, attendance, and
          performance — in one beautifully unified platform.
        </motion.p>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.44 }}
          className="flex flex-wrap items-center justify-center gap-2.5 mb-10"
        >
          {pills.map((p) => (
            <div
              key={p.label}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full"
              style={{
                background: "oklch(1 0 0 / 0.08)",
                border: "1px solid oklch(1 0 0 / 0.14)",
                backdropFilter: "blur(8px)",
              }}
            >
              <p.icon size={13} style={{ color: "var(--brand-rose-muted)" }} />
              <span
                className="text-xs font-medium"
                style={{ color: "oklch(1 0 0 / 0.72)" }}
              >
                {p.label}
              </span>
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
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 font-medium transition-all hover:opacity-90 hover:-translate-y-0.5"
            style={{
              textDecoration: "none",
              padding: "14px 28px",
              borderRadius: "12px",
              background: "var(--brand-rose)",
              color: "white",
              fontSize: "0.9rem",
              fontWeight: 500,
              fontFamily: "var(--font-dm-sans)",
              boxShadow: "0 8px 28px -6px oklch(0.578 0.232 13 / 0.55)",
              letterSpacing: "0.01em",
            }}
          >
            Start for free
            <RiArrowRightLine size={16} />
          </Link>
          <button
            className="inline-flex items-center gap-2 font-medium transition-all hover:opacity-80"
            style={{
              padding: "13px 24px",
              borderRadius: "12px",
              background: "oklch(1 0 0 / 0.10)",
              border: "1.5px solid oklch(1 0 0 / 0.22)",
              backdropFilter: "blur(10px)",
              color: "white",
              fontSize: "0.9rem",
              fontFamily: "var(--font-dm-sans)",
              cursor: "pointer",
            }}
          >
            <RiPlayCircleLine size={17} />
            Watch demo
          </button>
        </motion.div>

        {/* Social proof row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          className="flex flex-col items-center gap-3"
        >
          {/* Avatars + stars */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2.5">
              {["AM", "SK", "RV", "PL", "NJ"].map((av, i) => (
                <div
                  key={av}
                  className="w-8 h-8 rounded-full border-2 border-white/20 flex items-center justify-center text-[10px] font-semibold text-white"
                  style={{
                    background: [
                      "var(--brand-rose)",
                      "var(--brand-navy)",
                      "#0891B2",
                      "#7C3AED",
                      "#D97706",
                    ][i],
                    zIndex: 5 - i,
                  }}
                >
                  {av}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <RiStarSFill key={i} size={13} color="#FCD34D" />
              ))}
            </div>
            <span className="text-xs" style={{ color: "oklch(1 0 0 / 0.55)" }}>
              4.9 from 3,200+ reviews
            </span>
          </div>

          <p className="text-xs" style={{ color: "oklch(1 0 0 / 0.38)" }}>
            No credit card required · 14-day free trial · Cancel anytime
          </p>
        </motion.div>
      </div>

      {/* ── Stats bar ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.75 }}
        className="relative z-10"
        style={{
          background: "oklch(1 0 0 / 0.07)",
          backdropFilter: "blur(16px) saturate(140%)",
          borderTop: "1px solid oklch(1 0 0 / 0.12)",
        }}
      >
        <div className="max-w-5xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="text-center"
              style={{
                borderRight: i < 3 ? "1px solid oklch(1 0 0 / 0.12)" : "none",
                paddingRight: i < 3 ? "24px" : "0",
              }}
            >
              <p
                className="text-2xl font-bold text-white mb-0.5"
                style={{ fontFamily: "var(--font-playfair)" }}
              >
                {s.value}
              </p>
              <p className="text-xs" style={{ color: "oklch(1 0 0 / 0.45)" }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Trusted by ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="relative z-10 pb-12 pt-6"
        style={{
          background: "oklch(0.112 0.030 258 / 0.80)",
          backdropFilter: "blur(8px)",
        }}
      >
        <p
          className="text-center text-xs tracking-[0.16em] uppercase mb-5"
          style={{ color: "oklch(1 0 0 / 0.28)" }}
        >
          Trusted by teams at
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6">
          {trustedBy.map((name) => (
            <span
              key={name}
              className="text-sm font-medium"
              style={{
                color: "oklch(1 0 0 / 0.35)",
                fontFamily: "var(--font-playfair)",
              }}
            >
              {name}
            </span>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

/* ── Default export for direct page use ───────────────────── */
export default function LandingHero() {
  return (
    <>
      <Navbar />
      <HeroSection />
    </>
  );
}
