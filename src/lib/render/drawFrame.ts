import {
  getBlurBackgroundDrawRect,
  getContainDrawRect,
  getCoverDrawRect,
  getFrameDimensions,
} from "@/lib/render/geometry";
import {
  BLUR_FILTER,
  BLUR_OVERLAY_COLOR,
  type CanvasImageSource,
  type FrameDimensions,
  type FrameRenderInput,
  JPEG_BACKGROUND,
  PADDING_COLOR,
} from "@/lib/render/types";
import type { SourceTransform } from "@/types/editor";
import type { ExportFormat, FitMode } from "@/types/optimizer";

function configureContext(ctx: CanvasRenderingContext2D): void {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
}

function getBackgroundColor(exportFormat: ExportFormat): string {
  return exportFormat === "jpeg" ? JPEG_BACKGROUND : PADDING_COLOR;
}

function fillBackground(
  ctx: CanvasRenderingContext2D,
  frame: FrameDimensions,
  exportFormat: ExportFormat,
): void {
  ctx.fillStyle = getBackgroundColor(exportFormat);
  ctx.fillRect(0, 0, frame.width, frame.height);
}

function drawImageRect(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  rect: { x: number; y: number; width: number; height: number },
): void {
  ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height);
}

function drawImageWithTransform(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  transform: SourceTransform,
): void {
  const { sourceCrop, destination } = transform;

  ctx.drawImage(
    image,
    sourceCrop.x,
    sourceCrop.y,
    sourceCrop.width,
    sourceCrop.height,
    destination.x,
    destination.y,
    destination.width,
    destination.height,
  );
}

function drawContainImage(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  input: FrameRenderInput,
  frame: FrameDimensions,
): void {
  const rect = getContainDrawRect(input.source, frame);
  drawImageRect(ctx, image, rect);
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  input: FrameRenderInput,
  frame: FrameDimensions,
): void {
  const rect = getCoverDrawRect(input.source, frame);
  drawImageRect(ctx, image, rect);
}

function drawBlurBackground(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  input: FrameRenderInput,
  frame: FrameDimensions,
): void {
  ctx.save();
  ctx.filter = BLUR_FILTER;
  const rect = getBlurBackgroundDrawRect(input.source, frame);
  drawImageRect(ctx, image, rect);
  ctx.filter = "none";
  ctx.fillStyle = BLUR_OVERLAY_COLOR;
  ctx.fillRect(0, 0, frame.width, frame.height);
  ctx.restore();
}

function drawFitMode(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  input: FrameRenderInput,
  frame: FrameDimensions,
  fitMode: FitMode,
): void {
  if (fitMode === "contain-padding") {
    fillBackground(ctx, frame, input.exportFormat);
    drawContainImage(ctx, image, input, frame);
    return;
  }

  if (fitMode === "cover") {
    if (input.exportFormat === "jpeg") {
      fillBackground(ctx, frame, input.exportFormat);
    }
    drawCoverImage(ctx, image, input, frame);
    return;
  }

  if (fitMode === "blur-background") {
    if (input.exportFormat === "jpeg") {
      fillBackground(ctx, frame, input.exportFormat);
    }
    drawBlurBackground(ctx, image, input, frame);
    drawContainImage(ctx, image, input, frame);
    return;
  }

  throw new Error("Unsupported fit mode.");
}

function drawWithTransform(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  input: FrameRenderInput,
  frame: FrameDimensions,
  transform: SourceTransform,
): void {
  if (input.fitMode === "contain-padding") {
    fillBackground(ctx, frame, input.exportFormat);
  } else if (input.fitMode === "cover" && input.exportFormat === "jpeg") {
    fillBackground(ctx, frame, input.exportFormat);
  } else if (input.fitMode === "blur-background") {
    if (input.exportFormat === "jpeg") {
      fillBackground(ctx, frame, input.exportFormat);
    }
    drawBlurBackground(ctx, image, input, frame);
  }

  drawImageWithTransform(ctx, image, transform);
}

export function createFrameCanvas(
  input: FrameRenderInput,
): { canvas: HTMLCanvasElement; frame: FrameDimensions } {
  const frame = getFrameDimensions(
    input.aspectRatio,
    input.outputWidth,
    input.source,
  );

  const canvas = document.createElement("canvas");
  canvas.width = frame.width;
  canvas.height = frame.height;

  return { canvas, frame };
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  input: FrameRenderInput,
  frame: FrameDimensions,
): void {
  configureContext(ctx);

  if (input.transform) {
    drawWithTransform(ctx, image, input, frame, input.transform);
    return;
  }

  drawFitMode(ctx, image, input, frame, input.fitMode);
}

export function renderFrameToCanvas(
  image: CanvasImageSource,
  input: FrameRenderInput,
): HTMLCanvasElement {
  const { canvas, frame } = createFrameCanvas(input);
  const ctx = canvas.getContext("2d", { alpha: input.exportFormat !== "jpeg" });

  if (!ctx) {
    throw new Error("Canvas is not supported in this browser.");
  }

  drawFrame(ctx, image, input, frame);
  return canvas;
}

export function buildFrameRenderInput(options: {
  source: FrameRenderInput["source"];
  aspectRatio: FrameRenderInput["aspectRatio"];
  fitMode: FrameRenderInput["fitMode"];
  outputWidth: number;
  exportFormat: FrameRenderInput["exportFormat"];
  transform?: SourceTransform | null;
}): FrameRenderInput {
  return {
    source: options.source,
    aspectRatio: options.aspectRatio,
    fitMode: options.fitMode,
    outputWidth: options.outputWidth,
    exportFormat: options.exportFormat,
    transform: options.transform,
  };
}

export { getFrameDimensions };
