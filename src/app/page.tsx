"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getUrl } from "aws-amplify/storage";
import HeroNavigation from "@/components/HeroNavigation";
import ShinaiSlash from "@/components/ShinaiSlash";
import type { SiteConfig, HeroSlide, News } from "@/lib/amplifyClient";
import outputs from "../../amplify_outputs.json";

interface SlideData {
  image?: string;
  mediaPath?: string;
  mediaType?: "image" | "video";
  title?: string;
  subtitle?: string;
  kenBurnsEffect?: boolean;
}

const defaultHeroSlides = [
  {
    image: "/kosha.jpg",
    title: "戸山高校剣道部OB会",
    subtitle: "",
  },
];

const defaultFooter = {
  copyright: "© 2024 戸山高校剣道部OB会. All rights reserved.",
};

export default function Home() {
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [heroImageUrls, setHeroImageUrls] = useState<string[]>([]);
  const [heroSlides, setHeroSlides] = useState<SlideData[]>([]);
  const [newsList, setNewsList] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [splashComplete, setSplashComplete] = useState(false);
  const [amplifyReady, setAmplifyReady] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeSection, setActiveSection] = useState<"main" | "news" | null>(null);

  useEffect(() => {
    const loadSiteConfig = async () => {
      try {
        Amplify.configure(outputs, { ssr: true });
        setAmplifyReady(true);

        const client = generateClient({ authMode: 'apiKey' });
        const models = client.models as {
          SiteConfig: { list: (options?: unknown) => Promise<{ data: SiteConfig[] | null }> };
          HeroSlide: { list: (options?: unknown) => Promise<{ data: HeroSlide[] | null }> };
          News: { list: (options?: unknown) => Promise<{ data: News[] | null }> };
        };

        // Load site config
        const { data: configs } = await models.SiteConfig.list({
          filter: { isActive: { eq: true } },
          limit: 1,
        });

        // Load news
        const { data: newsData } = await models.News.list({
          filter: { isPublished: { eq: true } },
        });

        if (newsData) {
          const sorted = [...newsData]
            .sort((a, b) => {
              if (a.isPinned && !b.isPinned) return -1;
              if (!a.isPinned && b.isPinned) return 1;
              return new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime();
            })
            .slice(0, 5);
          setNewsList(sorted);
        }

        if (configs && configs.length > 0) {
          const config = configs[0];
          setSiteConfig(config);

          if (config.useHeroSlides) {
            const { data: slides } = await models.HeroSlide.list({
              filter: { isActive: { eq: true } },
            });

            if (slides && slides.length > 0) {
              const sortedSlides = [...slides].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
              const slidesWithUrls = await Promise.all(
                sortedSlides.map(async (slide) => {
                  try {
                    const url = await getUrl({
                      path: `public/${slide.mediaPath}`,
                      options: { validateObjectExistence: false, expiresIn: 3600 }
                    });
                    return {
                      mediaPath: url.url.toString(),
                      mediaType: slide.mediaType ?? undefined,
                      title: slide.title ?? undefined,
                      subtitle: slide.subtitle ?? undefined,
                      kenBurnsEffect: slide.kenBurnsEffect ?? undefined,
                    };
                  } catch {
                    return null;
                  }
                })
              );
              setHeroSlides(slidesWithUrls.filter((s) => s !== null));
            }
          } else {
            if (config.heroImagePaths && config.heroImagePaths.length > 0) {
              const urls = await Promise.all(
                config.heroImagePaths.map(async (path: string) => {
                  const url = await getUrl({
                    path: `public/${path}`,
                    options: { validateObjectExistence: false, expiresIn: 3600 }
                  });
                  return url.url.toString();
                })
              );
              setHeroImageUrls(urls);
            } else if (config.heroImagePath) {
              const url = await getUrl({
                path: `public/${config.heroImagePath}`,
                options: { validateObjectExistence: false, expiresIn: 3600 }
              });
              setHeroImageUrls([url.url.toString()]);
            }
          }
        }
      } catch (error) {
        console.error("Error loading site config:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSiteConfig();
  }, []);

  // Slideshow timer
  useEffect(() => {
    const slides = heroSlides.length > 0 ? heroSlides : heroImageUrls.length > 0 ? heroImageUrls : defaultHeroSlides;
    if (slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, siteConfig?.heroSlideInterval || 6000);

    return () => clearInterval(interval);
  }, [heroSlides, heroImageUrls, siteConfig?.heroSlideInterval]);

  if (!amplifyReady || loading || !splashComplete) {
    return <ShinaiSlash onComplete={() => setSplashComplete(true)} />;
  }

  const slides: SlideData[] = heroSlides.length > 0
    ? heroSlides
    : heroImageUrls.length > 0
    ? heroImageUrls.map(url => ({ image: url }))
    : defaultHeroSlides;

  const currentMedia = slides[currentSlide];
  const mediaPath = currentMedia?.mediaPath || currentMedia?.image;
  const mediaType = currentMedia?.mediaType || 'image';
  const footerCopyright = siteConfig?.footerCopyright || defaultFooter.copyright;

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="relative h-screen w-full overflow-hidden"
    >
      {/* Full Screen Background */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: [0.43, 0.13, 0.23, 0.96] }}
            className="absolute inset-0"
          >
            {mediaType === "video" && mediaPath ? (
              <video
                src={mediaPath}
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-cover"
              />
            ) : mediaPath ? (
              <Image
                src={mediaPath}
                alt="Background"
                fill
                quality={100}
                className="object-cover animate-ken-burns"
                priority
                unoptimized
              />
            ) : null}
          </motion.div>
        </AnimatePresence>
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
      </div>

      {/* Navigation */}
      <HeroNavigation />

      {/* Content Overlay */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4">
        {/* Main Title */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mb-12 text-center"
        >
          <h1 className="font-serif text-4xl font-bold text-white md:text-6xl lg:text-7xl"
            style={{ textShadow: "0 4px 30px rgba(0,0,0,0.5)" }}>
            {siteConfig?.heroTitle || "戸山高校剣道部OB会"}
          </h1>
          {siteConfig?.heroSubtitle && (
            <p className="mt-4 text-lg text-white/90 md:text-xl"
              style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}>
              {siteConfig.heroSubtitle}
            </p>
          )}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6"
        >
          {/* News Button */}
          {newsList.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveSection(activeSection === "news" ? null : "news")}
              className="group flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              <span>お知らせ</span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-500 text-xs">
                {newsList.length}
              </span>
            </motion.button>
          )}

          {/* Login Button */}
          <Link href="/app">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-primary-900 shadow-lg transition-all hover:bg-white/90"
            >
              会員ログイン
            </motion.div>
          </Link>
        </motion.div>

        {/* Slide Indicators */}
        {slides.length > 1 && (
          <div className="absolute bottom-24 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentSlide ? "w-8 bg-white" : "w-1.5 bg-white/50 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-xs text-white/50">{footerCopyright}</p>
        </div>
      </div>

      {/* News Panel Overlay */}
      <AnimatePresence>
        {activeSection === "news" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setActiveSection(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="mx-4 max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white/95 shadow-2xl backdrop-blur-lg"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <h2 className="text-xl font-bold text-gray-900">お知らせ</h2>
                <button
                  onClick={() => setActiveSection(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* News List */}
              <div className="max-h-[60vh] overflow-y-auto p-4">
                {newsList.map((news, index) => (
                  <motion.div
                    key={news.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/news/${news.id}`}>
                      <div className="group mb-3 rounded-xl border border-gray-100 bg-white p-4 transition-all hover:border-accent-200 hover:shadow-md">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="rounded-full bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-700">
                            {news.category}
                          </span>
                          {news.isPinned && (
                            <span className="rounded-full bg-gold-50 px-2 py-0.5 text-xs font-medium text-gold-700">
                              重要
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            {new Date(news.publishedAt || news.createdAt).toLocaleDateString("ja-JP")}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900 transition-colors group-hover:text-accent-600">
                          {news.title}
                        </h3>
                        {news.excerpt && (
                          <p className="mt-1 text-sm text-gray-500 line-clamp-2">{news.excerpt}</p>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}
