"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  RiArrowRightLine,
  RiGroupLine,
  RiCalendarCheckLine,
  RiMoneyDollarCircleLine,
  RiGovernmentLine,
  RiShieldCheckLine,
  RiBarChartBoxLine,
} from "react-icons/ri";

/* ─── Capabilities (Section 2) ───────────────────────────── */
const capabilities = [
  {
    icon: RiGroupLine,
    title: "People & Onboarding",
    desc: "Employee master, documents (KYC, contracts), departments, and salary structures in one place.",
  },
  {
    icon: RiCalendarCheckLine,
    title: "Attendance & Leave",
    desc: "Geofenced attendance, shifts, holidays, overtime, and leave approvals with live tracking.",
  },
  {
    icon: RiMoneyDollarCircleLine,
    title: "Payroll Processing",
    desc: "Pay heads, monthly runs, arrears, bonus, and full & final settlement with accurate payslips.",
  },
  {
    icon: RiGovernmentLine,
    title: "Tax & TDS",
    desc: "Investment declarations, proof verification, TDS computation, and Form 16 — built for India.",
  },
  {
    icon: RiShieldCheckLine,
    title: "Statutory Compliance",
    desc: "PF, ESI, PT and LWF contributions with challan generation and a compliance calendar.",
  },
  {
    icon: RiBarChartBoxLine,
    title: "Reports & Exports",
    desc: "Salary register, bank transfer, ESIC and EPF files — exported as PDF, Excel, CSV and JSON.",
  },
];

