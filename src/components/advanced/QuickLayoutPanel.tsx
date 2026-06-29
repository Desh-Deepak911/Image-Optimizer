"use client";

import {
  QUICK_LAYOUT_OPTIONS,
  type QuickLayoutId,
} from "@/lib/konva/quickLayouts";

interface QuickLayoutPanelProps {
  imageLayerCount: number;
  onApplyLayout: (layoutId: QuickLayoutId) => void;
}

export function QuickLayoutPanel({
  imageLayerCount,
  onApplyLayout,
}: QuickLayoutPanelProps) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white px-4 py-4 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold text-[#1d1d1f]">Quick layouts</h2>
        <p className="mt-0.5 text-xs text-[#86868b]">
          {imageLayerCount >= 2
            ? "Arrange uploaded images in one click"
            : "Upload multiple images to unlock collage layouts"}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {QUICK_LAYOUT_OPTIONS.map((layout) => {
          const disabled = imageLayerCount < layout.minImages;

          return (
            <button
              key={layout.id}
              type="button"
              disabled={disabled}
              onClick={() => onApplyLayout(layout.id)}
              className="rounded-xl border border-black/[0.06] bg-[#f5f5f7] px-3 py-2.5 text-left transition-colors hover:border-[#0071e3]/30 hover:bg-[#0071e3]/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="block text-xs font-semibold text-[#1d1d1f]">
                {layout.label}
              </span>
              <span className="mt-0.5 block text-[10px] leading-snug text-[#86868b]">
                {layout.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
