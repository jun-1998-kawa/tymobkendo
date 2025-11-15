"use client";
import { motion } from "framer-motion";

interface NavItem {
  label: string;
  targetId: string;
}

const navItems: NavItem[] = [
  { label: "お知らせ", targetId: "news" },
  { label: "会員ログイン", targetId: "login" },
];

export default function HeroNavigation() {
  const scrollToSection = (targetId: string) => {
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav className="absolute top-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-center gap-4">
          {navItems.map((item) => (
            <motion.button
              key={item.targetId}
              onClick={() => scrollToSection(item.targetId)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 text-sm font-medium text-white transition-all duration-300 hover:bg-white/20 hover:backdrop-blur-sm"
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
            >
              {item.label}
            </motion.button>
          ))}
        </div>
      </div>
    </nav>
  );
}
