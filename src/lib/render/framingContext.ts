import { getFrameDimensions } from "@/lib/render/geometry";
import type { FrameDimensions, SourceDimensions } from "@/lib/render/types";
import { resolveOutputWidth } from "@/lib/outputSize";
import type { OptimizerSettings, UploadedImage } from "@/types/optimizer";

export interface FramingContext {
  source: SourceDimensions;
  frame: FrameDimensions;
  outputWidth: number;
}

export function getFramingContext(
  image: Pick<UploadedImage, "width" | "height">,
  settings: Pick<
    OptimizerSettings,
    "aspectRatio" | "outputWidthPreset" | "customOutputWidth"
  >,
): FramingContext {
  const source = {
    width: image.width,
    height: image.height,
  };
  const outputWidth = resolveOutputWidth(
    settings.outputWidthPreset,
    settings.customOutputWidth,
  );
  const frame = getFrameDimensions(
    settings.aspectRatio,
    outputWidth,
    source,
  );

  return {
    source,
    frame,
    outputWidth,
  };
}

export function getFramingSettingsKey(
  settings: Pick<
    OptimizerSettings,
    "aspectRatio" | "fitMode" | "outputWidthPreset" | "customOutputWidth"
  >,
): string {
  return [
    settings.aspectRatio,
    settings.fitMode,
    settings.outputWidthPreset,
    settings.customOutputWidth,
  ].join("|");
}
