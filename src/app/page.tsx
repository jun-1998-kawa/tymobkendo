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

        // 未ログインユーザーは Cognito Identity Pool の guest credentials で IAM 認証
        const client = generateClient({ authMode: 'identityPool' });
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
          <h1 className="text-shadow-hero font-serif text-4xl font-bold tracking-wide text-white md:text-6xl lg:text-7xl">
            {siteConfig?.heroTitle || "戸山高校剣道部OB会"}
          </h1>
          {/* 朱→金 のシグネチャグラデーション細線 — タイトル下の装飾 */}
          <div className="mx-auto mt-6 h-[2px] w-24 bg-gradient-to-r from-accent-500 to-gold-500 opacity-90" />
          {siteConfig?.heroSubtitle && (
            <p className="text-shadow-hero-soft mt-5 font-serif text-lg text-white/90 md:text-xl">
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
          {/* News Button — secondary (glass) */}
          {newsList.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveSection(activeSection === "news" ? null : "news")}
              className="group flex items-center gap-2 border border-white/30 bg-white/10 px-6 py-3 font-serif text-sm font-medium tracking-wide text-white backdrop-blur-sm transition-all hover:border-white/50 hover:bg-white/20"
            >
              <span>お知らせ</span>
              <span className="kendo-pill flex h-5 w-5 items-center justify-center bg-accent-500 text-xs font-bold text-white">
                {newsList.length}
              </span>
            </motion.button>
          )}

          {/* Login Button — primary CTA (white surface, accent underline on hover) */}
          <Link href="/app">
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="group relative overflow-hidden bg-white px-8 py-3 font-serif text-sm font-semibold tracking-wide text-primary-900 shadow-lg transition-all hover:shadow-xl"
            >
              <span className="relative z-10">会員ログイン</span>
              {/* hover で朱→金の下線が走る */}
              <span className="absolute bottom-0 left-0 h-[3px] w-0 bg-gradient-to-r from-accent-500 to-gold-500 transition-all duration-300 group-hover:w-full" />
            </motion.div>
          </Link>
        </motion.div>

        {/* Slide Indicators */}
        {slides.length > 1 && (
          <div className="absolute bottom-24 left-1/2 flex -translate-x-1/2 items-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                aria-label={`スライド ${index + 1}`}
                onClick={() => setCurrentSlide(index)}
                className={`kendo-pill h-1.5 transition-all duration-300 ${
                  index === currentSlide
                    ? "w-10 bg-gradient-to-r from-accent-500 to-gold-500"
                    : "w-1.5 bg-white/50 hover:bg-white/80"
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
              className="relative mx-4 max-h-[80vh] w-full max-w-2xl overflow-hidden bg-white/95 shadow-2xl backdrop-blur-lg"
            >
              {/* signature 朱→金 アクセントバー (上端) */}
              <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-accent-500 via-accent-700 to-gold-500" />

              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <h2 className="font-serif text-xl font-bold text-primary-900">
                  <span className="underline-gold">お知らせ</span>
                </h2>
                <button
                  aria-label="閉じる"
                  onClick={() => setActiveSection(null)}
                  className="kendo-pill flex h-8 w-8 items-center justify-center text-gray-400 transition-colors hover:bg-gray-100 hover:text-accent-700"
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
                      <div className="card-accent-bar group mb-3 border border-gray-100 bg-white p-4 pl-5 transition-all hover:border-accent-200 hover:shadow-md">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-700">
                            {news.category}
                          </span>
                          {news.isPinned && (
                            <span className="bg-gold-50 px-2 py-0.5 text-xs font-medium text-gold-700">
                              重要
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            {new Date(news.publishedAt || news.createdAt).toLocaleDateString("ja-JP")}
                          </span>
                        </div>
                        <h3 className="font-medium text-primary-900 transition-colors group-hover:text-accent-700">
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
