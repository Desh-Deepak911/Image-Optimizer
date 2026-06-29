import { getNumericAspectRatio } from "@/lib/aspectRatio";
import {
  BLUR_BACKGROUND_SCALE,
  type DrawRect,
  type FrameDimensions,
  type SourceDimensions,
} from "@/lib/render/types";
import type { AspectRatio } from "@/types/optimizer";

export function getContainRect(
  srcWidth: number,
  srcHeight: number,
  dstWidth: number,
  dstHeight: number,
): DrawRect {
  const scale = Math.min(dstWidth / srcWidth, dstHeight / srcHeight);
  const width = srcWidth * scale;
  const height = srcHeight * scale;

  return {
    x: (dstWidth - width) / 2,
    y: (dstHeight - height) / 2,
    width,
    height,
  };
}

export function getCoverRect(
  srcWidth: number,
  srcHeight: number,
  dstWidth: number,
  dstHeight: number,
): DrawRect {
  const scale = Math.max(dstWidth / srcWidth, dstHeight / srcHeight);
  const width = srcWidth * scale;
  const height = srcHeight * scale;

  return {
    x: (dstWidth - width) / 2,
    y: (dstHeight - height) / 2,
    width,
    height,
  };
}

export function getBlurBackgroundRect(
  srcWidth: number,
  srcHeight: number,
  dstWidth: number,
  dstHeight: number,
): DrawRect {
  const rect = getCoverRect(srcWidth, srcHeight, dstWidth, dstHeight);
  const width = rect.width * BLUR_BACKGROUND_SCALE;
  const height = rect.height * BLUR_BACKGROUND_SCALE;

  return {
    x: rect.x - (width - rect.width) / 2,
    y: rect.y - (height - rect.height) / 2,
    width,
    height,
  };
}

export function getFrameDimensions(
  aspectRatio: AspectRatio,
  outputWidth: number,
  source: SourceDimensions,
): FrameDimensions {
  const ratio = getNumericAspectRatio(aspectRatio, source);

  if (!ratio) {
    return { width: source.width, height: source.height };
  }

  return {
    width: outputWidth,
    height: Math.max(1, Math.round(outputWidth / ratio)),
  };
}

export function getContainDrawRect(
  source: SourceDimensions,
  frame: FrameDimensions,
): DrawRect {
  return getContainRect(
    source.width,
    source.height,
    frame.width,
    frame.height,
  );
}

export function getCoverDrawRect(
  source: SourceDimensions,
  frame: FrameDimensions,
): DrawRect {
  return getCoverRect(source.width, source.height, frame.width, frame.height);
}

export function getBlurBackgroundDrawRect(
  source: SourceDimensions,
  frame: FrameDimensions,
): DrawRect {
  return getBlurBackgroundRect(
    source.width,
    source.height,
    frame.width,
    frame.height,
  );
}
