import type { ExportFormat } from "@/types/optimizer";
import type { ExportDimensions } from "@/lib/imageExport";

export function estimateOutputFileSize(
  dimensions: ExportDimensions,
  format: ExportFormat,
  quality: number,
): number {
  const pixels = dimensions.width * dimensions.height;
  const normalizedQuality = Math.min(100, Math.max(50, quality)) / 100;

  switch (format) {
    case "png":
      return Math.round(pixels * 0.45);
    case "jpeg":
      return Math.round(pixels * 0.07 * normalizedQuality + pixels * 0.015);
    case "webp":
      return Math.round(pixels * 0.05 * normalizedQuality + pixels * 0.012);
    default:
      return Math.round(pixels * 0.45);
  }
}

export function calculateSizeDelta(
  originalSize: number,
  outputSize: number,
): number | null {
  if (originalSize <= 0) {
    return null;
  }

  return Math.round(((outputSize - originalSize) / originalSize) * 100);
}
