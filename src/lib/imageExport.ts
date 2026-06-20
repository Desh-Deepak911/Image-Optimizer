import { getNumericAspectRatio } from "@/lib/aspectRatio";
import { resolveOutputWidth } from "@/lib/outputSize";
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

const PADDING_COLOR = "#e8e8ed";
const JPEG_BACKGROUND = "#ffffff";

export interface ExportRenderOptions {
  image: UploadedImage;
  aspectRatio: AspectRatio;
  fitMode: FitMode;
  exportFormat: ExportFormat;
  quality: number;
  outputWidth: number;
}

export interface ExportDimensions {
  width: number;
  height: number;
}

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
  const ratio = getNumericAspectRatio(aspectRatio, image);

  if (!ratio) {
    return { width: image.width, height: image.height };
  }

  return {
    width: outputWidth,
    height: Math.max(1, Math.round(outputWidth / ratio)),
  };
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

function configureContext(ctx: CanvasRenderingContext2D): void {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
}

function getContainRect(
  srcWidth: number,
  srcHeight: number,
  dstWidth: number,
  dstHeight: number,
) {
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

function getCoverRect(
  srcWidth: number,
  srcHeight: number,
  dstWidth: number,
  dstHeight: number,
) {
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

function fillBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  exportFormat: ExportFormat,
): void {
  ctx.fillStyle =
    exportFormat === "jpeg" ? JPEG_BACKGROUND : PADDING_COLOR;
  ctx.fillRect(0, 0, width, height);
}

function drawContainImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number,
): void {
  const rect = getContainRect(
    img.naturalWidth,
    img.naturalHeight,
    canvasWidth,
    canvasHeight,
  );

  ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height);
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number,
): void {
  const rect = getCoverRect(
    img.naturalWidth,
    img.naturalHeight,
    canvasWidth,
    canvasHeight,
  );

  ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height);
}

function drawBlurBackground(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number,
): void {
  ctx.save();
  ctx.filter = "blur(48px) saturate(1.5)";
  const rect = getCoverRect(
    img.naturalWidth,
    img.naturalHeight,
    canvasWidth,
    canvasHeight,
  );
  const scale = 1.1;
  const width = rect.width * scale;
  const height = rect.height * scale;

  ctx.drawImage(
    img,
    rect.x - (width - rect.width) / 2,
    rect.y - (height - rect.height) / 2,
    width,
    height,
  );
  ctx.filter = "none";
  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  ctx.restore();
}

function renderToCanvas(
  img: HTMLImageElement,
  options: ExportRenderOptions,
): HTMLCanvasElement {
  const { width, height } = getExportDimensions(
    options.aspectRatio,
    options.outputWidth,
    options.image,
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d", { alpha: options.exportFormat !== "jpeg" });

  if (!ctx) {
    throw new Error("Canvas is not supported in this browser.");
  }

  configureContext(ctx);

  if (options.fitMode === "contain-padding") {
    fillBackground(ctx, width, height, options.exportFormat);
    drawContainImage(ctx, img, width, height);
    return canvas;
  }

  if (options.fitMode === "cover") {
    if (options.exportFormat === "jpeg") {
      fillBackground(ctx, width, height, options.exportFormat);
    }
    drawCoverImage(ctx, img, width, height);
    return canvas;
  }

  if (options.fitMode === "blur-background") {
    if (options.exportFormat === "jpeg") {
      fillBackground(ctx, width, height, options.exportFormat);
    }

    drawBlurBackground(ctx, img, width, height);
    drawContainImage(ctx, img, width, height);
    return canvas;
  }

  throw new Error("Unsupported fit mode.");
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
  const canvas = renderToCanvas(img, options);
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
  };
}
