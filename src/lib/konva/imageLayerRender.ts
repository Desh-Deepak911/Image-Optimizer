import type Konva from "konva";
import type { ImageLayerStyle, ImageMaskType } from "@/types/konvaEditor";

export function usesImageClipMask(mask: ImageMaskType): boolean {
  return mask === "rectangle" || mask === "rounded" || mask === "circle";
}

export function getImageCornerRadius(
  mask: ImageMaskType,
  cornerRadius: number,
): number {
  if (mask === "rectangle" || mask === "circle") {
    return 0;
  }

  return cornerRadius;
}

export function drawImageMaskPath(
  context: Konva.Context,
  width: number,
  height: number,
  mask: ImageMaskType,
  cornerRadius: number,
): void {
  if (mask === "circle") {
    const radiusX = width / 2;
    const radiusY = height / 2;
    context.save();
    context.translate(radiusX, radiusY);
    context.scale(radiusX, radiusY);
    context.arc(0, 0, 1, 0, Math.PI * 2, false);
    context.restore();
    return;
  }

  if (mask === "rounded" && cornerRadius > 0) {
    const radius = Math.min(cornerRadius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(radius, 0);
    context.lineTo(width - radius, 0);
    context.quadraticCurveTo(width, 0, width, radius);
    context.lineTo(width, height - radius);
    context.quadraticCurveTo(width, height, width - radius, height);
    context.lineTo(radius, height);
    context.quadraticCurveTo(0, height, 0, height - radius);
    context.lineTo(0, radius);
    context.quadraticCurveTo(0, 0, radius, 0);
    context.closePath();
    return;
  }

  context.beginPath();
  context.rect(0, 0, width, height);
  context.closePath();
}

export function hasActiveGlow(style: ImageLayerStyle): boolean {
  return style.glowBlur > 0 && style.glowOpacity > 0;
}

export function hasActiveDropShadow(style: ImageLayerStyle): boolean {
  return style.shadowBlur > 0 && style.shadowOpacity > 0;
}
