"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  RiRefreshLine,
  RiHomeLine,
  RiErrorWarningLine,
  RiArrowRightLine,
} from "react-icons/ri";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{
        background: "var(--background)",
        fontFamily: "var(--font-dm-sans)",
      }}
    >
      {/* Subtle bg accent */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 480,
          height: 480,
          background: "oklch(0.578 0.232 13 / 0.06)",
          filter: "blur(100px)",
          borderRadius: "50%",
        }}
      />

      <div className="relative text-center max-w-lg w-full">
        {/* Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-center mb-8"
        >
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{
              background: "var(--brand-rose-soft)",
              border: "1.5px solid var(--brand-rose-border)",
            }}
          >
            <RiErrorWarningLine
              size={38}
              style={{ color: "var(--brand-rose)" }}
            />
          </div>
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.52, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <p
            className="text-xs font-medium tracking-[0.16em] uppercase mb-3"
            style={{ color: "var(--brand-rose)" }}
          >
            Unexpected Error
          </p>
          <h1
            className="text-4xl font-semibold mb-3"
            style={{
              fontFamily: "var(--font-playfair)",
              color: "var(--foreground)",
            }}
          >
            Something went{" "}
            <span style={{ color: "var(--brand-rose)", fontStyle: "italic" }}>
              wrong.
            </span>
          </h1>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--muted-foreground)" }}
          >
            An unexpected error occurred. Please try again — if the problem
            persists, reach out to our support team.
          </p>

          {error.digest && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="inline-flex items-center gap-2 mt-5 px-3.5 py-2 rounded-lg"
              style={{
                background: "var(--secondary)",
                border: "1px solid var(--border)",
              }}
            >
              <span
                className="text-xs"
                style={{ color: "var(--muted-foreground)" }}
              >
                Error ID:
              </span>
              <code
                className="text-xs font-mono"
                style={{ color: "var(--foreground)" }}
              >
                {error.digest}
              </code>
            </motion.div>
          )}
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.22 }}
          className="flex items-center justify-center gap-3 flex-wrap"
        >
          <button
            onClick={reset}
            className="btn-ghost inline-flex items-center gap-2 w-auto px-6"
            style={{ width: "auto" }}
          >
            <RiRefreshLine size={15} />
            Try Again
          </button>
          <Link
            href="/"
            className="btn-navy inline-flex items-center gap-2 w-auto px-6"
            style={{
              width: "auto",
              display: "inline-flex",
              textDecoration: "none",
              borderRadius: "12px",
              padding: "13px 24px",
              background: "var(--brand-navy)",
              color: "white",
              fontSize: "0.9rem",
              fontWeight: 500,
              fontFamily: "var(--font-dm-sans)",
              boxShadow: "0 4px 20px -4px oklch(0.198 0.068 262 / 0.30)",
              transition: "background 0.16s, transform 0.12s",
            }}
          >
            <RiHomeLine size={15} />
            Back to Home
            <RiArrowRightLine size={14} />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
