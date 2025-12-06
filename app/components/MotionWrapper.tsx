"use client";

import { motion, MotionProps } from "framer-motion";
import { ReactNode } from "react";

interface MotionWrapperProps extends MotionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  viewport?: { once: boolean; amount: number };
  variant?: "fadeInUp" | "fadeInLeft" | "fadeInRight" | "scaleUp" | "fadeIn";
}

const variants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0 },
  fadeInUp: {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  },
  fadeInLeft: {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0 },
  },
  fadeInRight: {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
  },
  scaleUp: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
};

export default function MotionWrapper({
  children,
  className = "",
  delay = 0,
  viewport = { once: true, amount: 0.2 },
  variant = "fadeInUp",
  ...props
}: MotionWrapperProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      variants={variants[variant]}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
