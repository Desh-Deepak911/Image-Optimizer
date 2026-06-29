import { getLayerBounds, type LayerBounds } from "@/lib/konva/layerBounds";
import type { EditorLayer } from "@/types/konvaEditor";

export interface SnapGuideLine {
  orientation: "vertical" | "horizontal";
  position: number;
}

export interface SnapResult {
  x: number;
  y: number;
  guides: SnapGuideLine[];
}

const SNAP_THRESHOLD = 8;

interface SnapTarget {
  value: number;
  orientation: "vertical" | "horizontal";
}

function buildSnapTargets(
  stageWidth: number,
  stageHeight: number,
  otherLayers: EditorLayer[],
  activeLayerId: string,
): { vertical: SnapTarget[]; horizontal: SnapTarget[] } {
  const vertical: SnapTarget[] = [
    { value: 0, orientation: "vertical" },
    { value: stageWidth / 2, orientation: "vertical" },
    { value: stageWidth, orientation: "vertical" },
  ];
  const horizontal: SnapTarget[] = [
    { value: 0, orientation: "horizontal" },
    { value: stageHeight / 2, orientation: "horizontal" },
    { value: stageHeight, orientation: "horizontal" },
  ];

  for (const layer of otherLayers) {
    if (layer.id === activeLayerId || !layer.visible) {
      continue;
    }

    const other = getLayerBounds(layer);
    const centerX = other.x + other.width / 2;
    const centerY = other.y + other.height / 2;

    vertical.push(
      { value: other.x, orientation: "vertical" },
      { value: centerX, orientation: "vertical" },
      { value: other.x + other.width, orientation: "vertical" },
    );
    horizontal.push(
      { value: other.y, orientation: "horizontal" },
      { value: centerY, orientation: "horizontal" },
      { value: other.y + other.height, orientation: "horizontal" },
    );
  }

  return { vertical, horizontal };
}

function snapAxis(
  points: number[],
  targets: SnapTarget[],
  orientation: "vertical" | "horizontal",
): { delta: number; guide: SnapGuideLine | null } {
  let bestDelta = SNAP_THRESHOLD + 1;
  let bestShift = 0;
  let bestGuide: SnapGuideLine | null = null;

  for (const point of points) {
    for (const target of targets) {
      const delta = Math.abs(point - target.value);
      if (delta <= SNAP_THRESHOLD && delta < bestDelta) {
        bestDelta = delta;
        bestShift = target.value - point;
        bestGuide = { orientation, position: target.value };
      }
    }
  }

  return { delta: bestShift, guide: bestGuide };
}

export function snapLayerPosition(
  bounds: LayerBounds,
  stageWidth: number,
  stageHeight: number,
  otherLayers: EditorLayer[],
  activeLayerId: string,
): SnapResult {
  const { vertical, horizontal } = buildSnapTargets(
    stageWidth,
    stageHeight,
    otherLayers,
    activeLayerId,
  );

  const left = bounds.x;
  const centerX = bounds.x + bounds.width / 2;
  const right = bounds.x + bounds.width;
  const top = bounds.y;
  const centerY = bounds.y + bounds.height / 2;
  const bottom = bounds.y + bounds.height;

  const snapX = snapAxis([left, centerX, right], vertical, "vertical");
  const snapY = snapAxis([top, centerY, bottom], horizontal, "horizontal");

  const guides: SnapGuideLine[] = [];
  if (snapX.guide) {
    guides.push(snapX.guide);
  }
  if (snapY.guide) {
    guides.push(snapY.guide);
  }

  return {
    x: bounds.x + snapX.delta,
    y: bounds.y + snapY.delta,
    guides,
  };
}