/* ─── Navbar ─────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        fontFamily: "var(--font-body)",
        background: scrolled ? "rgba(251,250,253,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(20px) saturate(160%)" : "none",
        borderBottom: scrolled ? "1px solid var(--border-1)" : "1px solid transparent",
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 sm:px-8" style={{ height: 68 }}>
        <Link href="/" className="flex items-center gap-2.5" style={{ textDecoration: "none" }}>
          <div className="flex items-center justify-center rounded-xl w-9 h-9" style={{ background: "var(--brand)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight" style={{ fontFamily: "var(--font-display)", color: "var(--text-1)" }}>
            StaffOS
          </span>
        </Link>

        <Link
          href="/sign-in"
          className="inline-flex items-center gap-1.5 text-sm font-semibold transition-all hover:-translate-y-0.5"
          style={{
            textDecoration: "none",
            padding: "10px 24px",
            borderRadius: "var(--r-full)",
            background: "var(--brand)",
            color: "var(--text-on-brand)",
            boxShadow: "0 6px 20px -8px rgba(74,21,75,0.5)",
          }}
        >
          Login <RiArrowRightLine size={15} />
        </Link>
      </div>
    </motion.header>
  );
}

/* ─── Section 1 — Hero ───────────────────────────────────── */
function Hero() {
  return (
    <section className="relative overflow-hidden" style={{ background: "var(--bg-page)", fontFamily: "var(--font-body)" }}>
      {/* Soft pastel-mesh backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(55% 45% at 18% 12%, rgba(233,213,238,0.65), transparent 70%)," +
            "radial-gradient(45% 40% at 86% 18%, rgba(255,221,228,0.5), transparent 72%)," +
            "radial-gradient(50% 55% at 72% 92%, rgba(214,231,221,0.45), transparent 72%)",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center" style={{ paddingTop: 168, paddingBottom: 120 }}>
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="inline-block label-caps mb-6 px-3 py-1.5 rounded-full"
          style={{ background: "var(--brand-xlight)", border: "1px solid var(--border-1)", color: "var(--brand)" }}
        >
          HRMS &amp; Payroll for India
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--text-1)",
            fontSize: "clamp(40px, 7vw, 68px)",
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
            maxWidth: 820,
          }}
        >
          HR and payroll,{" "}
          <span style={{ color: "var(--brand)", fontStyle: "italic" }}>in one platform.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.22 }}
          className="mx-auto mt-6 text-base md:text-lg"
          style={{ color: "var(--text-2)", maxWidth: 560, lineHeight: 1.6 }}
        >
          StaffOS unifies employees, attendance, payroll, tax and statutory
          compliance — so your team runs the whole month from a single workspace.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.32 }}
          className="mt-10 flex items-center justify-center"
        >
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 font-semibold transition-all hover:-translate-y-0.5"
            style={{
              textDecoration: "none",
              padding: "16px 36px",
              borderRadius: "var(--r-full)",
              background: "var(--brand)",
              color: "var(--text-on-brand)",
              fontSize: "1rem",
              boxShadow: "0 12px 32px -8px rgba(74,21,75,0.5)",
            }}
          >
            Login to your workspace <RiArrowRightLine size={18} />
          </Link>
        </motion.div>

        {/* Trust row — product facts, not vanity metrics */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-x-10 gap-y-4"
        >
          {[
            { k: "13", v: "integrated modules" },
            { k: "PF · ESI · PT · TDS", v: "statutory ready" },
            { k: "PDF · Excel · CSV · JSON", v: "export formats" },
          ].map((s) => (
            <div key={s.v} className="text-center">
              <p className="font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-1)", fontSize: 18, letterSpacing: "-0.01em" }}>{s.k}</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>{s.v}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Section 2 — Capabilities ───────────────────────────── */
function Capabilities() {
  return (
    <section id="features" className="py-24 px-6 sm:px-8" style={{ background: "var(--bg-raised)", borderTop: "1px solid var(--border-1)" }}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mb-14"
        >
          <span className="label-caps" style={{ color: "var(--brand)" }}>Everything inside</span>
          <h2 className="mt-3" style={{ fontFamily: "var(--font-display)", color: "var(--text-1)", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.12 }}>
            One workspace for the entire payroll cycle
          </h2>
          <p className="mt-4 text-base" style={{ color: "var(--text-2)", lineHeight: 1.6 }}>
            From onboarding to compliance filing, every step lives in StaffOS —
            connected, auditable, and ready to export.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {capabilities.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className="p-6 transition-all duration-200"
              style={{ background: "var(--bg-page)", border: "1px solid var(--border-1)", borderRadius: "var(--r-lg)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-2)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-1)";
              }}
            >
              <div className="w-11 h-11 flex items-center justify-center mb-4" style={{ background: "var(--brand-xlight)", borderRadius: "var(--r-md)" }}>
                <c.icon size={21} style={{ color: "var(--brand)" }} />
              </div>
              <h3 className="text-base font-bold mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--text-1)" }}>{c.title}</h3>
              <p className="text-sm" style={{ color: "var(--text-2)", lineHeight: 1.6 }}>{c.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Inline login prompt (no account creation) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 flex flex-col sm:flex-row items-center justify-between gap-5 p-8"
          style={{ background: "var(--brand)", borderRadius: "var(--r-xl)" }}
        >
          <div>
            <h3 className="font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-on-brand)", fontSize: 22, letterSpacing: "-0.01em" }}>
              Ready to get to work?
            </h3>
            <p className="text-sm mt-1" style={{ color: "var(--brand-light)" }}>
              Sign in to manage employees, run payroll and file compliance.
            </p>
          </div>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 font-semibold shrink-0 transition-all hover:-translate-y-0.5"
            style={{
              textDecoration: "none",
              padding: "14px 30px",
              borderRadius: "var(--r-full)",
              background: "var(--bg-raised)",
              color: "var(--brand)",
              fontSize: "0.95rem",
            }}
          >
            Login <RiArrowRightLine size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Footer ─────────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="py-10 px-6 sm:px-8" style={{ background: "var(--bg-subtle)", borderTop: "1px solid var(--border-1)" }}>
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--brand)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-bold text-sm" style={{ fontFamily: "var(--font-display)", color: "var(--text-1)" }}>StaffOS</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/sign-in" className="text-sm transition-opacity hover:opacity-70" style={{ color: "var(--text-2)", textDecoration: "none" }}>
            Login
          </Link>
          <p className="text-xs" style={{ color: "var(--text-3)" }}>© 2026 StaffOS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <>
      <Navbar />
      <Hero />
      <Capabilities />
      <Footer />
    </>
  );
}
