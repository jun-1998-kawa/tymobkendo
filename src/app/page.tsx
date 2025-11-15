"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getUrl } from "aws-amplify/storage";
import HeroSlideshow from "@/components/ui/HeroSlideshow";
import NewsSection from "@/components/NewsSection";
import FadeIn from "@/components/ui/FadeIn";
import SlideIn from "@/components/ui/SlideIn";
import ShinaiSlash from "@/components/ShinaiSlash";
import outputs from "../../amplify_outputs.json";

type SiteConfig = any;

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

const defaultFooter = {
  copyright: "© 2024 戸山高校剣道部OB会. All rights reserved.",
};

export default function Home() {
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [heroImageUrls, setHeroImageUrls] = useState<string[]>([]);
  const [heroSlides, setHeroSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [splashComplete, setSplashComplete] = useState(false);
  const [amplifyReady, setAmplifyReady] = useState(false);

  useEffect(() => {
    const loadSiteConfig = async () => {
      try {
        // Amplifyの設定を確実に行う
        Amplify.configure(outputs, { ssr: true });
        setAmplifyReady(true);

        // クライアントを生成（設定後に）
        const client = generateClient({
          authMode: 'apiKey'
        });
        const models = client.models as any;

        const { data: configs } = await models.SiteConfig.list({
          filter: { isActive: { eq: true } },
          limit: 1,
        });

        if (configs && configs.length > 0) {
          const config = configs[0];
          setSiteConfig(config);

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
                      const url = await getUrl({
                        path: `public/${slide.mediaPath}`,
                        options: {
                          validateObjectExistence: false, // ゲストアクセスでも動作
                          expiresIn: 3600 // 1時間
                        }
                      });
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
                  const url = await getUrl({
                    path: `public/${path}`,
                    options: {
                      validateObjectExistence: false,
                      expiresIn: 3600
                    }
                  });
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
                  options: {
                    validateObjectExistence: false,
                    expiresIn: 3600
                  }
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

  // Amplify設定、ローディング、スプラッシュの全てが完了したらコンテンツを表示
  useEffect(() => {
    if (amplifyReady && !loading && splashComplete) {
      setShowContent(true);
    }
  }, [amplifyReady, loading, splashComplete]);

  // Amplify設定完了、ローディング、スプラッシュのいずれかが未完了の場合はShinaiSlashを表示
  if (!amplifyReady || loading || !splashComplete) {
    return (
      <ShinaiSlash onComplete={() => setSplashComplete(true)} />
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
  const footerCopyright = siteConfig?.footerCopyright || defaultFooter.copyright;

  return (
    <>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="min-h-screen"
      >
      {/* Hero Slideshow Section */}
      <HeroSlideshow slides={slides} autoPlayInterval={slideInterval} />

      {/* News Section */}
      <div id="news">
        <NewsSection />
      </div>

      {/* Welcome Section with Login Button */}
      <section id="login" className="bg-white px-4 py-24">
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
            <div className="mt-12">
              <Link
                href="/app"
                className="inline-flex items-center justify-center bg-blue-600 px-12 py-4 text-lg font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg"
              >
                会員ログイン
              </Link>
            </div>
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
