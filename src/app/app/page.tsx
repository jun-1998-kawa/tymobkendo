"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import FadeIn from "@/components/ui/FadeIn";
import { Stagger, StaggerItem } from "@/components/ui/Stagger";

export default function AppDashboard() {
  const quickLinks = [
    {
      href: "/app/tweet",
      title: "近況投稿",
      description: "140文字で投稿",
    },
    {
      href: "/app/board",
      title: "掲示板",
      description: "スレッド形式で投稿",
    },
    {
      href: "/app/history",
      title: "歴史アーカイブ",
      description: "剣道部の歴史を閲覧",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-12">
      {/* Welcome Section */}
      <FadeIn>
        <div className="border-b border-gray-200 bg-white px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            会員ダッシュボード
          </h1>
        </div>
      </FadeIn>

      {/* Quick Links */}
      <div className="px-4">
        <FadeIn delay={0.2}>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            機能
          </h2>
        </FadeIn>

        <Stagger staggerDelay={0.15} className="grid gap-4 md:grid-cols-3">
          {quickLinks.map((link, index) => (
            <StaggerItem key={link.href}>
              <QuickLinkCard {...link} delay={index * 0.1} />
            </StaggerItem>
          ))}
        </Stagger>
      </div>

    </div>
  );
}

function QuickLinkCard({
  href,
  title,
  description,
  delay = 0,
}: {
  href: string;
  title: string;
  description: string;
  delay?: number;
}) {
  return (
    <Link href={href}>
      <div className="border border-gray-200 bg-white p-6 transition-colors hover:bg-gray-50">
        <h3 className="mb-2 text-base font-semibold text-gray-900">
          {title}
        </h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </Link>
  );
}
