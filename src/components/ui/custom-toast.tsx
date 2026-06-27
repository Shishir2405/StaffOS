"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  createContext,
  useContext,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiCheckLine,
  RiCloseLine,
  RiErrorWarningLine,
  RiInformationLine,
  RiAlertLine,
} from "react-icons/ri";

/* ═══════════════════════════════════════════════════════════ */
/*  TYPES                                                      */
/* ═══════════════════════════════════════════════════════════ */

type ToastType = "success" | "error" | "warning" | "info" | "default";

interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  dissolving?: boolean;
}

interface ToastContextType {
  addToast: (type: ToastType, title: string, options?: { description?: string; duration?: number }) => void;
  dismissAll: () => void;
}

/* ═══════════════════════════════════════════════════════════ */
/*  PARTICLE SYSTEM                                            */
/* ═══════════════════════════════════════════════════════════ */

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  velocityX: number;
  velocityY: number;
  color: string;
}

function generateParticles(
  rect: { width: number; height: number },
  color: string,
  count: number = 40
): Particle[] {
  const particles: Particle[] = [];
  const colors = [
    color,
    "var(--bg-subtle)",
    "rgba(255,255,255,0.8)",
    color,
    "var(--border-1)",
  ];

  for (let i = 0; i < count; i++) {
    particles.push({
      id: i,
      x: Math.random() * rect.width,
      y: Math.random() * rect.height,
      size: Math.random() * 4 + 1.5,
      opacity: Math.random() * 0.8 + 0.2,
      velocityX: (Math.random() - 0.5) * 120,
      velocityY: (Math.random() - 0.5) * 80 - 30,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }
  return particles;
}

function ParticleField({
  particles,
  width,
  height,
}: {
  particles: Particle[];
  width: number;
  height: number;
}) {
  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-visible"
      style={{ width, height }}
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: p.color,
            left: p.x,
            top: p.y,
            filter: "blur(0.5px)",
          }}
          initial={{ opacity: p.opacity, scale: 1 }}
          animate={{
            x: p.velocityX,
            y: p.velocityY,
            opacity: 0,
            scale: 0,
          }}
          transition={{
            duration: 0.8 + Math.random() * 0.5,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  TOAST CONFIG                                               */
/* ═══════════════════════════════════════════════════════════ */

const typeConfig: Record<
  ToastType,
  { icon: typeof RiCheckLine; color: string; glowColor: string; bgTint: string }
> = {
  success: {
    icon: RiCheckLine,
    color: "#16A34A",
    glowColor: "rgba(22,163,74,0.15)",
    bgTint: "rgba(22,163,74,0.04)",
  },
  error: {
    icon: RiCloseLine,
    color: "#DC2626",
    glowColor: "rgba(220,38,38,0.15)",
    bgTint: "rgba(220,38,38,0.04)",
  },
  warning: {
    icon: RiAlertLine,
    color: "#4A154B",
    glowColor: "rgba(74,21,75,0.15)",
    bgTint: "rgba(74,21,75,0.04)",
  },
  info: {
    icon: RiInformationLine,
    color: "#2563EB",
    glowColor: "rgba(37,99,235,0.15)",
    bgTint: "rgba(37,99,235,0.04)",
  },
  default: {
    icon: RiInformationLine,
    color: "var(--text-2)",
    glowColor: "rgba(160,140,114,0.1)",
    bgTint: "rgba(160,140,114,0.03)",
  },
};

/* ═══════════════════════════════════════════════════════════ */
/*  SINGLE TOAST                                               */
/* ═══════════════════════════════════════════════════════════ */

function SingleToast({
  toast,
  onDismiss,
}: {
  toast: ToastData;
  onDismiss: (id: string) => void;
}) {
  const config = typeConfig[toast.type];
  const Icon = config.icon;
  const ref = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [dissolving, setDissolving] = useState(false);
  const [dims, setDims] = useState({ width: 360, height: 72 });

  const startDissolve = useCallback(() => {
    if (dissolving) return;
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setDims({ width: rect.width, height: rect.height });
      setParticles(generateParticles({ width: rect.width, height: rect.height }, config.color, 45));
    }
    setDissolving(true);
    setTimeout(() => onDismiss(toast.id), 1000);
  }, [dissolving, config.color, onDismiss, toast.id]);

  // Auto-dismiss timer
  useEffect(() => {
    const duration = toast.duration ?? 4000;
    const timer = setTimeout(startDissolve, duration);
    return () => clearTimeout(timer);
  }, [toast.duration, startDissolve]);

  // Progress bar duration
  const duration = toast.duration ?? 4000;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.92, filter: "blur(8px)" }}
      animate={
        dissolving
          ? {
              opacity: 0,
              scale: 0.85,
              filter: "blur(12px)",
              y: -10,
            }
          : {
              opacity: 1,
              y: 0,
              scale: 1,
              filter: "blur(0px)",
            }
      }
      exit={{ opacity: 0, scale: 0.8, filter: "blur(10px)", y: -20 }}
      transition={
        dissolving
          ? { duration: 0.6, ease: "easeIn" }
          : { type: "spring", stiffness: 400, damping: 30 }
      }
      className="relative"
    >
      {/* Particle field on dissolve */}
      {dissolving && (
        <ParticleField
          particles={particles}
          width={dims.width}
          height={dims.height}
        />
      )}

      {/* Toast body */}
      <div
        ref={ref}
        className="relative overflow-hidden flex items-start gap-3 px-4 py-3.5 cursor-pointer"
        onClick={startDissolve}
        style={{
          /* Glassmorphism / neomorphism */
          background: `linear-gradient(135deg, rgba(255,255,255,0.72), rgba(255,255,255,0.52))`,
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.45)",
          borderRadius: "var(--r-lg)",
          boxShadow: `
            0 8px 32px rgba(30,10,35,0.08),
            0 2px 8px rgba(30,10,35,0.04),
            inset 0 1px 0 rgba(255,255,255,0.6),
            inset 0 -1px 0 rgba(0,0,0,0.02)
          `,
          minWidth: 320,
          maxWidth: 420,
          fontFamily: "var(--font-body)",
        }}
      >
        {/* Colored tint overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: config.bgTint,
            borderRadius: "var(--r-lg)",
          }}
        />

        {/* Icon with glow */}
        <div className="relative shrink-0 mt-0.5">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: config.glowColor,
              filter: "blur(8px)",
              transform: "scale(2)",
            }}
          />
          <div
            className="relative w-8 h-8 rounded-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${config.color}18, ${config.color}08)`,
              border: `1px solid ${config.color}25`,
            }}
          >
            <Icon size={16} style={{ color: config.color }} />
          </div>
        </div>

        {/* Content */}
        <div className="relative flex-1 min-w-0 pt-0.5">
          <p
            className="text-sm font-semibold leading-tight truncate"
            style={{ color: "var(--text-1)" }}
          >
            {toast.title}
          </p>
          {toast.description && (
            <p
              className="text-xs mt-1 leading-relaxed"
              style={{ color: "var(--text-2)", opacity: 0.85 }}
            >
              {toast.description}
            </p>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            startDissolve();
          }}
          className="relative shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--text-3)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(0,0,0,0.05)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "transparent";
          }}
        >
          <RiCloseLine size={14} />
        </button>

        {/* Progress bar */}
        {!dissolving && (
          <motion.div
            className="absolute bottom-0 left-0 h-[2px]"
            style={{
              background: `linear-gradient(90deg, ${config.color}40, ${config.color}15)`,
              borderRadius: "0 0 var(--r-lg) var(--r-lg)",
            }}
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: duration / 1000, ease: "linear" }}
          />
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  CONTEXT + PROVIDER                                         */
/* ═══════════════════════════════════════════════════════════ */

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback(
    (
      type: ToastType,
      title: string,
      options?: { description?: string; duration?: number }
    ) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [
        ...prev,
        {
          id,
          type,
          title,
          description: options?.description,
          duration: options?.duration,
        },
      ]);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, dismissAll }}>
      {children}

      {/* Toast container */}
      <div
        className="fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-3 sm:bottom-6 sm:right-6"
        style={{ pointerEvents: "none" }}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <div key={t.id} style={{ pointerEvents: "auto" }}>
              <SingleToast toast={t} onDismiss={dismissToast} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/*  HOOK                                                       */
