import {
  MAX_OUTPUT_WIDTH,
  MIN_OUTPUT_WIDTH,
} from "@/types/optimizer";
import type {
  DimensionPreset,
  ExportDimensionPreset,
} from "@/types/konvaEditor";

export const FIXED_DIMENSION_PRESETS: Record<
  Exclude<DimensionPreset, "custom">,
  { width: number; height: number; label: string }
> = {
  "1080x1080": { width: 1080, height: 1080, label: "1080 × 1080" },
  "1080x1350": { width: 1080, height: 1350, label: "1080 × 1350" },
  "1080x1920": { width: 1080, height: 1920, label: "1080 × 1920" },
  "1920x1080": { width: 1920, height: 1080, label: "1920 × 1080" },
};

function clampDimension(value: number): number {
  const normalized = Number.isFinite(value) ? Math.round(value) : MIN_OUTPUT_WIDTH;
  return Math.min(MAX_OUTPUT_WIDTH, Math.max(MIN_OUTPUT_WIDTH, normalized));
}

export function resolveCanvasDimensions(
  preset: DimensionPreset,
  customWidth: number,
  customHeight: number,
): { width: number; height: number } {
  if (preset === "custom") {
    return {
      width: clampDimension(customWidth),
      height: clampDimension(customHeight),
    };
  }

  return FIXED_DIMENSION_PRESETS[preset];
}

export function resolveExportDimensions(
  exportPreset: ExportDimensionPreset,
  canvasWidth: number,
  canvasHeight: number,
  customWidth: number,
  customHeight: number,
): { width: number; height: number } {
  if (exportPreset === "canvas") {
    return { width: canvasWidth, height: canvasHeight };
  }

  if (exportPreset === "custom") {
    return {
      width: clampDimension(customWidth),
      height: clampDimension(customHeight),
    };
  }

  return FIXED_DIMENSION_PRESETS[exportPreset];
}
