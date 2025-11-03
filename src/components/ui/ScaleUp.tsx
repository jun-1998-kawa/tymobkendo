"use client";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface ScaleUpProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export default function ScaleUp({
  children,
  delay = 0,
  duration = 0.4,
  className = "",
}: ScaleUpProps) {
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