/* ═══════════════════════════════════════════════════════════ */

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");

  return {
    success: (title: string, options?: { description?: string; duration?: number }) =>
      ctx.addToast("success", title, options),
    error: (title: string, options?: { description?: string; duration?: number }) =>
      ctx.addToast("error", title, options),
    warning: (title: string, options?: { description?: string; duration?: number }) =>
      ctx.addToast("warning", title, options),
    info: (title: string, options?: { description?: string; duration?: number }) =>
      ctx.addToast("info", title, options),
    message: (title: string, options?: { description?: string; duration?: number }) =>
      ctx.addToast("default", title, options),
  };
}

/* ═══════════════════════════════════════════════════════════ */
/*  IMPERATIVE API (drop-in replacement for sonner's toast)    */
/*  This uses a singleton pattern so it works outside React    */
/* ═══════════════════════════════════════════════════════════ */

type Listener = (type: ToastType, title: string, opts?: { description?: string; duration?: number }) => void;

let _listener: Listener | null = null;

export function registerToastListener(fn: Listener) {
  _listener = fn;
}

type DismissFn = () => void;
let _dismissAll: DismissFn | null = null;

export function registerDismissListener(fn: DismissFn) {
  _dismissAll = fn;
}

export const toast = {
  success: (title: string, opts?: { description?: string; duration?: number }) => {
    _listener?.("success", title, opts);
  },
  error: (title: string, opts?: { description?: string; duration?: number }) => {
    _listener?.("error", title, opts);
  },
  warning: (title: string, opts?: { description?: string; duration?: number }) => {
    _listener?.("warning", title, opts);
  },
  info: (title: string, opts?: { description?: string; duration?: number }) => {
    _listener?.("info", title, opts);
  },
  message: (title: string, opts?: { description?: string; duration?: number }) => {
    _listener?.("default", title, opts);
  },
  loading: (title: string, opts?: { description?: string }) => {
    _listener?.("default", title, { ...opts, duration: 30000 });
  },
  dismiss: () => {
    _dismissAll?.();
  },
};

/* ═══════════════════════════════════════════════════════════ */
/*  BRIDGE COMPONENT                                           */
/*  Sits inside ToastProvider, registers the imperative API    */
/* ═══════════════════════════════════════════════════════════ */

export function ToastBridge() {
  const ctx = useContext(ToastContext);

  useEffect(() => {
    if (ctx) {
      registerToastListener(ctx.addToast);
      registerDismissListener(ctx.dismissAll);
    }
    return () => {
      _listener = null;
      _dismissAll = null;
    };
  }, [ctx]);

  return null;
}
