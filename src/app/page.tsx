"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import HeroSlideshow from "@/components/ui/HeroSlideshow";
import NewsSection from "@/components/NewsSection";
import FadeIn from "@/components/ui/FadeIn";
import SlideIn from "@/components/ui/SlideIn";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";

const heroSlides = [
  {
    image: "/kosha.jpg",
    title: "戸山高校剣道部OB会",
    subtitle: "伝統を継承し、絆を深める",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Slideshow Section */}
      <HeroSlideshow slides={heroSlides} height="70vh" autoPlayInterval={6000} />

      {/* News Section */}
      <NewsSection />

      {/* Welcome Section with Negative Space */}
      <section className="bg-white px-4 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <FadeIn>
            <h2 className="mb-6 font-serif text-4xl font-bold text-primary-800 md:text-5xl">
              ようこそ
            </h2>
            <p className="mb-8 text-lg leading-relaxed text-primary-600 md:text-xl">
              戸山高校剣道部OB会の公式サイトへようこそ。
              <br />
              このサイトは、OB会員の皆様が交流し、思い出を共有し、
              <br />
              母校剣道部の伝統を次世代へ繋いでいくための場所です。
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
            <StaggerItem>
              <FeatureCard
                icon="💬"
                title="近況投稿"
                description="140文字で気軽に近況を共有。会員同士のコミュニケーションを活性化します。"
              />
            </StaggerItem>

            <StaggerItem>
              <FeatureCard
                icon="📋"
                title="掲示板"
                description="スレッド形式でディスカッション。重要な情報はピン留めで常に上位表示。"
              />
            </StaggerItem>

            <StaggerItem>
              <FeatureCard
                icon="📜"
                title="歴史アーカイブ"
                description="戸山高校剣道部の歴史を振り返る。公開情報と会員限定情報を管理。"
              />
            </StaggerItem>
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
              会員の皆様へ
            </h2>
            <p className="mb-12 text-xl leading-relaxed text-primary-100">
              ログインして、懐かしい仲間との交流をお楽しみください。
              <br />
              戸山剣道部の思い出を共有し、絆を深めましょう。
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
        <p className="text-sm">
          © 2024 戸山高校剣道部OB会. All rights reserved.
        </p>
      </footer>
    </main>
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
