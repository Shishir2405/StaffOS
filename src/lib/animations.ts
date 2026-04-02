import type { Variants, Transition } from "framer-motion"

export const spring: Transition = { type: "spring", stiffness: 400, damping: 30 }
export const easeOut: Transition = { duration: 0.22, ease: [0.16, 1, 0.3, 1] }

export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { ...easeOut, staggerChildren: 0.06 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.14 } },
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: easeOut },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 500, damping: 35 } },
  exit: { opacity: 0, scale: 0.94, transition: { duration: 0.12 } },
}

export const slideRight: Variants = {
  hidden: { x: "100%", opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { ...spring, mass: 0.8 } },
  exit: { x: "100%", opacity: 0, transition: { duration: 0.18 } },
}

export const slideLeft: Variants = {
  hidden: { x: "-100%", opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { ...spring, mass: 0.8 } },
  exit: { x: "-100%", opacity: 0, transition: { duration: 0.18 } },
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
}

export const listItem: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: easeOut },
}

export const buttonTap = { scale: 0.97 }
