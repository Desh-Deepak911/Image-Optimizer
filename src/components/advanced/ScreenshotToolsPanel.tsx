"use client";

import { SCREENSHOT_BACKGROUND_PRESETS } from "@/lib/konva/screenshotBackgrounds";
import {
  SCREENSHOT_MOCKUP_OPTIONS,
  type ScreenshotMockupId,
} from "@/lib/konva/screenshotMockups";
import type { QuickLayoutId } from "@/lib/konva/quickLayouts";

interface ScreenshotToolsPanelProps {
  imageLayerCount: number;
  selectedImageLayerId: string | null;
  onApplyMockup: (mockupId: ScreenshotMockupId, layerId?: string) => void;
  onApplyAutoPadding: (layerId?: string) => void;
  onApplyBackground: (presetId: string) => void;
  onApplyLayout: (layoutId: QuickLayoutId) => void;
}

export function ScreenshotToolsPanel({
  imageLayerCount,
  selectedImageLayerId,
  onApplyMockup,
  onApplyAutoPadding,
  onApplyBackground,
  onApplyLayout,
}: ScreenshotToolsPanelProps) {
  const hasImages = imageLayerCount > 0;
  const targetLayerId = selectedImageLayerId ?? undefined;

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white px-4 py-4 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold text-[#1d1d1f]">Screenshot tools</h2>
        <p className="mt-0.5 text-xs text-[#86868b]">
          Device frames, padding, backgrounds, and comparisons
        </p>
      </div>

      <div className="mt-4 space-y-5">
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[#86868b]">
            Device frames
          </h3>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">
            {SCREENSHOT_MOCKUP_OPTIONS.map((mockup) => (
              <button
                key={mockup.id}
                type="button"
                disabled={!hasImages}
                onClick={() => onApplyMockup(mockup.id, targetLayerId)}
                className="rounded-xl border border-black/[0.06] bg-[#f5f5f7] px-3 py-2.5 text-left transition-colors hover:border-[#0071e3]/30 hover:bg-[#0071e3]/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="block text-xs font-semibold text-[#1d1d1f]">
                  {mockup.label}
                </span>
                <span className="mt-0.5 block text-[10px] leading-snug text-[#86868b]">
                  {mockup.description}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[#86868b]">
            Screenshot polish
          </h3>
          <button
            type="button"
            disabled={!hasImages}
            onClick={() => onApplyAutoPadding(targetLayerId)}
            className="mt-2 w-full rounded-xl border border-black/[0.06] bg-[#f5f5f7] px-3 py-2.5 text-left transition-colors hover:border-[#0071e3]/30 hover:bg-[#0071e3]/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span className="block text-xs font-semibold text-[#1d1d1f]">
              Auto-padding
            </span>
            <span className="mt-0.5 block text-[10px] leading-snug text-[#86868b]">
              Add generous padding, rounded corners, and shadow
            </span>
          </button>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[#86868b]">
            Clean backgrounds
          </h3>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {SCREENSHOT_BACKGROUND_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onApplyBackground(preset.id)}
                className="rounded-lg border border-black/[0.06] bg-[#f5f5f7] px-2 py-2 text-xs font-medium text-[#1d1d1f] transition-colors hover:border-[#0071e3]/30 hover:bg-[#0071e3]/[0.06]"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[#86868b]">
            Comparison layouts
          </h3>
          <div className="mt-2 grid grid-cols-1 gap-2">
            <button
              type="button"
              disabled={imageLayerCount < 2}
              onClick={() => onApplyLayout("before-after-collage")}
              className="rounded-xl border border-black/[0.06] bg-[#f5f5f7] px-3 py-2.5 text-left transition-colors hover:border-[#0071e3]/30 hover:bg-[#0071e3]/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="block text-xs font-semibold text-[#1d1d1f]">
                Before / after collage
              </span>
              <span className="mt-0.5 block text-[10px] leading-snug text-[#86868b]">
                Split layout with divider and Before / After labels
              </span>
            </button>
            <button
              type="button"
              disabled={imageLayerCount < 2}
              onClick={() => onApplyLayout("comparison-split")}
              className="rounded-xl border border-black/[0.06] bg-[#f5f5f7] px-3 py-2.5 text-left transition-colors hover:border-[#0071e3]/30 hover:bg-[#0071e3]/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="block text-xs font-semibold text-[#1d1d1f]">
                Comparison split
              </span>
              <span className="mt-0.5 block text-[10px] leading-snug text-[#86868b]">
                Left and right images with center divider and labels
              </span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
