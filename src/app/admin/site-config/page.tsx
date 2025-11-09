"use client";
import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import { uploadData, getUrl } from "aws-amplify/storage";
import FadeIn from "@/components/ui/FadeIn";

const client = generateClient();
const models = client.models as any;

type SiteConfig = any;
type Feature = {
  icon: string;
  title: string;
  description: string;
};

export default function SiteConfigPage() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Hero section
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroImagePath, setHeroImagePath] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [uploadingHero, setUploadingHero] = useState(false);

  // Welcome section
  const [welcomeTitle, setWelcomeTitle] = useState("");
  const [welcomeBody, setWelcomeBody] = useState("");

  // Features
  const [features, setFeatures] = useState<Feature[]>([
    { icon: "💬", title: "近況投稿", description: "140文字で気軽に近況を共有。会員同士のコミュニケーションを活性化します。" },
    { icon: "📋", title: "掲示板", description: "スレッド形式でディスカッション。重要な情報はピン留めで常に上位表示。" },
    { icon: "📜", title: "歴史アーカイブ", description: "戸山高校剣道部の歴史を振り返る。公開情報と会員限定情報を管理。" },
  ]);

  // CTA section
  const [ctaTitle, setCtaTitle] = useState("");
  const [ctaBody, setCtaBody] = useState("");

  // Footer
  const [footerCopyright, setFooterCopyright] = useState("");

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data: configs } = await models.SiteConfig.list({
        filter: { isActive: { eq: true } },
        limit: 1,
      });

      if (configs && configs.length > 0) {
        const activeConfig = configs[0];
        setConfig(activeConfig);
        setHeroTitle(activeConfig.heroTitle || "");
        setHeroSubtitle(activeConfig.heroSubtitle || "");
        setHeroImagePath(activeConfig.heroImagePath || "");
        setWelcomeTitle(activeConfig.welcomeTitle || "");
        setWelcomeBody(activeConfig.welcomeBody || "");
        setCtaTitle(activeConfig.ctaTitle || "");
        setCtaBody(activeConfig.ctaBody || "");
        setFooterCopyright(activeConfig.footerCopyright || "");

        // Parse features
        if (activeConfig.featuresJson) {
          try {
            setFeatures(JSON.parse(activeConfig.featuresJson));
          } catch (e) {
            console.error("Failed to parse features:", e);
          }
        }

        // Load hero image URL
        if (activeConfig.heroImagePath) {
          try {
            const url = await getUrl({
              path: `public/${activeConfig.heroImagePath}`,
            });
            setHeroImageUrl(url.url.toString());
          } catch (e) {
            console.error("Failed to load hero image:", e);
          }
        }
      }
    } catch (error) {
      console.error("Error loading config:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingHero(true);
    try {
      const timestamp = Date.now();
      const fileName = `site-config/hero-${timestamp}-${file.name}`;

      await uploadData({
        path: `public/${fileName}`,
        data: file,
        options: {
          contentType: file.type,
        },
      }).result;

      setHeroImagePath(fileName);

      // Get URL for preview
      const url = await getUrl({
        path: `public/${fileName}`,
      });
      setHeroImageUrl(url.url.toString());
    } catch (error) {
      console.error("Error uploading hero image:", error);
      alert("画像のアップロードに失敗しました");
    } finally {
      setUploadingHero(false);
    }
  };

  const handleFeatureChange = (index: number, field: keyof Feature, value: string) => {
    const newFeatures = [...features];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setFeatures(newFeatures);
  };

  const addFeature = () => {
    setFeatures([...features, { icon: "✨", title: "", description: "" }]);
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const featuresJson = JSON.stringify(features);

      if (config) {
        // Update existing
        await models.SiteConfig.update({
          id: config.id,
          heroTitle,
          heroSubtitle,
          heroImagePath: heroImagePath || null,
          welcomeTitle,
          welcomeBody,
          featuresJson,
          ctaTitle,
          ctaBody,
          footerCopyright,
        });
      } else {
        // Create new
        await models.SiteConfig.create({
          heroTitle,
          heroSubtitle,
          heroImagePath: heroImagePath || null,
          welcomeTitle,
          welcomeBody,
          featuresJson,
          ctaTitle,
          ctaBody,
          footerCopyright,
          isActive: true,
        });
      }

      alert("保存しました！");
      await loadConfig();
    } catch (error) {
      console.error("Error saving config:", error);
      alert("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <FadeIn>
        <div className="mb-8">
          <h1 className="mb-2 font-serif text-3xl font-bold text-primary-800 md:text-4xl">
            ⚙️ サイト設定
          </h1>
          <p className="text-lg text-primary-600">
            トップページの内容を編集（デプロイ不要）
          </p>
        </div>
      </FadeIn>

      <FadeIn delay={0.2}>
        <form onSubmit={handleSubmit} className="space-y-8 rounded-2xl border border-primary-200 bg-white p-8 shadow-lg">
          {/* Hero Section */}
          <section className="space-y-4 border-b border-primary-200 pb-8">
            <h2 className="font-serif text-2xl font-bold text-primary-800">
              ヒーローセクション
            </h2>

            <div>
              <label className="mb-2 block text-sm font-semibold text-primary-800">
                タイトル <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={heroTitle}
                onChange={(e) => setHeroTitle(e.target.value)}
                required
                className="w-full rounded-lg border-2 border-primary-200 bg-primary-50 px-4 py-3 transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                placeholder="戸山高校剣道部OB会"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-primary-800">
                サブタイトル <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                required
                className="w-full rounded-lg border-2 border-primary-200 bg-primary-50 px-4 py-3 transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                placeholder="伝統を継承し、絆を深める"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-primary-800">
                ヒーロー画像
              </label>
              {heroImageUrl && (
                <div className="mb-4 overflow-hidden rounded-lg">
                  <img
                    src={heroImageUrl}
                    alt="Hero"
                    className="h-48 w-full object-cover"
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleHeroImageUpload}
                disabled={uploadingHero}
                className="w-full cursor-pointer file:mr-4 file:rounded-lg file:border-0 file:bg-amber-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white file:transition-all hover:file:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {uploadingHero && (
                <p className="mt-2 text-sm text-amber-600">アップロード中...</p>
              )}
            </div>
          </section>

          {/* Welcome Section */}
          <section className="space-y-4 border-b border-primary-200 pb-8">
            <h2 className="font-serif text-2xl font-bold text-primary-800">
              ウェルカムセクション
            </h2>

            <div>
              <label className="mb-2 block text-sm font-semibold text-primary-800">
                タイトル <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={welcomeTitle}
                onChange={(e) => setWelcomeTitle(e.target.value)}
                required
                className="w-full rounded-lg border-2 border-primary-200 bg-primary-50 px-4 py-3 transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                placeholder="ようこそ"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-primary-800">
                本文 <span className="text-red-600">*</span>
              </label>
              <textarea
                value={welcomeBody}
                onChange={(e) => setWelcomeBody(e.target.value)}
                required
                rows={4}
                className="w-full resize-none rounded-lg border-2 border-primary-200 bg-primary-50 px-4 py-3 transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                placeholder="戸山高校剣道部OB会の公式サイトへようこそ。&#10;改行は\nで表示されます。"
              />
              <p className="mt-1 text-xs text-primary-500">
                ※ 改行（Enter）で入力すると、表示時にも改行されます
              </p>
            </div>
          </section>

          {/* Features Section */}
          <section className="space-y-4 border-b border-primary-200 pb-8">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl font-bold text-primary-800">
                会員サービス（機能カード）
              </h2>
              <button
                type="button"
                onClick={addFeature}
                className="rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 px-4 py-2 text-sm font-semibold text-white transition-all hover:scale-105"
              >
                + 追加
              </button>
            </div>

            <div className="space-y-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="space-y-3 rounded-lg border-2 border-primary-200 bg-primary-50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-primary-700">
                      カード {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="rounded-lg bg-red-100 px-3 py-1 text-sm font-medium text-red-700 transition-colors hover:bg-red-200"
                    >
                      削除
                    </button>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-primary-700">
                        アイコン
                      </label>
                      <input
                        type="text"
                        value={feature.icon}
                        onChange={(e) => handleFeatureChange(index, "icon", e.target.value)}
                        className="w-full rounded-lg border border-primary-300 bg-white px-3 py-2 text-center text-2xl transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                        placeholder="💬"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-semibold text-primary-700">
                        タイトル
                      </label>
                      <input
                        type="text"
                        value={feature.title}
                        onChange={(e) => handleFeatureChange(index, "title", e.target.value)}
                        className="w-full rounded-lg border border-primary-300 bg-white px-3 py-2 transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                        placeholder="近況投稿"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-primary-700">
                      説明
                    </label>
                    <textarea
                      value={feature.description}
                      onChange={(e) => handleFeatureChange(index, "description", e.target.value)}
                      rows={2}
                      className="w-full resize-none rounded-lg border border-primary-300 bg-white px-3 py-2 transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                      placeholder="140文字で気軽に近況を共有..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="space-y-4 border-b border-primary-200 pb-8">
            <h2 className="font-serif text-2xl font-bold text-primary-800">
              CTAセクション（会員向け訴求）
            </h2>

            <div>
              <label className="mb-2 block text-sm font-semibold text-primary-800">
                タイトル <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={ctaTitle}
                onChange={(e) => setCtaTitle(e.target.value)}
                required
                className="w-full rounded-lg border-2 border-primary-200 bg-primary-50 px-4 py-3 transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                placeholder="会員の皆様へ"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-primary-800">
                本文 <span className="text-red-600">*</span>
              </label>
              <textarea
                value={ctaBody}
                onChange={(e) => setCtaBody(e.target.value)}
                required
                rows={3}
                className="w-full resize-none rounded-lg border-2 border-primary-200 bg-primary-50 px-4 py-3 transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                placeholder="ログインして、懐かしい仲間との交流をお楽しみください。"
              />
            </div>
          </section>

          {/* Footer Section */}
          <section className="space-y-4 pb-4">
            <h2 className="font-serif text-2xl font-bold text-primary-800">
              フッター
            </h2>

            <div>
              <label className="mb-2 block text-sm font-semibold text-primary-800">
                コピーライト <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={footerCopyright}
                onChange={(e) => setFooterCopyright(e.target.value)}
                required
                className="w-full rounded-lg border-2 border-primary-200 bg-primary-50 px-4 py-3 transition-all focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                placeholder="© 2024 戸山高校剣道部OB会. All rights reserved."
              />
            </div>
          </section>

          {/* Submit Button */}
          <div className="flex gap-4 border-t border-primary-200 pt-8">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-4 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "保存中..." : config ? "設定を更新" : "設定を作成"}
            </button>
          </div>
        </form>
      </FadeIn>
    </div>
  );
}
