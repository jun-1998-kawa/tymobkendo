"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import HeroNavigation from "@/components/HeroNavigation";

interface Slide {
  image?: string; // 後方互換性のため残す（Phase 1）
  mediaPath?: string; // Phase 2: 画像または動画のパス
  mediaType?: "image" | "video"; // Phase 2: メディアタイプ
  title?: string;
  subtitle?: string;
  kenBurnsEffect?: boolean; // Phase 2: Ken Burnsエフェクト有効化
}

interface HeroSlideshowProps {
  slides: Slide[];
  autoPlayInterval?: number;
  height?: string;
}

export default function HeroSlideshow({
  slides,
  autoPlayInterval = 6000,
  height = "90vh",
}: HeroSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [slides.length, autoPlayInterval]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  return (
    <div
      className="relative overflow-hidden bg-primary-900"
      style={{ height, minHeight: "500px" }}
    >
      {/* Navigation - Always on top */}
      <HeroNavigation />

      {/* Slides */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.5, ease: [0.43, 0.13, 0.23, 0.96] }}
          className="absolute inset-0"
        >
          {/* Background Media (Image or Video) with High Quality */}
          <div className="relative h-full w-full">
            {(() => {
              const currentSlide = slides[currentIndex];
              const mediaPath = currentSlide.mediaPath || currentSlide.image;
              const mediaType = currentSlide.mediaType || "image";
              const hasKenBurns = currentSlide.kenBurnsEffect || false;

              if (mediaType === "video" && mediaPath) {
                return (
                  <video
                    key={mediaPath}
                    src={mediaPath}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                );
              } else if (mediaPath) {
                return (
                  <Image
                    src={mediaPath}
                    alt={currentSlide.title || `Slide ${currentIndex + 1}`}
                    fill
                    quality={100}
                    sizes="100vw"
                    className={`object-cover ${hasKenBurns ? 'animate-ken-burns' : ''}`}
                    priority={currentIndex === 0}
                    unoptimized
                  />
                );
              }
              return null;
            })()}
            {/* Enhanced gradient overlay - darker at top for navigation readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/60" />
          </div>

          {/* Content - Positioned at top center */}
          {(slides[currentIndex].title || slides[currentIndex].subtitle) && (
            <div className="absolute top-0 left-0 right-0 flex items-start justify-center pt-28 md:pt-36 px-4">
              <div className="text-center text-white max-w-4xl">
                {slides[currentIndex].title && (
                  <motion.h1
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="mb-4 font-serif text-4xl font-bold md:text-6xl lg:text-7xl"
                    style={{
                      textShadow: "0 4px 30px rgba(0,0,0,0.9), 0 2px 15px rgba(0,0,0,0.8)"
                    }}
                  >
                    {slides[currentIndex].title}
                  </motion.h1>
                )}
                {slides[currentIndex].subtitle && (
                  <motion.p
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="text-lg md:text-2xl lg:text-3xl text-white/95"
                    style={{
                      textShadow: "0 3px 20px rgba(0,0,0,0.8), 0 2px 10px rgba(0,0,0,0.7)"
                    }}
                  >
                    {slides[currentIndex].subtitle}
                  </motion.p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 z-40 -translate-y-1/2 rounded-full bg-white/20 p-3 backdrop-blur-sm transition-all duration-300 hover:bg-white/40 hover:scale-110"
            aria-label="Previous slide"
          >
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 z-40 -translate-y-1/2 rounded-full bg-white/20 p-3 backdrop-blur-sm transition-all duration-300 hover:bg-white/40 hover:scale-110"
            aria-label="Next slide"
          >
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 z-40 flex -translate-x-1/2 gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-3 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "w-12 bg-white shadow-lg"
                  : "w-3 bg-white/50 hover:bg-white/75"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
