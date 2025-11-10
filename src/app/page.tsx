"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { generateClient } from "aws-amplify/data";
import { getUrl } from "aws-amplify/storage";
import HeroSlideshow from "@/components/ui/HeroSlideshow";
import NewsSection from "@/components/NewsSection";
import FadeIn from "@/components/ui/FadeIn";
import SlideIn from "@/components/ui/SlideIn";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";
import ShinaiSlash from "@/components/ShinaiSlash";

const client = generateClient();
const models = client.models as any;

type SiteConfig = any;
type Feature = {
  icon: string;
  title: string;
  description: string;
};

// デフォルトのコンテンツ（フォールバック用）
const defaultHeroSlides = [
  {
    image: "/kosha.jpg",
    title: "戸山高校剣道部OB会",
    subtitle: "伝統を継承し、絆を深める",
  },
];

const defaultWelcome = {
  title: "ようこそ",
  body: "戸山高校剣道部OB会の公式サイトへようこそ。\nこのサイトは、OB会員の皆様が交流し、思い出を共有し、\n母校剣道部の伝統を次世代へ繋いでいくための場所です。",
};

const defaultFeatures: Feature[] = [
  {
    icon: "💬",
    title: "近況投稿",
    description: "140文字で気軽に近況を共有。会員同士のコミュニケーションを活性化します。",
  },
  {
    icon: "📋",
    title: "掲示板",
    description: "スレッド形式でディスカッション。重要な情報はピン留めで常に上位表示。",
  },
  {
    icon: "📜",
    title: "歴史アーカイブ",
    description: "戸山高校剣道部の歴史を振り返る。公開情報と会員限定情報を管理。",
  },
];

const defaultCTA = {
  title: "会員の皆様へ",
  body: "ログインして、懐かしい仲間との交流をお楽しみください。\n戸山剣道部の思い出を共有し、絆を深めましょう。",
};

const defaultFooter = {
  copyright: "© 2024 戸山高校剣道部OB会. All rights reserved.",
};

