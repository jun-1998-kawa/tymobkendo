"use client";
import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import { uploadData, getUrl } from "aws-amplify/storage";
import { motion, AnimatePresence } from "framer-motion";
import FadeIn from "@/components/ui/FadeIn";

const client = generateClient();
const models = client.models as any;

type HeroSlide = any;

export default function HeroSlidesManagementPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    const sub = models.HeroSlide.observeQuery({}).subscribe({
      next: ({ items }: any) => {
        const sorted = [...items].sort((a, b) => a.order - b.order);
        setSlides(sorted);
        setLoading(false);
      },
    });
    return () => sub.unsubscribe();
  }, []);

  const handleToggleActive = async (slide: HeroSlide) => {
    try {
      await models.HeroSlide.update({
        id: slide.id,
        isActive: !slide.isActive,
      });
    } catch (error) {
      console.error("Error toggling active status:", error);
      alert("表示状態の変更に失敗しました");
    }
  };

  const handleToggleKenBurns = async (slide: HeroSlide) => {
    try {
      await models.HeroSlide.update({
        id: slide.id,
        kenBurnsEffect: !slide.kenBurnsEffect,
      });
    } catch (error) {
      console.error("Error toggling Ken Burns effect:", error);
      alert("Ken Burnsエフェクトの変更に失敗しました");
    }
  };

  const handleDelete = async (slide: HeroSlide) => {
    if (!confirm(`スライド「${slide.title || "無題"}」を削除してもよろしいですか？\n\nこの操作は取り消せません。`)) {
      return;
    }

    try {
      await models.HeroSlide.delete({ id: slide.id });
    } catch (error) {
      console.error("Error deleting slide:", error);
      alert("削除に失敗しました");
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSlides = [...slides];
    const draggedSlide = newSlides[draggedIndex];
    newSlides.splice(draggedIndex, 1);
    newSlides.splice(index, 0, draggedSlide);

    setSlides(newSlides);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;

    // Update order for all slides
    try {
      const updatePromises = slides.map((slide, index) =>
        models.HeroSlide.update({
          id: slide.id,
          order: index,
        })
      );
      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Error updating slide order:", error);
      alert("順序の更新に失敗しました");
    }

    setDraggedIndex(null);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="mb-2 font-serif text-3xl font-bold text-primary-800 md:text-4xl">
              🎬 ヒーロースライド管理
            </h1>
            <p className="text-lg text-primary-600">
              トップページのスライドショー（画像・動画）を管理
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>新規作成</span>
          </button>
        </div>
      </FadeIn>

      {/* Info Box */}
      <FadeIn delay={0.1}>
        <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <p className="font-semibold text-blue-900">ドラッグ&amp;ドロップで順序変更</p>
              <p className="text-sm text-blue-800">スライドをドラッグして並べ替えることができます</p>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* Slides List */}
      <FadeIn delay={0.2}>
        <div className="overflow-hidden rounded-2xl border border-primary-200 bg-white shadow-lg">
          {loading ? (
            <div className="p-12 text-center">
              <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
              <p className="text-lg text-primary-600">読み込み中...</p>
            </div>
          ) : slides.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mb-4 text-6xl">🎬</div>
              <p className="mb-2 text-lg font-medium text-primary-800">
                スライドがありません
              </p>
              <p className="text-primary-600">
                「新規作成」ボタンから最初のスライドを追加しましょう
              </p>
            </div>
          ) : (
            <div className="divide-y divide-primary-100">
              {slides.map((slide, index) => (
                <SlideRow
                  key={slide.id}
                  slide={slide}
                  index={index}
                  onToggleActive={() => handleToggleActive(slide)}
                  onToggleKenBurns={() => handleToggleKenBurns(slide)}
                  onEdit={() => setEditingSlide(slide)}
                  onDelete={() => handleDelete(slide)}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  isDragging={draggedIndex === index}
                />
              ))}
            </div>
          )}
        </div>
      </FadeIn>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || editingSlide) && (
          <SlideModal
            slide={editingSlide}
            nextOrder={slides.length}
            onClose={() => {
              setShowCreateModal(false);
              setEditingSlide(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SlideRow({
  slide,
  index,
  onToggleActive,
  onToggleKenBurns,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
}: {
  slide: HeroSlide;
  index: number;
  onToggleActive: () => void;
  onToggleKenBurns: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}) {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadMedia = async () => {
      try {
        const url = await getUrl({ path: `public/${slide.mediaPath}` });
        setMediaUrl(url.url.toString());
      } catch (error) {
        console.error("Error loading media:", error);
      }
    };
    if (slide.mediaPath) {
      loadMedia();
    }
  }, [slide.mediaPath]);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-4 p-4 transition-all ${
        isDragging ? "bg-purple-50 opacity-50" : "hover:bg-primary-50"
      } cursor-move`}
    >
      {/* Drag Handle */}
      <div className="flex flex-col items-center gap-1">
        <svg
          className="h-6 w-6 text-primary-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8h16M4 16h16"
          />
        </svg>
        <span className="text-sm font-semibold text-primary-600">#{index + 1}</span>
      </div>

      {/* Media Preview */}
      <div className="h-24 w-40 flex-shrink-0 overflow-hidden rounded-lg border-2 border-primary-200">
        {mediaUrl ? (
          slide.mediaType === "video" ? (
            <video
              src={mediaUrl}
              className="h-full w-full object-cover"
              muted
            />
          ) : (
            <img
              src={mediaUrl}
              alt={slide.title || "Slide"}
              className="h-full w-full object-cover"
            />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary-100">
            <span className="text-3xl">
              {slide.mediaType === "video" ? "🎥" : "🖼️"}
            </span>
          </div>
        )}
      </div>

      {/* Slide Info */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
              slide.mediaType === "video"
                ? "bg-purple-100 text-purple-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {slide.mediaType === "video" ? "🎥 動画" : "🖼️ 画像"}
          </span>
          {slide.kenBurnsEffect && (
            <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
              ✨ Ken Burns
            </span>
          )}
        </div>
        <p className="font-medium text-primary-800">
          {slide.title || "（タイトルなし）"}
        </p>
        {slide.subtitle && (
          <p className="text-sm text-primary-500 line-clamp-1">{slide.subtitle}</p>
        )}
      </div>

      {/* Status */}
      <div className="flex-shrink-0">
        {slide.isActive ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
            <span className="h-2 w-2 rounded-full bg-green-600"></span>
            表示中
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800">
            <span className="h-2 w-2 rounded-full bg-gray-600"></span>
            非表示
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-shrink-0 gap-2">
        <button
          onClick={onToggleActive}
          className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
            slide.isActive
              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
              : "bg-green-100 text-green-700 hover:bg-green-200"
          }`}
        >
          {slide.isActive ? "非表示" : "表示"}
        </button>
        {slide.mediaType === "image" && (
          <button
            onClick={onToggleKenBurns}
            className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
              slide.kenBurnsEffect
                ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            title="Ken Burnsエフェクト"
          >
            ✨
          </button>
        )}
        <button
          onClick={onEdit}
          className="rounded-lg bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-200"
        >
          編集
        </button>
        <button
          onClick={onDelete}
          className="rounded-lg bg-red-100 px-3 py-1 text-sm font-medium text-red-700 transition-colors hover:bg-red-200"
        >
          削除
        </button>
      </div>
    </div>
  );
}

