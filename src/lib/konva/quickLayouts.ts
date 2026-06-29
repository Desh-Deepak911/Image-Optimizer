import { type LayerBounds } from "@/lib/konva/layerBounds";
import type { ImageEditorLayer, ImageFilters } from "@/types/konvaEditor";

export { centerEditorLayer, getLayerBounds } from "@/lib/konva/layerBounds";

export type QuickLayoutId =
  | "side-by-side"
  | "before-after"
  | "before-after-collage"
  | "comparison-split"
  | "grid-3"
  | "grid-4"
  | "centered-padding"
  | "auto-padding"
  | "blur-poster";

export interface QuickLayoutOption {
  id: QuickLayoutId;
  label: string;
  description: string;
  minImages: number;
}

export const QUICK_LAYOUT_OPTIONS: QuickLayoutOption[] = [
  {
    id: "side-by-side",
    label: "Side by side",
    description: "Two images in equal columns",
    minImages: 2,
  },
  {
    id: "before-after",
    label: "Before / after",
    description: "Split comparison with a center gap",
    minImages: 2,
  },
  {
    id: "before-after-collage",
    label: "Before / after collage",
    description: "Comparison collage with divider and labels",
    minImages: 2,
  },
  {
    id: "comparison-split",
    label: "Comparison split",
    description: "Left/right images with divider and labels",
    minImages: 2,
  },
  {
    id: "grid-3",
    label: "3-image grid",
    description: "Two on top, one below",
    minImages: 3,
  },
  {
    id: "grid-4",
    label: "4-image grid",
    description: "Even 2×2 collage",
    minImages: 4,
  },
  {
    id: "centered-padding",
    label: "Centered screenshot",
    description: "Screenshot centered with padding",
    minImages: 1,
  },
  {
    id: "auto-padding",
    label: "Auto-padding",
    description: "Screenshot padding with rounded corners and shadow",
    minImages: 1,
  },
  {
    id: "blur-poster",
    label: "Blur background",
    description: "Blurred fill behind a centered image",
    minImages: 1,
  },
];

export interface LayerPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  filters?: Partial<ImageFilters>;
}

function containInBox(
  naturalWidth: number,
  naturalHeight: number,
  boxX: number,
  boxY: number,
  boxWidth: number,
  boxHeight: number,
): LayerPlacement {
  const scale = Math.min(boxWidth / naturalWidth, boxHeight / naturalHeight);
  const width = naturalWidth * scale;
  const height = naturalHeight * scale;

  return {
    x: boxX + (boxWidth - width) / 2,
    y: boxY + (boxHeight - height) / 2,
    width,
    height,
  };
}

function coverInBox(
  naturalWidth: number,
  naturalHeight: number,
  boxX: number,
  boxY: number,
  boxWidth: number,
  boxHeight: number,
): LayerPlacement {
  const scale = Math.max(boxWidth / naturalWidth, boxHeight / naturalHeight);
  const width = naturalWidth * scale;
  const height = naturalHeight * scale;

  return {
    x: boxX + (boxWidth - width) / 2,
    y: boxY + (boxHeight - height) / 2,
    width,
    height,
  };
}

export interface ComparisonSplitGeometry {
  leftCell: { x: number; y: number; width: number; height: number };
  rightCell: { x: number; y: number; width: number; height: number };
  dividerX: number;
}

export function getComparisonSplitGeometry(
  stageWidth: number,
  stageHeight: number,
): ComparisonSplitGeometry {
  const padding = Math.round(Math.min(stageWidth, stageHeight) * 0.04);
  const innerWidth = stageWidth - padding * 2;
  const innerHeight = stageHeight - padding * 2;
  const gap = Math.round(innerWidth * 0.016);
  const cellWidth = (innerWidth - gap) / 2;
  const leftCell = {
    x: padding,
    y: padding,
    width: cellWidth,
    height: innerHeight,
  };
  const rightCell = {
    x: padding + cellWidth + gap,
    y: padding,
    width: cellWidth,
    height: innerHeight,
  };

  return {
    leftCell,
    rightCell,
    dividerX: leftCell.x + leftCell.width + gap / 2,
  };
}

