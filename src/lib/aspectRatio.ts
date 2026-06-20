import {
  ASPECT_RATIO_OPTIONS,
  FIT_MODE_OPTIONS,
} from "@/lib/constants";
import type { AspectRatio, FitMode, UploadedImage } from "@/types/optimizer";

const NUMERIC_RATIOS: Record<Exclude<AspectRatio, "original">, number> = {
  "1:1": 1,
  "4:5": 4 / 5,
  "9:16": 9 / 16,
  "16:9": 16 / 9,
  "youtube-thumbnail": 16 / 9,
  "twitter-post": 16 / 9,
  "linkedin-post": 1.91,
};

export function getNumericAspectRatio(
  aspectRatio: AspectRatio,
  image?: Pick<UploadedImage, "width" | "height"> | null,
): number | null {
  if (aspectRatio === "original") {
    if (!image?.width || !image?.height) {
      return null;
    }

    return image.width / image.height;
  }

  return NUMERIC_RATIOS[aspectRatio];
}

export function getCssAspectRatio(
  aspectRatio: AspectRatio,
  image?: Pick<UploadedImage, "width" | "height"> | null,
): string | undefined {
  const numericRatio = getNumericAspectRatio(aspectRatio, image);

  if (numericRatio === null) {
    return undefined;
  }

  return `${numericRatio}`;
}

export function getAspectRatioLabel(aspectRatio: AspectRatio): string {
  return (
    ASPECT_RATIO_OPTIONS.find((option) => option.value === aspectRatio)?.label ??
    aspectRatio
  );
}

export function getFitModeLabel(fitMode: FitMode): string {
  return (
    FIT_MODE_OPTIONS.find((option) => option.value === fitMode)?.label ??
    fitMode
  );
}

export function getAspectRatioBadge(aspectRatio: AspectRatio): string | undefined {
  return ASPECT_RATIO_OPTIONS.find((option) => option.value === aspectRatio)
    ?.badge;
}
