"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildFrameRenderInput, drawFrame } from "@/lib/render/drawFrame";
import { computeDefaultTransformFromSettings } from "@/lib/render/computeTransform";
import { getFramingContext } from "@/lib/render/framingContext";
import type { FrameDimensions } from "@/lib/render/types";
import { resolveOutputWidth } from "@/lib/outputSize";
import type { BatchSettings } from "@/types/batch";
import type { UploadedImage } from "@/types/optimizer";

interface BatchPreviewProps {
  image: UploadedImage;
  settings: BatchSettings;
}

export function BatchPreview({ image, settings }: BatchPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);
  const [frame, setFrame] = useState<FrameDimensions | null>(null);

  const updateDisplayScale = useCallback(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas || !frame) {
      return;
    }

    const scale = wrapper.clientWidth / frame.width;
    canvas.style.width = "100%";
    canvas.style.height = `${frame.height * scale}px`;
  }, [frame]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || !frame) {
      return;
    }

    updateDisplayScale();
    const observer = new ResizeObserver(updateDisplayScale);
    observer.observe(wrapper);

    return () => {
      observer.disconnect();
    };
  }, [frame, updateDisplayScale]);

  useEffect(() => {
    let cancelled = false;

    const render = (loadedImage: HTMLImageElement) => {
      if (cancelled) {
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d", {
        alpha: settings.exportFormat !== "jpeg",
      });

      if (!canvas || !ctx || loadedImage.naturalWidth <= 0) {
        return;
      }

      const framing = getFramingContext(image, settings);
      const outputWidth = resolveOutputWidth(
        settings.outputWidthPreset,
        settings.customOutputWidth,
      );
      const transform = computeDefaultTransformFromSettings({
        source: framing.source,
        aspectRatio: settings.aspectRatio,
        fitMode: settings.fitMode,
        outputWidth,
      });

      canvas.width = framing.frame.width;
      canvas.height = framing.frame.height;
      setFrame(framing.frame);

      const input = buildFrameRenderInput({
        source: framing.source,
        aspectRatio: settings.aspectRatio,
        fitMode: settings.fitMode,
        outputWidth: framing.outputWidth,
        exportFormat: settings.exportFormat,
        transform,
        containBackgroundColor: settings.containBackgroundColor,
      });

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawFrame(ctx, loadedImage, input, framing.frame);
    };

    const cachedImage = imageElementRef.current;
    if (
      cachedImage &&
      cachedImage.src === image.previewUrl &&
      cachedImage.complete &&
      cachedImage.naturalWidth > 0
    ) {
      render(cachedImage);
      return () => {
        cancelled = true;
      };
    }

    const img = new window.Image();
    img.onload = () => {
      if (cancelled) {
        return;
      }

      imageElementRef.current = img;
      render(img);
    };

    img.onerror = () => {
      if (!cancelled) {
        imageElementRef.current = null;
      }
    };

    img.src = image.previewUrl;

    return () => {
      cancelled = true;
    };
  }, [image, settings]);

  return (
    <div className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm">
      <div className="border-b border-black/[0.04] px-4 py-3">
        <h2 className="text-sm font-semibold text-[#1d1d1f]">Preview</h2>
        <p className="mt-0.5 truncate text-xs text-[#86868b]">{image.name}</p>
      </div>

      <div ref={wrapperRef} className="bg-[#f5f5f7] p-4">
        <canvas
          ref={canvasRef}
          className="mx-auto block max-w-full rounded-lg shadow-sm"
          aria-label={`Batch preview of ${image.name}`}
        />
      </div>
    </div>
  );
}
