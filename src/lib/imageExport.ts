import {
  buildFrameRenderInput,
  getFrameDimensions,
  renderFrameToCanvas,
} from "@/lib/render/drawFrame";
import type { FrameDimensions } from "@/lib/render/types";
import { resolveOutputWidth } from "@/lib/outputSize";
import type { SourceTransform } from "@/types/editor";
import type {
  AspectRatio,
  ExportFormat,
  FitMode,
  OptimizerSettings,
  UploadedImage,
} from "@/types/optimizer";
import {
  MAX_EXPORT_QUALITY,
  MIN_EXPORT_QUALITY,
} from "@/types/optimizer";

export interface ExportRenderOptions {
  image: UploadedImage;
  aspectRatio: AspectRatio;
  fitMode: FitMode;
  exportFormat: ExportFormat;
  quality: number;
  outputWidth: number;
  /** Optional explicit crop/placement. Omit to preserve legacy fit-mode rendering. */
  transform?: SourceTransform | null;
}

export type ExportDimensions = FrameDimensions;

function clampQuality(quality: number): number {
  return Math.min(
    MAX_EXPORT_QUALITY,
    Math.max(MIN_EXPORT_QUALITY, Math.round(quality)),
  );
}

export function getExportDimensions(
  aspectRatio: AspectRatio,
  outputWidth: number,
  image: Pick<UploadedImage, "width" | "height">,
): ExportDimensions {
  return getFrameDimensions(aspectRatio, outputWidth, image);
}

export function getExportDimensionsFromSettings(
  settings: OptimizerSettings,
  image: Pick<UploadedImage, "width" | "height">,
): ExportDimensions {
  const outputWidth = resolveOutputWidth(
    settings.outputWidthPreset,
    settings.customOutputWidth,
  );

  return getExportDimensions(settings.aspectRatio, outputWidth, image);
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image for export."));
    img.src = src;
  });
}

function toFrameRenderInput(options: ExportRenderOptions) {
  return buildFrameRenderInput({
    source: {
      width: options.image.width,
      height: options.image.height,
    },
    aspectRatio: options.aspectRatio,
    fitMode: options.fitMode,
    outputWidth: options.outputWidth,
    exportFormat: options.exportFormat,
    transform: options.transform,
  });
}

function getMimeType(format: ExportFormat): string {
  switch (format) {
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    default:
      return "image/png";
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: ExportFormat,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const mimeType = getMimeType(format);
    const qualityValue =
      format === "png" ? undefined : clampQuality(quality) / 100;

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(`Failed to export ${format.toUpperCase()} image.`));
          return;
        }

        resolve(blob);
      },
      mimeType,
      qualityValue,
    );
  });
}

export function getExportFilename(
  originalName: string,
  format: ExportFormat,
): string {
  const baseName = originalName.replace(/\.[^/.]+$/, "") || "image";
  const extension = format === "jpeg" ? "jpg" : format;
  return `${baseName}-optimized.${extension}`;
}

export interface ExportResult {
  blob: Blob;
  filename: string;
  dimensions: ExportDimensions;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function exportOptimizedImage(
  options: ExportRenderOptions,
): Promise<ExportResult> {
  const img = await loadImageElement(options.image.previewUrl);
  const frameInput = toFrameRenderInput(options);
  const canvas = renderFrameToCanvas(img, frameInput);
  const dimensions = getExportDimensions(
    options.aspectRatio,
    options.outputWidth,
    options.image,
  );
  const blob = await canvasToBlob(
    canvas,
    options.exportFormat,
    options.quality,
  );
  const filename = getExportFilename(options.image.name, options.exportFormat);
  downloadBlob(blob, filename);

  return {
    blob,
    filename,
    dimensions,
  };
}

export function buildExportOptions(
  image: UploadedImage,
  settings: OptimizerSettings,
  transform?: SourceTransform | null,
): ExportRenderOptions {
  return {
    image,
    aspectRatio: settings.aspectRatio,
    fitMode: settings.fitMode,
    exportFormat: settings.exportFormat,
    quality: settings.quality,
    outputWidth: resolveOutputWidth(
      settings.outputWidthPreset,
      settings.customOutputWidth,
    ),
    transform,
  };
}

export function buildExportOptionsFromDocument(document: {
  image: UploadedImage;
  settings: OptimizerSettings;
  transform?: SourceTransform | null;
}): ExportRenderOptions {
  return buildExportOptions(
    document.image,
    document.settings,
    document.transform,
  );
}
