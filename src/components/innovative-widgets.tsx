"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp, scaleIn } from "@/lib/animations";

/* ══════════════════════════════════════════════════════════ */
/*  1. WEEKLY ACTIVITY HEATMAP                                */
/*  A GitHub-style contribution grid showing attendance       */
/*  density over the past 12 weeks                            */
/* ══════════════════════════════════════════════════════════ */

interface HeatmapDay {
  date: string;
  value: number; // 0 = no data, 1 = low, 2 = medium, 3 = high
}

function getHeatmapColor(value: number): string {
  switch (value) {
    case 0: return "var(--bg-subtle)";
    case 1: return "rgba(217,119,6,0.15)";
    case 2: return "rgba(217,119,6,0.35)";
    case 3: return "rgba(217,119,6,0.65)";
    default: return "var(--bg-subtle)";
  }
}

export function ActivityHeatmap({ attendanceData }: { attendanceData: { checkInTime: string }[] }) {
  const weeks = 12;
  const days = 7;

  const heatmapData = useMemo(() => {
    const grid: HeatmapDay[][] = [];
    const today = new Date();

    for (let w = weeks - 1; w >= 0; w--) {
      const week: HeatmapDay[] = [];
      for (let d = 0; d < days; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (w * 7 + (6 - d)));
        const dateStr = date.toDateString();

        const count = attendanceData.filter(
          (r) => new Date(r.checkInTime).toDateString() === dateStr
        ).length;

        week.push({
          date: dateStr,
          value: count === 0 ? 0 : count <= 2 ? 1 : count <= 5 ? 2 : 3,
        });
      }
      grid.push(week);
    }
    return grid;
  }, [attendanceData]);

  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="rounded-[var(--r-lg)] p-5"
      style={{
        background: "var(--bg-raised)",
        border: "1px solid var(--border-1)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 style={{ fontFamily: "var(--font-display)", color: "var(--text-1)" }}>
            Activity Heatmap
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
            Attendance density over the past {weeks} weeks
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px]" style={{ color: "var(--text-3)" }}>Less</span>
          {[0, 1, 2, 3].map((v) => (
            <div
              key={v}
              className="w-3 h-3 rounded-sm"
              style={{ background: getHeatmapColor(v) }}
            />
          ))}
          <span className="text-[10px]" style={{ color: "var(--text-3)" }}>More</span>
        </div>
      </div>

      <div className="flex gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1 pt-0">
          {dayLabels.map((label, i) => (
            <div
              key={i}
              className="h-3 flex items-center justify-end"
              style={{ fontSize: "9px", color: "var(--text-3)", width: 12 }}
            >
              {i % 2 === 1 ? label : ""}
            </div>
          ))}
        </div>
        {/* Grid */}
        {heatmapData.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) => (
              <motion.div
                key={`${wi}-${di}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (wi * 7 + di) * 0.003, duration: 0.2 }}
                className="w-3 h-3 rounded-sm cursor-default transition-all"
                style={{ background: getHeatmapColor(day.value) }}
                title={`${day.date}: ${day.value === 0 ? "No activity" : day.value === 1 ? "Low" : day.value === 2 ? "Medium" : "High"}`}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "scale(1.3)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════ */
/*  2. TEAM PULSE INDICATOR                                   */
/*  Shows who is currently online/checked-in with a live      */
/*  animated pulse, names scroll like a ticker                */
/* ══════════════════════════════════════════════════════════ */

interface OnlineEmployee {
  name: string;
  initials: string;
  zone?: string;
}

export function TeamPulse({ onlineEmployees }: { onlineEmployees: OnlineEmployee[] }) {
  const count = onlineEmployees.length;

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="rounded-[var(--r-lg)] p-5"
      style={{
        background: "var(--bg-raised)",
        border: "1px solid var(--border-1)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        {/* Live pulse dot */}
        <div className="relative">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: count > 0 ? "var(--success)" : "var(--text-3)" }} />
          {count > 0 && (
            <div
              className="absolute inset-0 rounded-full pulse-ring"
              style={{ background: "var(--success)", opacity: 0.4 }}
            />
          )}
        </div>
        <div>
          <h3 style={{ fontFamily: "var(--font-display)", color: "var(--text-1)" }}>
            Team Pulse
          </h3>
          <p className="text-xs" style={{ color: "var(--text-3)" }}>
            <span style={{ fontFamily: "var(--font-mono-face)", color: count > 0 ? "var(--success)" : "var(--text-3)" }}>
              {count}
            </span>
            {" "}currently active
          </p>
        </div>
      </div>

      {count === 0 ? (
        <p className="text-xs py-4 text-center" style={{ color: "var(--text-3)" }}>
          No employees currently checked in
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {onlineEmployees.slice(0, 12).map((emp, i) => (
            <motion.div
              key={emp.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-full"
              style={{
                background: "var(--bg-subtle)",
                border: "1px solid var(--border-1)",
              }}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold"
                style={{
                  background: ["#D97706", "#16A34A", "#2563EB", "#7C3AED", "#DC2626"][i % 5],
                  color: "white",
                }}
              >
                {emp.initials}
              </div>
              <span className="text-[11px] font-medium" style={{ color: "var(--text-1)" }}>
                {emp.name.split(" ")[0]}
              </span>
            </motion.div>
          ))}
          {count > 12 && (
            <div
              className="flex items-center px-2.5 py-1.5 rounded-full"
              style={{ background: "var(--brand-ghost)", border: "1px solid var(--border-1)" }}
            >
              <span className="text-[11px] font-semibold" style={{ color: "var(--brand)", fontFamily: "var(--font-mono-face)" }}>
                +{count - 12}
              </span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════ */
/*  3. PRODUCTIVITY SCORE RING                                */
/*  A circular SVG ring that shows a computed "score" from    */
/*  attendance + leave + payroll readiness data                */
/* ══════════════════════════════════════════════════════════ */

export function ProductivityRing({
  score,
  label,
  sublabel,
}: {
  score: number; // 0-100
  label: string;
  sublabel: string;
}) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = Math.min(100, Math.max(0, score));
  const color =
    normalizedScore >= 75
      ? "var(--success)"
      : normalizedScore >= 50
        ? "var(--warning)"
        : "var(--danger)";

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="rounded-[var(--r-lg)] p-5 flex flex-col items-center"
      style={{
        background: "var(--bg-raised)",
        border: "1px solid var(--border-1)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <div className="relative w-32 h-32 mb-3">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          {/* Background ring */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="var(--border-1)"
            strokeWidth="8"
          />
          {/* Animated progress ring */}
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{
              strokeDashoffset: circumference - (normalizedScore / 100) * circumference,
            }}
            transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-mono-face)", color: "var(--text-1)" }}
          >
            {normalizedScore}
          </span>
          <span className="text-[10px] label-caps">score</span>
        </div>
      </div>
      <h3 className="text-sm font-bold text-center" style={{ fontFamily: "var(--font-display)", color: "var(--text-1)" }}>
        {label}
      </h3>
      <p className="text-xs text-center mt-0.5" style={{ color: "var(--text-3)" }}>
        {sublabel}
      </p>
    </motion.div>
  );
}