export default function Home() {
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [heroImageUrls, setHeroImageUrls] = useState<string[]>([]);
  const [heroSlides, setHeroSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [features, setFeatures] = useState<Feature[]>(defaultFeatures);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const loadSiteConfig = async () => {
      try {
        const { data: configs } = await models.SiteConfig.list({
          filter: { isActive: { eq: true } },
          limit: 1,
        });

        if (configs && configs.length > 0) {
          const config = configs[0];
          setSiteConfig(config);

          // featuresJsonをパース
          if (config.featuresJson) {
            try {
              const parsedFeatures = JSON.parse(config.featuresJson);
              setFeatures(parsedFeatures);
            } catch (e) {
              console.error("Failed to parse featuresJson:", e);
            }
          }

          // Phase 2: HeroSlideモデルを使用する場合
          if (config.useHeroSlides) {
            try {
              const { data: slides } = await models.HeroSlide.list({
                filter: { isActive: { eq: true } },
              });

              if (slides && slides.length > 0) {
                // order でソート
                const sortedSlides = [...slides].sort((a: any, b: any) => a.order - b.order);

                // メディアURLを取得
                const slidesWithUrls = await Promise.all(
                  sortedSlides.map(async (slide: any) => {
                    try {
                      const url = await getUrl({ path: `public/${slide.mediaPath}` });
                      return {
                        mediaPath: url.url.toString(),
                        mediaType: slide.mediaType,
                        title: slide.title,
                        subtitle: slide.subtitle,
                        kenBurnsEffect: slide.kenBurnsEffect,
                      };
                    } catch (e) {
                      console.error("Failed to load slide media:", e);
                      return null;
                    }
                  })
                );

                setHeroSlides(slidesWithUrls.filter((s) => s !== null));
              }
            } catch (e) {
              console.error("Failed to load hero slides:", e);
            }
          }
          // Phase 1: 従来の方式（heroImagePaths配列）
          else {
            // 複数ヒーロー画像のURL取得（優先）
            if (config.heroImagePaths && config.heroImagePaths.length > 0) {
              try {
                const urlPromises = config.heroImagePaths.map(async (path: string) => {
                  const url = await getUrl({ path: `public/${path}` });
                  return url.url.toString();
                });
                const urls = await Promise.all(urlPromises);
                setHeroImageUrls(urls);
              } catch (e) {
                console.error("Failed to load hero images:", e);
              }
            }
            // 後方互換性: 単一画像パスのフォールバック
            else if (config.heroImagePath) {
              try {
                const url = await getUrl({
                  path: `public/${config.heroImagePath}`,
                });
                setHeroImageUrls([url.url.toString()]);
              } catch (e) {
                console.error("Failed to load hero image:", e);
              }
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

  // ローディング中は何も表示しない（またはスピナーを表示）
  if (loading) {
    return (
      <>
        <ShinaiSlash onComplete={() => setShowContent(true)} />
        <main className="flex min-h-screen items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent-600 border-t-transparent"></div>
        </main>
      </>
    );
  }

  // データを取得（Phase 2 or Phase 1 or デフォルト値）
  const slides =
    // Phase 2: HeroSlideモデルのデータがある場合
    heroSlides.length > 0
      ? heroSlides
      // Phase 1: heroImagePathsがある場合
      : siteConfig && heroImageUrls.length > 0
      ? heroImageUrls.map(url => ({
          image: url,
          title: siteConfig.heroTitle || defaultHeroSlides[0].title,
          subtitle: siteConfig.heroSubtitle || defaultHeroSlides[0].subtitle,
        }))
      // デフォルト値
      : defaultHeroSlides;

  const slideInterval = siteConfig?.heroSlideInterval || 6000;

  const welcomeTitle = siteConfig?.welcomeTitle || defaultWelcome.title;
  const welcomeBody = siteConfig?.welcomeBody || defaultWelcome.body;
  const ctaTitle = siteConfig?.ctaTitle || defaultCTA.title;
  const ctaBody = siteConfig?.ctaBody || defaultCTA.body;
  const footerCopyright = siteConfig?.footerCopyright || defaultFooter.copyright;

  return (
    <>
      <ShinaiSlash onComplete={() => setShowContent(true)} />
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: showContent ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen"
      >
      {/* Hero Slideshow Section */}
      <HeroSlideshow slides={slides} height="70vh" autoPlayInterval={slideInterval} />

      {/* News Section */}
      <NewsSection />

      {/* Welcome Section with Negative Space */}
      <section className="bg-white px-4 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <FadeIn>
            <h2 className="mb-6 font-serif text-4xl font-bold text-primary-800 md:text-5xl">
              {welcomeTitle}
            </h2>
            <p className="mb-8 text-lg leading-relaxed text-primary-600 md:text-xl">
              {welcomeBody.split("\n").map((line: string, i: number) => (
                <span key={i}>
                  {line}
                  {i < welcomeBody.split("\n").length - 1 && <br />}
                </span>
              ))}
            </p>
          </FadeIn>

          <SlideIn direction="up" delay={0.3}>
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/app"
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-accent-600 to-accent-700 px-10 py-4 text-lg font-semibold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                <span className="relative z-10">会員ページへ</span>
                <div className="absolute inset-0 bg-gradient-to-r from-accent-700 to-accent-800 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              </Link>

              <Link
                href="#about"
                className="inline-flex items-center justify-center rounded-full border-2 border-primary-800 px-10 py-4 text-lg font-semibold text-primary-800 transition-all duration-300 hover:bg-primary-800 hover:text-white"
              >
                詳しく見る
              </Link>
            </div>
          </SlideIn>
        </div>
      </section>

      {/* Features Section with Traditional Design */}
      <section id="about" className="bg-gradient-to-b from-primary-50 to-white px-4 py-32">
        <div className="mx-auto max-w-7xl">
          <FadeIn>
            <div className="mb-20 text-center">
              <div className="mb-4 inline-block border-b-4 border-accent-600 pb-2">
                <h2 className="font-serif text-4xl font-bold text-primary-800 md:text-5xl">
                  会員サービス
                </h2>
              </div>
              <p className="mt-6 text-lg leading-relaxed text-primary-600">
                OB会員の皆様が快適にご利用いただける
                <br />
                充実した機能をご用意しています
              </p>
            </div>
          </FadeIn>

          <Stagger staggerDelay={0.2} className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <StaggerItem key={index}>
                <FeatureCard
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* CTA Section with Traditional Accent */}
      <section className="relative overflow-hidden bg-primary-900 px-4 py-32">
        {/* Traditional Pattern Background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_48%,currentColor_49%,currentColor_51%,transparent_52%),linear-gradient(-45deg,transparent_48%,currentColor_49%,currentColor_51%,transparent_52%)] bg-[length:20px_20px] text-white"></div>
        </div>

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <SlideIn direction="up">
            <h2 className="mb-8 font-serif text-4xl font-bold text-white md:text-5xl">
              {ctaTitle}
            </h2>
            <p className="mb-12 text-xl leading-relaxed text-primary-100">
              {ctaBody.split("\n").map((line: string, i: number) => (
                <span key={i}>
                  {line}
                  {i < ctaBody.split("\n").length - 1 && <br />}
                </span>
              ))}
            </p>
            <Link
              href="/app"
              className="inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-accent-600 to-accent-700 px-12 py-5 text-xl font-bold text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:from-accent-700 hover:to-accent-800"
            >
              <span>ログイン・会員ページへ</span>
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </SlideIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary-800 px-4 py-12 text-center text-primary-300">
        <p className="text-sm">{footerCopyright}</p>
      </footer>
      </motion.main>
    </>
  );
}

// Feature Card Component with Traditional Design
function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="group relative overflow-hidden rounded-2xl border-2 border-primary-200 bg-white p-10 shadow-lg transition-all duration-300 hover:border-accent-300 hover:shadow-2xl"
    >
      {/* Accent Line */}
      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-accent-600 to-gold-600 transition-all duration-300 group-hover:w-2"></div>

      <div className="relative">
        <div className="mb-6 text-6xl">{icon}</div>
        <h3 className="mb-4 font-serif text-2xl font-bold text-primary-800">
          {title}
        </h3>
        <p className="leading-relaxed text-primary-600">{description}</p>
      </div>

      {/* Hover Effect Background */}
      <div className="absolute bottom-0 right-0 h-24 w-24 translate-x-8 translate-y-8 rounded-full bg-gradient-to-tl from-accent-100 to-gold-100 opacity-0 blur-2xl transition-all duration-500 group-hover:opacity-30"></div>
    </motion.div>
  );
}
