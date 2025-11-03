"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import FadeIn from "@/components/ui/FadeIn";
import SlideIn from "@/components/ui/SlideIn";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-gold-50">
      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0A0A0A_1px,transparent_1px),linear-gradient(to_bottom,#0A0A0A_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <FadeIn>
            <div className="mb-6 inline-block rounded-full bg-gradient-to-r from-accent-600 to-gold-600 px-6 py-2 text-sm font-medium text-white shadow-lg">
              剣道 × テクノロジー
            </div>
          </FadeIn>

          <SlideIn direction="up" delay={0.2}>
            <h1 className="mb-6 text-5xl font-bold leading-tight text-primary-800 md:text-7xl">
              剣道部OB会
              <br />
              <span className="bg-gradient-to-r from-accent-600 to-gold-600 bg-clip-text text-transparent">
                デジタルホーム
              </span>
            </h1>
          </SlideIn>

          <SlideIn direction="up" delay={0.4}>
            <p className="mx-auto mb-12 max-w-2xl text-lg text-primary-600 md:text-xl">
              伝統を守り、未来へつなぐ。
              <br />
              OB会員の絆を深める、新しいコミュニティプラットフォーム
            </p>
          </SlideIn>

          <SlideIn direction="up" delay={0.6}>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/app"
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-accent-600 to-accent-700 px-8 py-4 text-lg font-semibold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                <span className="relative z-10">会員ページへ</span>
                <div className="absolute inset-0 bg-gradient-to-r from-accent-700 to-accent-800 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              </Link>

              <Link
                href="#about"
                className="inline-flex items-center justify-center rounded-full border-2 border-primary-800 px-8 py-4 text-lg font-semibold text-primary-800 transition-all duration-300 hover:bg-primary-800 hover:text-white"
              >
                もっと詳しく
              </Link>
            </div>
          </SlideIn>

          {/* Scroll Indicator */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="flex flex-col items-center gap-2 text-primary-400">
              <span className="text-sm">Scroll</span>
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
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="about" className="bg-white px-4 py-24">
        <div className="mx-auto max-w-7xl">
          <FadeIn>
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-4xl font-bold text-primary-800 md:text-5xl">
                主な機能
              </h2>
              <p className="text-lg text-primary-600">
                OB会員のための充実した機能をご用意しています
              </p>
            </div>
          </FadeIn>

          <Stagger staggerDelay={0.2} className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <StaggerItem>
              <FeatureCard
                icon="💬"
                title="Tweet機能"
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
                description="高校剣道部の歴史を振り返る。公開情報と会員限定情報を分けて管理。"
              />
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary-800 to-primary-900 px-4 py-24 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <SlideIn direction="up">
            <h2 className="mb-6 text-4xl font-bold md:text-5xl">
              今すぐ参加しませんか？
            </h2>
            <p className="mb-12 text-lg text-primary-200">
              OB会員の方はログインして、コミュニティに参加しましょう
            </p>
            <Link
              href="/app"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-gold-500 to-gold-600 px-10 py-5 text-xl font-bold text-primary-900 shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-3xl"
            >
              会員ページへ →
            </Link>
          </SlideIn>
        </div>
      </section>
    </main>
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
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="group relative overflow-hidden rounded-2xl border border-primary-200 bg-gradient-to-br from-white to-primary-50 p-8 shadow-lg transition-shadow duration-300 hover:shadow-2xl"
    >
      <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-accent-100 to-gold-100 opacity-50 blur-2xl transition-all duration-300 group-hover:scale-150"></div>

      <div className="relative">
        <div className="mb-4 text-5xl">{icon}</div>
        <h3 className="mb-3 text-2xl font-bold text-primary-800">{title}</h3>
        <p className="text-primary-600">{description}</p>
      </div>
    </motion.div>
  );
}
