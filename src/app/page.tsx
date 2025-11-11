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
    subtitle: "",
  },
];

const defaultWelcome = {
  title: "戸山高校剣道部OB会",
  body: "会員向けサイトです。",
};

const defaultFeatures: Feature[] = [
  {
    icon: "",
    title: "近況投稿",
    description: "140文字で近況を投稿できます。",
  },
  {
    icon: "",
    title: "掲示板",
    description: "スレッド形式で情報交換ができます。",
  },
  {
    icon: "",
    title: "歴史アーカイブ",
    description: "剣道部の歴史を閲覧できます。",
  },
];

const defaultCTA = {
  title: "会員ログイン",
  body: "",
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
      <HeroSlideshow slides={slides} autoPlayInterval={slideInterval} />

      {/* News Section */}
      <NewsSection />

      {/* Welcome Section */}
      <section className="bg-white px-4 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <FadeIn>
            <h2 className="mb-6 text-3xl font-bold text-gray-900 md:text-4xl">
              {welcomeTitle}
            </h2>
            {welcomeBody && (
              <p className="mb-8 text-base leading-relaxed text-gray-600 md:text-lg">
                {welcomeBody.split("\n").map((line: string, i: number) => (
                  <span key={i}>
                    {line}
                    {i < welcomeBody.split("\n").length - 1 && <br />}
                  </span>
                ))}
              </p>
            )}
          </FadeIn>

          <SlideIn direction="up" delay={0.3}>
            <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/app"
                className="inline-flex items-center justify-center bg-blue-600 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                会員ページへ
              </Link>

              <Link
                href="#about"
                className="inline-flex items-center justify-center border border-gray-300 bg-white px-8 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                詳しく見る
              </Link>
            </div>
          </SlideIn>
        </div>
      </section>

      {/* Features Section */}
      <section id="about" className="bg-gray-50 px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <FadeIn>
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
                会員サービス
              </h2>
            </div>
          </FadeIn>

          <Stagger staggerDelay={0.2} className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

      {/* CTA Section */}
      <section className="bg-gray-900 px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <SlideIn direction="up">
            <h2 className="mb-6 text-2xl font-bold text-white md:text-3xl">
              {ctaTitle}
            </h2>
            {ctaBody && (
              <p className="mb-8 text-base leading-relaxed text-gray-300">
                {ctaBody.split("\n").map((line: string, i: number) => (
                  <span key={i}>
                    {line}
                    {i < ctaBody.split("\n").length - 1 && <br />}
                  </span>
                ))}
              </p>
            )}
            <Link
              href="/app"
              className="inline-flex items-center justify-center bg-blue-600 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              ログイン・会員ページへ
            </Link>
          </SlideIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 px-4 py-8 text-center text-gray-400">
        <p className="text-sm">{footerCopyright}</p>
      </footer>
      </motion.main>
    </>
  );
}

// Feature Card Component
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
    <div className="border border-gray-200 bg-white p-6 transition-colors hover:bg-gray-50">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
