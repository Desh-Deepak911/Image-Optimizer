import type { ImageSourceCrop } from "@/types/konvaEditor";

export function createFullImageCrop(
  imageWidth: number,
  imageHeight: number,
): ImageSourceCrop {
  return {
    x: 0,
    y: 0,
    width: imageWidth,
    height: imageHeight,
  };
}

export function clampImageCrop(
  crop: ImageSourceCrop,
  imageWidth: number,
  imageHeight: number,
): ImageSourceCrop {
  const width = Math.max(1, Math.min(crop.width, imageWidth));
  const height = Math.max(1, Math.min(crop.height, imageHeight));
  const maxX = Math.max(0, imageWidth - width);
  const maxY = Math.max(0, imageHeight - height);

  return {
    x: Math.min(Math.max(0, crop.x), maxX),
    y: Math.min(Math.max(0, crop.y), maxY),
    width,
    height,
  };
}

export function isFullImageCrop(
  crop: ImageSourceCrop,
  imageWidth: number,
  imageHeight: number,
): boolean {
  return (
    crop.x <= 0 &&
    crop.y <= 0 &&
    crop.width >= imageWidth - 0.5 &&
    crop.height >= imageHeight - 0.5
  );
}

export function getEffectiveImageCrop(
  crop: ImageSourceCrop | undefined,
  imageWidth: number,
  imageHeight: number,
): ImageSourceCrop {
  if (!crop) {
    return createFullImageCrop(imageWidth, imageHeight);
  }

  return clampImageCrop(crop, imageWidth, imageHeight);
}
