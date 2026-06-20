"use client";

import type { CSSProperties } from "react";
import {
  getAspectRatioLabel,
  getCssAspectRatio,
  getFitModeLabel,
} from "@/lib/aspectRatio";
import { formatFileType } from "@/lib/formatters";
import type { AspectRatio, FitMode, UploadedImage } from "@/types/optimizer";

interface ImagePreviewProps {
  image: UploadedImage;
  aspectRatio: AspectRatio;
  fitMode: FitMode;
  isExporting: boolean;
}

interface PreviewCanvasProps {
  image: UploadedImage;
  aspectRatio: AspectRatio;
  fitMode: FitMode;
}

function PreviewCanvas({ image, aspectRatio, fitMode }: PreviewCanvasProps) {
  const cssAspectRatio = getCssAspectRatio(aspectRatio, image);
  const isOriginal = aspectRatio === "original";

  const frameStyle: CSSProperties = isOriginal
    ? { width: "100%", minHeight: "240px" }
    : {
        aspectRatio: cssAspectRatio,
        width: "100%",
        maxHeight: "min(520px, 65vh)",
        marginInline: "auto",
      };

  return (
    <div className="flex justify-center p-3 sm:p-4">
      <div
        className={`relative overflow-hidden rounded-lg ${
          isOriginal ? "w-full" : "w-full max-w-full"
        }`}
        style={frameStyle}
      >
        {fitMode === "blur-background" ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.previewUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl saturate-150"
            />
            <div className="absolute inset-0 bg-white/20" aria-hidden="true" />
          </>
        ) : null}

        {fitMode === "contain-padding" ? (
          <div className="absolute inset-0 bg-[#e8e8ed]" aria-hidden="true" />
        ) : null}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.previewUrl}
          alt={`Preview of ${image.name}`}
          className={`relative z-10 h-full w-full ${
            fitMode === "cover" ? "object-cover" : "object-contain"
          } ${isOriginal ? "max-h-[480px]" : ""}`}
        />
      </div>
    </div>
  );
}

export function ImagePreview({
  image,
  aspectRatio,
  fitMode,
  isExporting,
}: ImagePreviewProps) {
  const fileType = formatFileType(image.mimeType, image.name);
  const ratioLabel = getAspectRatioLabel(aspectRatio);
  const fitLabel = getFitModeLabel(fitMode);

  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-black/[0.04] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#1d1d1f]">
            {image.name}
          </p>
          <p className="mt-0.5 text-xs text-[#86868b]">
            {fileType} · {ratioLabel} · {fitLabel}
          </p>
        </div>
      </div>

      <div className="relative bg-[#f5f5f7]">
        <PreviewCanvas
          image={image}
          aspectRatio={aspectRatio}
          fitMode={fitMode}
        />

        {isExporting ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/75 backdrop-blur-sm">
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
    </div>
  );
}
