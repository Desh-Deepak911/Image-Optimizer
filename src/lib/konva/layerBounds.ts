import type { EditorLayer } from "@/types/konvaEditor";

export interface LayerBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function getLayerBounds(layer: EditorLayer): LayerBounds {
  if (layer.type === "text") {
    return {
      x: layer.x,
      y: layer.y,
      width: layer.width,
      height: layer.fontSize,
    };
  }

  return {
    x: layer.x,
    y: layer.y,
    width: layer.width,
    height: layer.height,
  };
}

export function getLayerCenter(bounds: LayerBounds): { x: number; y: number } {
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
}

export type LayerAlignment =
  | "left"
  | "center-h"
  | "right"
  | "top"
  | "center-v"
  | "bottom";

export function alignLayerBounds(
  bounds: LayerBounds,
  alignment: LayerAlignment,
  stageWidth: number,
  stageHeight: number,
): LayerBounds {
  switch (alignment) {
    case "left":
      return { ...bounds, x: 0 };
    case "center-h":
      return { ...bounds, x: (stageWidth - bounds.width) / 2 };
    case "right":
      return { ...bounds, x: stageWidth - bounds.width };
    case "top":
      return { ...bounds, y: 0 };
    case "center-v":
      return { ...bounds, y: (stageHeight - bounds.height) / 2 };
    case "bottom":
      return { ...bounds, y: stageHeight - bounds.height };
  }
}

export function alignEditorLayer(
  layer: EditorLayer,
  alignment: LayerAlignment,
  stageWidth: number,
  stageHeight: number,
): Pick<EditorLayer, "x" | "y"> {
  const aligned = alignLayerBounds(
    getLayerBounds(layer),
    alignment,
    stageWidth,
    stageHeight,
  );

  return {
    x: aligned.x,
    y: aligned.y,
  };
}

export function centerEditorLayer(
  layer: EditorLayer,
  stageWidth: number,
  stageHeight: number,
): Pick<EditorLayer, "x" | "y"> {
  const bounds = getLayerBounds(layer);

  return {
    x: (stageWidth - bounds.width) / 2,
    y: (stageHeight - bounds.height) / 2,
  };
}
