export type AspectRatio =
  | "original"
  | "1:1"
  | "4:5"
  | "9:16"
  | "16:9"
  | "youtube-thumbnail"
  | "twitter-post"
  | "linkedin-post";

export type FitMode = "contain-padding" | "cover" | "blur-background";

export type ExportFormat = "png" | "jpeg" | "webp";

export type OutputWidthPreset = "1080" | "1440" | "1920" | "custom";

import type { SourceTransform } from "@/types/editor";

export interface OptimizerSettings {
  aspectRatio: AspectRatio;
  fitMode: FitMode;
  exportFormat: ExportFormat;
  quality: number;
  outputWidthPreset: OutputWidthPreset;
  customOutputWidth: number;
}

export interface UploadedImage {
  file: File;
  previewUrl: string;
  name: string;
  size: number;
  mimeType: string;
  width: number;
  height: number;
}

export interface OptimizerState {
  image: UploadedImage | null;
  settings: OptimizerSettings;
  /** Explicit crop/placement; omitted means fit-mode defaults at render time. */
  transform?: SourceTransform | null;
}

export const DEFAULT_SETTINGS: OptimizerSettings = {
  aspectRatio: "original",
  fitMode: "contain-padding",
  exportFormat: "png",
  quality: 90,
  outputWidthPreset: "1920",
  customOutputWidth: 1200,
};

export const MIN_OUTPUT_WIDTH = 320;
export const MAX_OUTPUT_WIDTH = 8192;
export const MIN_EXPORT_QUALITY = 50;
export const MAX_EXPORT_QUALITY = 100;

export interface ExportSuccessState {
  filename: string;
  size: number;
  width: number;
  height: number;
}
