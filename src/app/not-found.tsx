import Link from "next/link";
import { RiHomeLine, RiArrowLeftLine, RiArrowRightLine } from "react-icons/ri";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{
        background: "var(--background)",
        fontFamily: "var(--font-dm-sans)",
      }}
    >
      {/* Bg glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "15%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 520,
          height: 520,
          background: "oklch(0.198 0.068 262 / 0.055)",
          filter: "blur(110px)",
          borderRadius: "50%",
        }}
      />

      <div className="relative text-center max-w-lg w-full">
        {/* 404 number */}
        <div
          className="anim-up d-0 relative mb-6 select-none"
          style={{ lineHeight: 1 }}
        >
          {/* Decorative behind */}
          <span
            className="absolute inset-0 flex items-center justify-center text-[10rem] font-bold select-none pointer-events-none"
            style={{
              fontFamily: "var(--font-playfair)",
              color: "var(--border)",
              opacity: 0.5,
              letterSpacing: "-0.04em",
              userSelect: "none",
            }}
            aria-hidden
          >
            404
          </span>
          {/* Foreground */}
          <span
            className="relative text-[10rem] font-bold"
            style={{
              fontFamily: "var(--font-playfair)",
              letterSpacing: "-0.04em",
              background: `linear-gradient(135deg, var(--brand-navy) 0%, var(--brand-rose) 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            404
          </span>
        </div>

        {/* Text */}
        <div className="anim-up d-1 mb-8">
          <p
            className="text-xs font-medium tracking-[0.16em] uppercase mb-3"
            style={{ color: "var(--brand-rose)" }}
          >
            Page Not Found
          </p>
          <h1
            className="text-4xl font-semibold mb-3"
            style={{
              fontFamily: "var(--font-playfair)",
              color: "var(--foreground)",
            }}
          >
            Lost in{" "}
            <span style={{ color: "var(--brand-rose)", fontStyle: "italic" }}>
              the void.
            </span>
          </h1>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--muted-foreground)" }}
          >
            We couldn't find the page you're looking for. It may have been
            moved, deleted, or never existed in the first place.
          </p>
        </div>

        {/* Buttons */}
        <div className="anim-up d-2 flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="javascript:history.back()"
            className="btn-ghost inline-flex items-center gap-2"
            style={{
              width: "auto",
              display: "inline-flex",
              textDecoration: "none",
            }}
          >
            <RiArrowLeftLine size={15} />
            Go Back
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2"
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
              letterSpacing: "0.01em",
            }}
          >
            <RiHomeLine size={15} />
            Back to Home
            <RiArrowRightLine size={14} />
          </Link>
        </div>

        {/* Small help text */}
        <p
          className="anim-up d-3 mt-10 text-xs"
          style={{ color: "var(--muted-foreground)", opacity: 0.6 }}
        >
          Need help?{" "}
          <Link
            href="/support"
            style={{ color: "var(--brand-rose)", textDecoration: "none" }}
            className="hover:opacity-70 transition-opacity"
          >
            Contact support →
          </Link>
        </p>
      </div>
    </div>
  );
}
