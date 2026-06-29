import { getEffectiveImageCrop } from "@/lib/konva/imageCrop";
import type { CleanupBrushStroke, ImageEditorLayer } from "@/types/konvaEditor";

export function createCleanupStrokeId(): string {
  return `cleanup-${crypto.randomUUID()}`;
}

function stampBlur(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  cx: number,
  cy: number,
  radius: number,
  blurAmount: number,
): void {
  const canvas = ctx.canvas;
  const diameter = Math.ceil(radius * 2);
  const sx = Math.max(0, Math.floor(cx - radius));
  const sy = Math.max(0, Math.floor(cy - radius));
  const sw = Math.min(diameter, canvas.width - sx);
  const sh = Math.min(diameter, canvas.height - sy);

  if (sw <= 0 || sh <= 0) {
    return;
  }

  const temp = document.createElement("canvas");
  temp.width = sw;
  temp.height = sh;
  const tempCtx = temp.getContext("2d");
  if (!tempCtx) {
    return;
  }

  tempCtx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, sw, sh);

  const blurred = document.createElement("canvas");
  blurred.width = sw;
  blurred.height = sh;
  const blurredCtx = blurred.getContext("2d");
  if (!blurredCtx) {
    return;
  }

  blurredCtx.filter = `blur(${Math.max(1, blurAmount)}px)`;
  blurredCtx.drawImage(temp, 0, 0);

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(blurred, sx, sy);
  ctx.restore();
}

function stampPixelate(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  blockSize: number,
): void {
  const canvas = ctx.canvas;
  const pixelSize = Math.max(2, Math.round(blockSize));
  const x0 = Math.max(0, Math.floor(cx - radius));
  const y0 = Math.max(0, Math.floor(cy - radius));
  const x1 = Math.min(canvas.width, Math.ceil(cx + radius));
  const y1 = Math.min(canvas.height, Math.ceil(cy + radius));
  const width = x1 - x0;
  const height = y1 - y0;

  if (width <= 0 || height <= 0) {
    return;
  }

  const imageData = ctx.getImageData(x0, y0, width, height);
  const data = imageData.data;
  const radiusSq = radius * radius;

  for (let blockY = y0; blockY < y1; blockY += pixelSize) {
    for (let blockX = x0; blockX < x1; blockX += pixelSize) {
      const blockCenterX = blockX + pixelSize / 2;
      const blockCenterY = blockY + pixelSize / 2;
      const dx = blockCenterX - cx;
      const dy = blockCenterY - cy;

      if (dx * dx + dy * dy > radiusSq) {
        continue;
      }

      let red = 0;
      let green = 0;
      let blue = 0;
      let alpha = 0;
      let count = 0;

      const blockEndX = Math.min(blockX + pixelSize, x1);
      const blockEndY = Math.min(blockY + pixelSize, y1);

      for (let py = blockY; py < blockEndY; py += 1) {
        for (let px = blockX; px < blockEndX; px += 1) {
          const pdx = px + 0.5 - cx;
          const pdy = py + 0.5 - cy;
          if (pdx * pdx + pdy * pdy > radiusSq) {
            continue;
          }

          const localX = px - x0;
          const localY = py - y0;
          const index = (localY * width + localX) * 4;
          red += data[index] ?? 0;
          green += data[index + 1] ?? 0;
          blue += data[index + 2] ?? 0;
          alpha += data[index + 3] ?? 0;
          count += 1;
        }
      }

      if (count === 0) {
        continue;
      }

      const avgRed = Math.round(red / count);
      const avgGreen = Math.round(green / count);
      const avgBlue = Math.round(blue / count);
      const avgAlpha = Math.round(alpha / count);

      for (let py = blockY; py < blockEndY; py += 1) {
        for (let px = blockX; px < blockEndX; px += 1) {
          const pdx = px + 0.5 - cx;
          const pdy = py + 0.5 - cy;
          if (pdx * pdx + pdy * pdy > radiusSq) {
            continue;
          }

          const localX = px - x0;
          const localY = py - y0;
          const index = (localY * width + localX) * 4;
          data[index] = avgRed;
          data[index + 1] = avgGreen;
          data[index + 2] = avgBlue;
          data[index + 3] = avgAlpha;
        }
      }
    }
  }

  ctx.putImageData(imageData, x0, y0);
}

function applyStrokeStamp(
  ctx: CanvasRenderingContext2D,
  sourceCanvas: HTMLCanvasElement,
  stroke: CleanupBrushStroke,
  scaleX: number,
  scaleY: number,
): void {
  const avgScale = (scaleX + scaleY) / 2;
  const radius = Math.max(2, (stroke.brushSize / 2) * avgScale);
  const step = Math.max(2, radius / 4);
  const points = stroke.points;

  const stampAt = (layerX: number, layerY: number) => {
    const sx = layerX * scaleX;
    const sy = layerY * scaleY;

    if (stroke.type === "blur") {
      stampBlur(ctx, sourceCanvas, sx, sy, radius, stroke.intensity);
      return;
    }

    stampPixelate(ctx, sx, sy, radius, stroke.intensity);
  };

  if (points.length >= 2) {
    stampAt(points[0], points[1]);
  }

  for (let index = 0; index < points.length - 3; index += 2) {
    const x0 = points[index];
    const y0 = points[index + 1];
    const x1 = points[index + 2];
    const y1 = points[index + 3];
    const distance = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(1, Math.ceil(distance / step));

    for (let stepIndex = 1; stepIndex <= steps; stepIndex += 1) {
      const t = stepIndex / steps;
      stampAt(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
    }
  }
}

export function buildCleanupImageCanvas(
  layer: ImageEditorLayer,
  sourceImage: HTMLImageElement,
  strokes: CleanupBrushStroke[] = layer.cleanupStrokes ?? [],
): HTMLCanvasElement | null {
  if (strokes.length === 0) {
    return null;
  }

  const crop = getEffectiveImageCrop(
    layer.crop,
    layer.image.width,
    layer.image.height,
  );
  const canvas = document.createElement("canvas");
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  ctx.drawImage(
    sourceImage,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  );

  const scaleX = crop.width / layer.width;
  const scaleY = crop.height / layer.height;

  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = crop.width;
  sourceCanvas.height = crop.height;
  const sourceCtx = sourceCanvas.getContext("2d");

  if (!sourceCtx) {
    return null;
  }

  sourceCtx.drawImage(canvas, 0, 0);

  for (const stroke of strokes) {
    applyStrokeStamp(ctx, sourceCanvas, stroke, scaleX, scaleY);
    sourceCtx.drawImage(canvas, 0, 0);
  }

  return canvas;
}