export function getQuickLayoutPlacements(
  layoutId: QuickLayoutId,
  images: Pick<ImageEditorLayer, "id" | "image">[],
  stageWidth: number,
  stageHeight: number,
): Map<string, LayerPlacement> {
  const padding = Math.round(Math.min(stageWidth, stageHeight) * 0.04);
  const innerWidth = stageWidth - padding * 2;
  const innerHeight = stageHeight - padding * 2;
  const placements = new Map<string, LayerPlacement>();

  const placeInBox = (
    layer: Pick<ImageEditorLayer, "id" | "image">,
    boxX: number,
    boxY: number,
    boxWidth: number,
    boxHeight: number,
    mode: "contain" | "cover" = "contain",
    filters?: Partial<ImageFilters>,
  ) => {
    const fit =
      mode === "cover"
        ? coverInBox(
            layer.image.width,
            layer.image.height,
            boxX,
            boxY,
            boxWidth,
            boxHeight,
          )
        : containInBox(
            layer.image.width,
            layer.image.height,
            boxX,
            boxY,
            boxWidth,
            boxHeight,
          );

    placements.set(layer.id, {
      ...fit,
      ...(filters ? { filters } : {}),
    });
  };

  switch (layoutId) {
    case "side-by-side": {
      const gap = Math.round(innerWidth * 0.02);
      const cellWidth = (innerWidth - gap) / 2;
      placeInBox(images[0], padding, padding, cellWidth, innerHeight);
      placeInBox(
        images[1],
        padding + cellWidth + gap,
        padding,
        cellWidth,
        innerHeight,
      );
      break;
    }
    case "before-after": {
      const gap = Math.round(innerWidth * 0.03);
      const cellWidth = (innerWidth - gap) / 2;
      placeInBox(images[0], padding, padding, cellWidth, innerHeight, "cover");
      placeInBox(
        images[1],
        padding + cellWidth + gap,
        padding,
        cellWidth,
        innerHeight,
        "cover",
      );
      break;
    }
    case "before-after-collage":
    case "comparison-split": {
      const { leftCell, rightCell } = getComparisonSplitGeometry(
        stageWidth,
        stageHeight,
      );
      placeInBox(
        images[0],
        leftCell.x,
        leftCell.y,
        leftCell.width,
        leftCell.height,
        "cover",
      );
      placeInBox(
        images[1],
        rightCell.x,
        rightCell.y,
        rightCell.width,
        rightCell.height,
        "cover",
      );
      break;
    }
    case "grid-3": {
      const gap = Math.round(Math.min(innerWidth, innerHeight) * 0.02);
      const topHeight = (innerHeight - gap) * 0.55;
      const bottomHeight = innerHeight - gap - topHeight;
      const topCellWidth = (innerWidth - gap) / 2;
      placeInBox(images[0], padding, padding, topCellWidth, topHeight);
      placeInBox(
        images[1],
        padding + topCellWidth + gap,
        padding,
        topCellWidth,
        topHeight,
      );
      placeInBox(
        images[2],
        padding,
        padding + topHeight + gap,
        innerWidth,
        bottomHeight,
      );
      break;
    }
    case "grid-4": {
      const gap = Math.round(Math.min(innerWidth, innerHeight) * 0.02);
      const cellWidth = (innerWidth - gap) / 2;
      const cellHeight = (innerHeight - gap) / 2;
      placeInBox(images[0], padding, padding, cellWidth, cellHeight);
      placeInBox(
        images[1],
        padding + cellWidth + gap,
        padding,
        cellWidth,
        cellHeight,
      );
      placeInBox(
        images[2],
        padding,
        padding + cellHeight + gap,
        cellWidth,
        cellHeight,
      );
      placeInBox(
        images[3],
        padding + cellWidth + gap,
        padding + cellHeight + gap,
        cellWidth,
        cellHeight,
      );
      break;
    }
    case "centered-padding": {
      const inset = Math.round(Math.min(stageWidth, stageHeight) * 0.1);
      placeInBox(
        images[0],
        inset,
        inset,
        stageWidth - inset * 2,
        stageHeight - inset * 2,
      );
      break;
    }
    case "auto-padding": {
      const inset = Math.round(Math.min(stageWidth, stageHeight) * 0.12);
      placeInBox(
        images[0],
        inset,
        inset,
        stageWidth - inset * 2,
        stageHeight - inset * 2,
      );
      break;
    }
    case "blur-poster": {
      placeInBox(
        images[0],
        padding,
        padding,
        innerWidth,
        innerHeight,
      );
      break;
    }
  }

  return placements;
}

export function getBlurPosterBackdropPlacement(
  layer: Pick<ImageEditorLayer, "image">,
  stageWidth: number,
  stageHeight: number,
): LayerPlacement {
  return {
    ...coverInBox(layer.image.width, layer.image.height, 0, 0, stageWidth, stageHeight),
    filters: { blur: 24, saturation: -0.15 },
  };
}

export function centerLayerOnCanvas(
  layer: LayerBounds,
  stageWidth: number,
  stageHeight: number,
): LayerPlacement {
  return {
    x: (stageWidth - layer.width) / 2,
    y: (stageHeight - layer.height) / 2,
    width: layer.width,
    height: layer.height,
  };
}

export function fitLayerToCanvas(
  layer: Pick<ImageEditorLayer, "image" | "width" | "height">,
  stageWidth: number,
  stageHeight: number,
  mode: "contain" | "cover",
): LayerPlacement {
  const padding = Math.round(Math.min(stageWidth, stageHeight) * 0.04);

  if (mode === "contain") {
    return containInBox(
      layer.image.width,
      layer.image.height,
      padding,
      padding,
      stageWidth - padding * 2,
      stageHeight - padding * 2,
    );
  }

  return coverInBox(
    layer.image.width,
    layer.image.height,
    0,
    0,
    stageWidth,
    stageHeight,
  );
}
