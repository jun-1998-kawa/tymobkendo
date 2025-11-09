"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ShinaiSlashProps {
  onComplete?: () => void;
  skipOnRevisit?: boolean;
}

export default function ShinaiSlash({ onComplete, skipOnRevisit = true }: ShinaiSlashProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [hasVisited, setHasVisited] = useState(false);

  useEffect(() => {
    // Check if user has already visited
    if (skipOnRevisit) {
      const visited = sessionStorage.getItem("shinai-slash-seen");
      if (visited) {
        setHasVisited(true);
        setIsVisible(false);
        onComplete?.();
        return;
      }
    }

    // Mark as visited
    if (skipOnRevisit) {
      sessionStorage.setItem("shinai-slash-seen", "true");
    }

    // Auto-hide after animation completes
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete, skipOnRevisit]);

  if (hasVisited) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-primary-900"
          style={{ pointerEvents: isVisible ? "auto" : "none" }}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_48%,currentColor_49%,currentColor_51%,transparent_52%),linear-gradient(-45deg,transparent_48%,currentColor_49%,currentColor_51%,transparent_52%)] bg-[length:20px_20px] text-white"></div>
          </div>

          {/* Main content */}
          <div className="relative z-10">
            {/* Shinai slash line */}
            <motion.div
              initial={{ scaleX: 0, rotate: -45, opacity: 0 }}
              animate={{ scaleX: 1, rotate: -45, opacity: [0, 1, 1, 0] }}
              transition={{
                duration: 1.2,
                times: [0, 0.1, 0.9, 1],
                ease: "easeInOut",
              }}
              className="absolute left-1/2 top-1/2 h-1 w-[150vw] origin-center -translate-x-1/2 -translate-y-1/2"
            >
              {/* Main slash line with gradient */}
              <div className="relative h-full w-full">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>

                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-300 to-transparent blur-md"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200 to-transparent blur-xl opacity-50"></div>
              </div>

              {/* Spark particles */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, x: 0, y: 0 }}
                  animate={{
                    scale: [0, 1, 0],
                    x: (Math.random() - 0.5) * 100,
                    y: (Math.random() - 0.5) * 100,
                  }}
                  transition={{
                    duration: 0.8,
                    delay: 0.3 + i * 0.05,
                    ease: "easeOut",
                  }}
                  className="absolute h-2 w-2 rounded-full bg-amber-400"
                  style={{
                    left: `${20 + i * 10}%`,
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                />
              ))}
            </motion.div>

            {/* Title that appears after slash */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: [0, 0, 1], y: [20, 20, 0] }}
              transition={{
                duration: 1,
                delay: 0.8,
                times: [0, 0.5, 1],
              }}
              className="relative text-center"
            >
              <h1 className="mb-4 font-serif text-5xl font-bold text-white md:text-6xl lg:text-7xl">
                戸山高校剣道部
              </h1>
              <p className="text-2xl font-light text-amber-300 md:text-3xl">
                OB会
              </p>

              {/* Underline decoration */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                className="mx-auto mt-6 h-1 w-32 origin-center bg-gradient-to-r from-transparent via-amber-500 to-transparent"
              />
            </motion.div>

            {/* Split effect overlay */}
            <motion.div
              initial={{ scaleY: 1 }}
              animate={{ scaleY: 0 }}
              transition={{
                duration: 0.6,
                delay: 1.8,
                ease: "easeInOut",
              }}
              className="absolute left-0 top-0 h-1/2 w-full origin-top bg-primary-900"
            />
            <motion.div
              initial={{ scaleY: 1 }}
              animate={{ scaleY: 0 }}
              transition={{
                duration: 0.6,
                delay: 1.8,
                ease: "easeInOut",
              }}
              className="absolute bottom-0 left-0 h-1/2 w-full origin-bottom bg-primary-900"
            />
          </div>

          {/* Skip button (optional) */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            onClick={() => {
              setIsVisible(false);
              onComplete?.();
            }}
            className="absolute bottom-8 right-8 z-20 rounded-lg border border-amber-500/30 bg-primary-800/50 px-4 py-2 text-sm text-amber-300 backdrop-blur-sm transition-all hover:border-amber-500/50 hover:bg-primary-800/70"
          >
            スキップ
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
