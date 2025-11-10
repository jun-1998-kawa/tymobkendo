"use client";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: "ホーム", href: "/" },
  { label: "お知らせ", href: "/#news" },
  { label: "会員サービス", href: "/#about" },
  { label: "歴史", href: "/app/history" },
  { label: "会員ページ", href: "/app" },
];

export default function HeroNavigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="absolute top-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent-600 to-gold-600 text-2xl font-bold text-white shadow-xl"
            >
              剣
            </motion.div>
            <div className="hidden md:block">
              <div className="font-serif text-xl font-bold text-white" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                戸山高校剣道部
              </div>
              <div className="text-sm text-white/90" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                OB会
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:bg-white/20 hover:backdrop-blur-sm"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/30 md:hidden"
            aria-label="メニュー"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden bg-primary-900/95 backdrop-blur-md md:hidden"
          >
            <div className="space-y-1 px-4 pb-4 pt-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-lg px-4 py-3 text-base font-medium text-white transition-colors hover:bg-white/10"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
