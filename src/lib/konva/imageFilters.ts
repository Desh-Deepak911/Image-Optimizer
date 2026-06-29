import Konva from "konva";
import type { ImageFilters } from "@/types/konvaEditor";

let sepiaRegistered = false;

function registerSepiaFilter(): void {
  if (sepiaRegistered) {
    return;
  }

  Konva.Filters.Sepia = function sepia(imageData) {
    const data = imageData.data;

    for (let index = 0; index < data.length; index += 4) {
      const red = data[index];
      const green = data[index + 1];
      const blue = data[index + 2];

      data[index] = Math.min(
        255,
        red * 0.393 + green * 0.769 + blue * 0.189,
      );
      data[index + 1] = Math.min(
        255,
        red * 0.349 + green * 0.686 + blue * 0.168,
      );
      data[index + 2] = Math.min(
        255,
        red * 0.272 + green * 0.534 + blue * 0.131,
      );
    }
  };

  sepiaRegistered = true;
}

type KonvaFilter = (imageData: ImageData) => void;

function asKonvaFilter(filter: unknown): KonvaFilter {
  return filter as KonvaFilter;
}

export function getActiveKonvaFilters(filters: ImageFilters): KonvaFilter[] {
  registerSepiaFilter();

  const active: KonvaFilter[] = [];

  if (filters.brightness !== 0) {
    active.push(asKonvaFilter(Konva.Filters.Brighten));
  }

  if (filters.contrast !== 0) {
    active.push(asKonvaFilter(Konva.Filters.Contrast));
  }

  if (filters.saturation !== 0) {
    active.push(asKonvaFilter(Konva.Filters.HSL));
  }

  if (filters.blur > 0) {
    active.push(asKonvaFilter(Konva.Filters.Blur));
  }

  if (filters.grayscale) {
    active.push(asKonvaFilter(Konva.Filters.Grayscale));
  }

  if (filters.sepia) {
    active.push(asKonvaFilter(Konva.Filters.Sepia));
  }

  return active;
}

export function applyImageFilterAttributes(
  node: Konva.Image,
  filters: ImageFilters,
): void {
  node.brightness(filters.brightness);
  node.contrast(filters.contrast);
  node.saturation(filters.saturation);
  node.blurRadius(filters.blur);
}

export function cacheFilteredImage(node: Konva.Image): void {
  node.cache();
  node.getLayer()?.batchDraw();
}
