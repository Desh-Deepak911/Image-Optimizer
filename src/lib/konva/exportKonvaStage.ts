import type { ExportFormat } from "@/types/optimizer";
import {
  MAX_EXPORT_QUALITY,
  MIN_EXPORT_QUALITY,
} from "@/types/optimizer";
import type { StageBackground } from "@/types/konvaEditor";
import { getStageBackgroundFillProps } from "@/lib/konva/backgroundGradients";
import Konva from "konva";

function clampQuality(quality: number): number {
  return Math.min(
    MAX_EXPORT_QUALITY,
    Math.max(MIN_EXPORT_QUALITY, Math.round(quality)),
  );
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

function formatNeedsOpaqueBackground(format: ExportFormat): boolean {
  return format === "jpeg";
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

interface ExportKonvaStageOptions {
  background: StageBackground;
  canvasWidth: number;
  canvasHeight: number;
  exportWidth: number;
  exportHeight: number;
}

export function exportKonvaStageToBlob(
  stage: Konva.Stage,
  format: ExportFormat,
  quality: number,
  options: ExportKonvaStageOptions,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const {
      background,
      canvasWidth,
      canvasHeight,
      exportWidth,
      exportHeight,
    } = options;

    const contentLayer = stage.findOne("Layer") as Konva.Layer | undefined;
    let tempBackground: Konva.Rect | null = null;
    const transformerVisibility: { node: Konva.Node; visible: boolean }[] = [];

    stage.find("Transformer").forEach((node) => {
      transformerVisibility.push({ node, visible: node.visible() });
      node.visible(false);
    });
    stage.find(".snap-guide").forEach((node) => {
      transformerVisibility.push({ node, visible: node.visible() });
      node.visible(false);
    });
    stage.find(".crop-guide").forEach((node) => {
      transformerVisibility.push({ node, visible: node.visible() });
      node.visible(false);
    });
    contentLayer?.batchDraw();

    if (contentLayer) {
      const existingBackground = contentLayer.findOne(".stage-background") as
        | Konva.Rect
        | undefined;

      if (background.transparent && formatNeedsOpaqueBackground(format)) {
        tempBackground = new Konva.Rect({
          x: 0,
          y: 0,
          width: canvasWidth,
          height: canvasHeight,
          fill: "#ffffff",
          listening: false,
        });
        contentLayer.add(tempBackground);
        tempBackground.moveToBottom();
        contentLayer.batchDraw();
      } else if (!background.transparent && !existingBackground) {
        tempBackground = new Konva.Rect({
          x: 0,
          y: 0,
          width: canvasWidth,
          height: canvasHeight,
          listening: false,
          ...getStageBackgroundFillProps(
            background,
            canvasWidth,
            canvasHeight,
          ),
        });
        contentLayer.add(tempBackground);
        tempBackground.moveToBottom();
        contentLayer.batchDraw();
      }
    }

    const displayScale = stage.scaleX() || 1;
    const pixelRatio = canvasWidth / (stage.width() / displayScale);

    const restoreStage = () => {
      tempBackground?.destroy();
      transformerVisibility.forEach(({ node, visible }) => {
        node.visible(visible);
      });
      contentLayer?.batchDraw();
    };

    try {
      const sourceCanvas = stage.toCanvas({ pixelRatio });

      restoreStage();

      if (exportWidth === canvasWidth && exportHeight === canvasHeight) {
        canvasToBlob(sourceCanvas, format, quality).then(resolve).catch(reject);
        return;
      }

      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = exportWidth;
      exportCanvas.height = exportHeight;
      const context = exportCanvas.getContext("2d");

      if (!context) {
        reject(new Error("Unable to create export canvas."));
        return;
      }

      context.drawImage(sourceCanvas, 0, 0, exportWidth, exportHeight);
      canvasToBlob(exportCanvas, format, quality).then(resolve).catch(reject);
    } catch (error) {
      restoreStage();
      reject(
        error instanceof Error
          ? error
          : new Error("Something went wrong while exporting the composition."),
      );
    }
  });
}

export function downloadKonvaExport(
  blob: Blob,
  filename: string,
): void {
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

export function getAdvancedExportFilename(format: ExportFormat): string {
  const extension = format === "jpeg" ? "jpg" : format;
  return `composition-export.${extension}`;
}