function SlideModal({
  slide,
  nextOrder,
  onClose,
}: {
  slide: HeroSlide | null;
  nextOrder: number;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(slide?.title || "");
  const [subtitle, setSubtitle] = useState(slide?.subtitle || "");
  const [mediaType, setMediaType] = useState<"image" | "video">(
    slide?.mediaType || "image"
  );
  const [mediaPath, setMediaPath] = useState(slide?.mediaPath || "");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [kenBurnsEffect, setKenBurnsEffect] = useState(
    slide?.kenBurnsEffect || false
  );
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadMedia = async () => {
      if (slide?.mediaPath) {
        try {
          const url = await getUrl({ path: `public/${slide.mediaPath}` });
          setMediaUrl(url.url.toString());
        } catch (error) {
          console.error("Error loading media:", error);
        }
      }
    };
    loadMedia();
  }, [slide]);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const timestamp = Date.now();
      const fileName = `hero-slides/${timestamp}-${file.name}`;

      await uploadData({
        path: `public/${fileName}`,
        data: file,
        options: {
          contentType: file.type,
        },
      }).result;

      setMediaPath(fileName);

      // Generate preview URL
      const url = await getUrl({ path: `public/${fileName}` });
      setMediaUrl(url.url.toString());

      // Auto-detect media type
      if (file.type.startsWith("video/")) {
        setMediaType("video");
      } else {
        setMediaType("image");
      }
    } catch (error) {
      console.error("Error uploading media:", error);
      alert("メディアのアップロードに失敗しました");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mediaPath) {
      alert("画像または動画をアップロードしてください");
      return;
    }

    setLoading(true);

    try {
      if (slide) {
        // Update
        await models.HeroSlide.update({
          id: slide.id,
          title: title || null,
          subtitle: subtitle || null,
          mediaPath,
          mediaType,
          kenBurnsEffect: mediaType === "image" ? kenBurnsEffect : false,
        });
      } else {
        // Create
        await models.HeroSlide.create({
          order: nextOrder,
          title: title || null,
          subtitle: subtitle || null,
          mediaPath,
          mediaType,
          isActive: true,
          kenBurnsEffect: mediaType === "image" ? kenBurnsEffect : false,
        });
      }
      onClose();
    } catch (error) {
      console.error("Error saving slide:", error);
      alert("保存に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-6 font-serif text-2xl font-bold text-primary-800">
          {slide ? "スライドを編集" : "新規スライド作成"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-primary-800">
              タイトル
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border-2 border-primary-200 bg-primary-50 px-4 py-3 transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              placeholder="スライドのタイトルを入力..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-primary-800">
              サブタイトル
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full rounded-lg border-2 border-primary-200 bg-primary-50 px-4 py-3 transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
              placeholder="サブタイトルを入力..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-primary-800">
              画像または動画 <span className="text-red-600">*</span>
            </label>
            <div className="rounded-lg border-2 border-dashed border-primary-300 bg-primary-50 p-6 transition-all hover:border-purple-400 hover:bg-purple-50">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleMediaUpload}
                disabled={uploading}
                className="w-full cursor-pointer file:mr-4 file:rounded-lg file:border-0 file:bg-purple-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white file:transition-all hover:file:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
              />
              {uploading && (
                <p className="mt-2 text-sm text-purple-600">
                  アップロード中...
                </p>
              )}
            </div>

            {mediaUrl && (
              <div className="mt-4 rounded-lg border-2 border-primary-200 overflow-hidden">
                {mediaType === "video" ? (
                  <video
                    src={mediaUrl}
                    controls
                    className="w-full"
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt="Preview"
                    className="w-full"
                  />
                )}
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-primary-800">
              メディアタイプ
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="image"
                  checked={mediaType === "image"}
                  onChange={(e) => setMediaType(e.target.value as "image")}
                  className="h-4 w-4 text-purple-600"
                />
                <span className="text-sm font-medium text-primary-800">🖼️ 画像</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="video"
                  checked={mediaType === "video"}
                  onChange={(e) => setMediaType(e.target.value as "video")}
                  className="h-4 w-4 text-purple-600"
                />
                <span className="text-sm font-medium text-primary-800">🎥 動画</span>
              </label>
            </div>
          </div>

          {mediaType === "image" && (
            <div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={kenBurnsEffect}
                  onChange={(e) => setKenBurnsEffect(e.target.checked)}
                  className="h-5 w-5 rounded border-primary-300 text-purple-600 focus:ring-2 focus:ring-purple-500"
                />
                <div>
                  <span className="text-sm font-semibold text-primary-800">
                    ✨ Ken Burnsエフェクトを有効化
                  </span>
                  <p className="text-xs text-primary-600">
                    画像にゆっくりとしたズームインアニメーションを適用します
                  </p>
                </div>
              </label>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || !mediaPath}
              className="flex-1 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-3 font-semibold text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "保存中..." : slide ? "更新" : "作成"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border-2 border-primary-300 bg-white px-6 py-3 font-semibold text-primary-800 transition-all hover:bg-primary-100"
            >
              キャンセル
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
