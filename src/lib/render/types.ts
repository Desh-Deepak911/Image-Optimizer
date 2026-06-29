import type { AspectRatio, ExportFormat, FitMode } from "@/types/optimizer";
import type { SourceTransform } from "@/types/editor";

export interface DrawRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SourceDimensions {
  width: number;
  height: number;
}

export interface FrameDimensions {
  width: number;
  height: number;
}

export interface FrameRenderInput {
  source: SourceDimensions;
  aspectRatio: AspectRatio;
  fitMode: FitMode;
  outputWidth: number;
  exportFormat: ExportFormat;
  /** When set, overrides default fit-mode placement with an explicit crop. */
  transform?: SourceTransform | null;
}

export const PADDING_COLOR = "#e8e8ed";
export const JPEG_BACKGROUND = "#ffffff";

export const BLUR_FILTER = "blur(48px) saturate(1.5)";
export const BLUR_OVERLAY_COLOR = "rgba(255, 255, 255, 0.2)";
export const BLUR_BACKGROUND_SCALE = 1.1;

export type CanvasImageSource = HTMLImageElement | ImageBitmap;
