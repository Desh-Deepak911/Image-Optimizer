import type { AnnotationStyle } from "@/types/annotationStyle";
import {
  getEffectiveStrokeColor,
  resolveShapeAnnotationStyle,
} from "@/lib/konva/annotationStyle";
import type {
  CalloutKind,
  EditorToolId,
  ShapeEditorLayer,
} from "@/types/konvaEditor";
import { DEFAULT_ANNOTATION_STYLE } from "@/types/annotationStyle";

export const EDITOR_TOOL_OPTIONS: {
  id: EditorToolId;
  label: string;
  shortLabel: string;
}[] = [
  { id: "select", label: "Select", shortLabel: "Select" },
  { id: "line", label: "Line", shortLabel: "Line" },
  { id: "arrow", label: "Arrow", shortLabel: "Arrow" },
  { id: "freehand", label: "Draw", shortLabel: "Draw" },
  { id: "highlighter", label: "Highlight", shortLabel: "Highlight" },
  { id: "label", label: "Label", shortLabel: "Label" },
  { id: "speech-bubble", label: "Bubble", shortLabel: "Bubble" },
  { id: "numbered-marker", label: "Marker", shortLabel: "Marker" },
];

export const EDITOR_TOOL_HINTS: Record<EditorToolId, string> = {
  select: "Click layers to select, drag to move, and use handles to resize or rotate.",
  line: "Click and drag on the canvas to draw a straight line.",
  arrow: "Click and drag to draw an arrow pointing toward the end point.",
  freehand: "Click and drag to draw a freehand stroke.",
  highlighter: "Click and drag to highlight areas with a semi-transparent stroke.",
  label: "Click and drag to place a label tag, then edit text in the sidebar.",
  "speech-bubble": "Click and drag to place a speech bubble annotation.",
  "numbered-marker": "Click on the canvas to place a numbered marker.",
};

export const EDITOR_TOOL_CURSORS: Record<EditorToolId, string> = {
  select: "default",
  line: "crosshair",
  arrow: "crosshair",
  freehand: "crosshair",
  highlighter: "crosshair",
  label: "crosshair",
  "speech-bubble": "crosshair",
  "numbered-marker": "crosshair",
};

export function isDrawingTool(tool: EditorToolId): boolean {
  return (
    tool === "line" ||
    tool === "arrow" ||
    tool === "freehand" ||
    tool === "highlighter"
  );
}

export function isCalloutTool(tool: EditorToolId): boolean {
  return (
    tool === "label" ||
    tool === "speech-bubble" ||
    tool === "numbered-marker"
  );
}

export function isAnnotationTool(tool: EditorToolId): boolean {
  return isDrawingTool(tool) || isCalloutTool(tool);
}

export function getStrokeColor(
  layer: ShapeEditorLayer,
  settings: AnnotationStyle = DEFAULT_ANNOTATION_STYLE,
): string {
  return getEffectiveStrokeColor(resolveShapeAnnotationStyle(layer)) || settings.strokeColor;
}

export interface LineGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
  points: number[];
}

export function lineGeometryFromDrag(
  start: { x: number; y: number },
  end: { x: number; y: number },
): LineGeometry | null {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);

  if (length < 4) {
    return null;
  }

  return {
    x: start.x,
    y: start.y,
    width: Math.max(1, Math.abs(dx)),
    height: Math.max(1, Math.abs(dy)),
    points: [0, 0, dx, dy],
  };
}

export interface FreehandGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
  points: number[];
}

export function freehandGeometryFromPoints(
  absolutePoints: number[],
): FreehandGeometry | null {
  if (absolutePoints.length < 4) {
    return null;
  }

  let minX = absolutePoints[0];
  let minY = absolutePoints[1];
  let maxX = absolutePoints[0];
  let maxY = absolutePoints[1];

  for (let index = 0; index < absolutePoints.length; index += 2) {
    const x = absolutePoints[index];
    const y = absolutePoints[index + 1];
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const relativePoints = absolutePoints.map((value, index) =>
    index % 2 === 0 ? value - minX : value - minY,
  );

  return {
    x: minX,
    y: minY,
    width,
    height,
    points: relativePoints,
  };
}

export function simplifyFreehandPoints(
  points: number[],
  minDistance = 3,
): number[] {
  if (points.length < 4) {
    return points;
  }

  const simplified = [points[0], points[1]];

  for (let index = 2; index < points.length; index += 2) {
    const lastIndex = simplified.length - 2;
    const dx = points[index] - simplified[lastIndex];
    const dy = points[index + 1] - simplified[lastIndex + 1];

    if (Math.hypot(dx, dy) >= minDistance) {
      simplified.push(points[index], points[index + 1]);
    }
  }

  return simplified;
}

export function calloutToolToKind(tool: EditorToolId): CalloutKind | null {
  if (tool === "label") {
    return "label";
  }

  if (tool === "speech-bubble") {
    return "speech-bubble";
  }

  if (tool === "numbered-marker") {
    return "numbered-marker";
  }

  return null;
}

export const MIN_CALLOUT_SIZE = 24;
