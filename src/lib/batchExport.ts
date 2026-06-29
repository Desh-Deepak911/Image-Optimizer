import JSZip from "jszip";
import {
  buildExportOptions,
  getExportFilename,
  type ExportRenderOptions,
  type ExportResult,
} from "@/lib/imageExport";
import {
  buildFrameRenderInput,
  renderFrameToCanvas,
} from "@/lib/render/drawFrame";
import { computeDefaultTransformFromSettings } from "@/lib/render/computeTransform";
import { resolveOutputWidth } from "@/lib/outputSize";
import { downloadBlob } from "@/lib/imageExport";
import type { BatchSettings } from "@/types/batch";
import { BATCH_ZIP_FILENAME } from "@/types/batch";
import type { UploadedImage } from "@/types/optimizer";

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image for export."));
    img.src = src;
  });
}

function clampQuality(quality: number): number {
  return Math.min(100, Math.max(50, Math.round(quality)));
}

function getMimeType(format: BatchSettings["exportFormat"]): string {
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
  format: BatchSettings["exportFormat"],
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

export function buildBatchExportOptions(
  image: UploadedImage,
  settings: BatchSettings,
): ExportRenderOptions & { containBackgroundColor: string } {
  return {
    ...buildExportOptions(image, settings),
    containBackgroundColor: settings.containBackgroundColor,
  };
}

export async function renderBatchImage(
  image: UploadedImage,
  settings: BatchSettings,
): Promise<ExportResult> {
  const img = await loadImageElement(image.previewUrl);
  const outputWidth = resolveOutputWidth(
    settings.outputWidthPreset,
    settings.customOutputWidth,
  );
  const transform = computeDefaultTransformFromSettings({
    source: { width: image.width, height: image.height },
    aspectRatio: settings.aspectRatio,
    fitMode: settings.fitMode,
    outputWidth,
  });

  const frameInput = buildFrameRenderInput({
    source: { width: image.width, height: image.height },
    aspectRatio: settings.aspectRatio,
    fitMode: settings.fitMode,
    outputWidth,
    exportFormat: settings.exportFormat,
    transform,
    containBackgroundColor: settings.containBackgroundColor,
  });

  const canvas = renderFrameToCanvas(img, frameInput);
  const blob = await canvasToBlob(
    canvas,
    settings.exportFormat,
    settings.quality,
  );
  const filename = getExportFilename(image.name, settings.exportFormat);

  return {
    blob,
    filename,
    dimensions: {
      width: canvas.width,
      height: canvas.height,
    },
  };
}

export async function createBatchZip(
  files: { filename: string; blob: Blob }[],
): Promise<Blob> {
  const zip = new JSZip();

  for (const file of files) {
    zip.file(file.filename, file.blob);
  }

  return zip.generateAsync({ type: "blob" });
}

export async function downloadBatchZip(
  files: { filename: string; blob: Blob }[],
): Promise<void> {
  const zipBlob = await createBatchZip(files);
  downloadBlob(zipBlob, BATCH_ZIP_FILENAME);
}

export function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 0);
  });
}
