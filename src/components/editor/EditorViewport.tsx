"use client";

import { useCallback, useRef, useState } from "react";
import { EditorCanvas, type EditorCanvasHandle } from "@/components/editor/EditorCanvas";
import { CropOverlay } from "@/components/editor/CropOverlay";
import {
  EditorToolbar,
  getEditorToolbarLabels,
} from "@/components/editor/EditorToolbar";
import { getFramingContext } from "@/lib/render/framingContext";
import { formatFileType } from "@/lib/formatters";
import type { SourceTransform } from "@/types/editor";
import type { OptimizerSettings, UploadedImage } from "@/types/optimizer";

interface EditorViewportProps {
  image: UploadedImage;
  settings: OptimizerSettings;
  transform: SourceTransform;
  isExporting: boolean;
  onPanDelta: (delta: { dx: number; dy: number }) => void;
  onResetFraming: () => void;
}

export function EditorViewport({
  image,
  settings,
  transform,
  isExporting,
  onPanDelta,
  onResetFraming,
}: EditorViewportProps) {
  const canvasHandleRef = useRef<EditorCanvasHandle>(null);
  const [displayScale, setDisplayScale] = useState(1);
  const framing = getFramingContext(image, settings);
  const { aspectRatioLabel, fitModeLabel } = getEditorToolbarLabels(
    settings.aspectRatio,
    settings.fitMode,
  );

  const handleDisplayScaleChange = useCallback((scale: number) => {
    setDisplayScale(scale);
  }, []);

  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm">
      <EditorToolbar
        fileName={image.name}
        fileTypeLabel={formatFileType(image.mimeType, image.name)}
        aspectRatioLabel={aspectRatioLabel}
        fitModeLabel={fitModeLabel}
        onResetFraming={onResetFraming}
      />

      <div className="relative bg-[#f5f5f7] p-3 sm:p-4">
        <div className="relative mx-auto w-full max-w-full">
          <EditorCanvas
            ref={canvasHandleRef}
            image={image}
            settings={settings}
            transform={transform}
            onDisplayScaleChange={handleDisplayScaleChange}
          />

          <CropOverlay
            transform={transform}
            frame={framing.frame}
            fitMode={settings.fitMode}
            displayScale={displayScale}
            onPanDelta={onPanDelta}
          />
        </div>

        {isExporting ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg bg-white/75 backdrop-blur-sm">
            <svg
              className="h-8 w-8 animate-spin text-[#0071e3]"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <p className="text-sm font-medium text-[#1d1d1f]">
              Processing your image…
            </p>
          </div>
        ) : null}
      </div>

      <p className="border-t border-black/[0.04] px-4 py-3 text-center text-xs text-[#86868b] sm:px-5">
        Drag the image to reposition · Canvas preview matches export
      </p>
    </div>
  );
}
