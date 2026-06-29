import type {
  ExportFormat,
  OptimizerSettings,
  UploadedImage,
} from "@/types/optimizer";
import { createFullImageCrop } from "@/lib/konva/imageCrop";
import type {
  AnnotationStyle,
} from "@/types/annotationStyle";
import { DEFAULT_ANNOTATION_STYLE } from "@/types/annotationStyle";
import {
  applyAnnotationStyleToCalloutLayer,
  applyAnnotationStyleToShapeLayer,
  styleForShapeKind,
} from "@/lib/konva/annotationStyle";

export type AppMode = "optimizer" | "advanced" | "batch";

export type DimensionPreset =
  | "1080x1080"
  | "1080x1350"
  | "1080x1920"
  | "1920x1080"
  | "custom";

export type ExportDimensionPreset = "canvas" | DimensionPreset;

export interface AdvancedEditorSettings {
  canvasPreset: DimensionPreset;
  customCanvasWidth: number;
  customCanvasHeight: number;
  exportPreset: ExportDimensionPreset;
  customExportWidth: number;
  customExportHeight: number;
  exportFormat: ExportFormat;
  quality: number;
}

export const DEFAULT_ADVANCED_EDITOR_SETTINGS: AdvancedEditorSettings = {
  canvasPreset: "1920x1080",
  customCanvasWidth: 1920,
  customCanvasHeight: 1080,
  exportPreset: "canvas",
  customExportWidth: 1080,
  customExportHeight: 1080,
  exportFormat: "png",
  quality: 90,
};

export type EditorLayerType = "image" | "text" | "shape";

export type ShapeKind =
  | "rectangle"
  | "circle"
  | "line"
  | "arrow"
  | "freehand"
  | "highlighter";

export type EditorToolId =
  | "select"
  | "line"
  | "arrow"
  | "freehand"
  | "highlighter"
  | "label"
  | "speech-bubble"
  | "numbered-marker";

export type CalloutKind = "label" | "speech-bubble" | "numbered-marker";

export type { AnnotationStyle } from "@/types/annotationStyle";
export { DEFAULT_ANNOTATION_STYLE } from "@/types/annotationStyle";

/** Active tool style defaults for the next annotation. */
export type DrawingToolSettings = AnnotationStyle;

export const DEFAULT_DRAWING_TOOL_SETTINGS: DrawingToolSettings =
  DEFAULT_ANNOTATION_STYLE;

export interface ImageFilters {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  grayscale: boolean;
  sepia: boolean;
}

export interface ImageLayerStyle {
  cornerRadius: number;
  borderWidth: number;
  borderColor: string;
  shadowBlur: number;
  shadowColor: string;
  shadowOffsetY: number;
  shadowOpacity: number;
  mask: ImageMaskType;
  glowBlur: number;
  glowColor: string;
  glowOpacity: number;
}

export type ImageMaskType = "none" | "rectangle" | "rounded" | "circle";

export type CleanupToolId =
  | "select"
  | "blur-brush"
  | "pixelate-brush"
  | "cover-patch"
  | "crop";

export type CleanupBrushType = "blur" | "pixelate";

export interface CleanupBrushStroke {
  id: string;
  type: CleanupBrushType;
  points: number[];
  brushSize: number;
  intensity: number;
}

export const COVER_PATCH_PREFIX = "Cover ·";

export const DEFAULT_COVER_PATCH_STYLE = {
  fill: "#ffffff",
  opacity: 1,
  cornerRadius: 8,
  shadowBlur: 12,
  shadowColor: "#000000",
  shadowOffsetY: 4,
  shadowOpacity: 0.2,
} as const;

export interface ImageSourceCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type BackgroundFillType = "solid" | "linear" | "radial";

export interface GradientStop {
  offset: number;
  color: string;
}

export interface StageBackground {
  color: string;
  transparent: boolean;
  fillType?: BackgroundFillType;
  gradientStops?: GradientStop[];
  gradientAngle?: number;
}

interface BaseEditorLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  x: number;
  y: number;
  rotation: number;
}

export interface ImageEditorLayer extends BaseEditorLayer {
  type: "image";
  image: UploadedImage;
  width: number;
  height: number;
  crop?: ImageSourceCrop;
  filters: ImageFilters;
  style: ImageLayerStyle;
  cleanupStrokes?: CleanupBrushStroke[];
}

export type TextAlign = "left" | "center" | "right";

export type TextFontStyle = "normal" | "bold" | "italic" | "bold italic";

export const DEFAULT_TEXT_FONT_FAMILY =
  'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export const TEXT_FONT_FAMILY_OPTIONS = [
  { value: DEFAULT_TEXT_FONT_FAMILY, label: "Sans serif" },
  { value: 'Georgia, "Times New Roman", serif', label: "Serif" },
  { value: '"Courier New", Courier, monospace', label: "Monospace" },
] as const;

export interface TextEditorLayer extends BaseEditorLayer {
  type: "text";
  text: string;
  fontSize: number;
  fill: string;
  width: number;
  fontFamily?: string;
  fontStyle?: TextFontStyle;
  align?: TextAlign;
}

export interface ShapeEditorLayer extends BaseEditorLayer {
  type: "shape";
  shape: ShapeKind;
  fill: string;
  width: number;
  height: number;
  strokeWidth: number;
  strokeColor?: string;
  points?: number[];
  dashed?: boolean;
  arrowHeadSize?: number;
  arrowHeadStyle?: import("@/types/annotationStyle").ArrowHeadStyle;
  doubleHeaded?: boolean;
  lineCap?: import("@/types/annotationStyle").LineCapStyle;
  lineJoin?: import("@/types/annotationStyle").LineJoinStyle;
  tension?: number;
  blendMode?: "normal" | "multiply";
  cornerRadius?: number;
  shadowBlur?: number;
  shadowColor?: string;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowOpacity?: number;
  glowBlur?: number;
  glowColor?: string;
  glowOpacity?: number;
  annotationStyle?: AnnotationStyle;
}

export interface CalloutEditorLayer extends BaseEditorLayer {
  type: "callout";
  calloutType: CalloutKind;
  text: string;
  width: number;
  height: number;
  fill: string;
  textColor: string;
  fontSize: number;
  markerNumber?: number;
  cornerRadius?: number;
  borderColor?: string;
  borderWidth?: number;
  shadowBlur?: number;
  shadowColor?: string;
  shadowOffsetY?: number;
  shadowOpacity?: number;
  annotationStyle?: AnnotationStyle;
}

export type EditorLayer =
  | ImageEditorLayer
  | TextEditorLayer
  | ShapeEditorLayer
  | CalloutEditorLayer;

export interface AdvancedEditorDocument {
  settings: OptimizerSettings;
  layers: EditorLayer[];
  selectedLayerId: string | null;
  stageWidth: number;
  stageHeight: number;
  background: StageBackground;
}

export interface LayerTransformUpdate {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  fontSize?: number;
  points?: number[];
}

export type EditorLayerUpdate = Partial<
  Omit<
    ImageEditorLayer,
    "id" | "type" | "image" | "filters" | "style" | "cleanupStrokes"
  > &
    Omit<TextEditorLayer, "id" | "type"> &
    Omit<ShapeEditorLayer, "id" | "type"> &
    Omit<CalloutEditorLayer, "id" | "type">
> & {
  filters?: Partial<ImageFilters>;
  style?: Partial<ImageLayerStyle>;
  crop?: ImageSourceCrop;
  cleanupStrokes?: CleanupBrushStroke[];
};

export const DEFAULT_IMAGE_FILTERS: ImageFilters = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  blur: 0,
  grayscale: false,
  sepia: false,
};

export const DEFAULT_IMAGE_LAYER_STYLE: ImageLayerStyle = {
  cornerRadius: 0,
  borderWidth: 0,
  borderColor: "#ffffff",
  shadowBlur: 0,
  shadowColor: "#000000",
  shadowOffsetY: 8,
  shadowOpacity: 0.35,
  mask: "none",
  glowBlur: 0,
  glowColor: "#0071e3",
  glowOpacity: 0.65,
};

export const DEFAULT_STAGE_BACKGROUND: StageBackground = {
  color: "#ffffff",
  transparent: true,
  fillType: "solid",
  gradientStops: [
    { offset: 0, color: "#ffffff" },
    { offset: 1, color: "#f5f5f7" },
  ],
  gradientAngle: 180,
};

export function createLayerId(): string {
  return `layer-${crypto.randomUUID()}`;
}

export function getInitialLayerPlacement(
  naturalWidth: number,
  naturalHeight: number,
  stageWidth: number,
  stageHeight: number,
  layerIndex: number,
): Pick<BaseEditorLayer, "x" | "y" | "rotation"> & {
  width: number;
  height: number;
} {
  const maxWidth = stageWidth * 0.75;
  const maxHeight = stageHeight * 0.75;
  const scale = Math.min(maxWidth / naturalWidth, maxHeight / naturalHeight, 1);
  const width = naturalWidth * scale;
  const height = naturalHeight * scale;
  const offset = layerIndex * 24;

  return {
    x: (stageWidth - width) / 2 + offset,
    y: (stageHeight - height) / 2 + offset,
    width,
    height,
    rotation: 0,
  };
}

export function createImageLayer(
  image: UploadedImage,
  stageWidth: number,
  stageHeight: number,
  layerIndex: number,
): ImageEditorLayer {
  const placement = getInitialLayerPlacement(
    image.width,
    image.height,
    stageWidth,
    stageHeight,
    layerIndex,
  );

  return {
    id: createLayerId(),
    type: "image",
    image,
    name: image.name,
    visible: true,
    locked: false,
    opacity: 1,
    filters: { ...DEFAULT_IMAGE_FILTERS },
    style: { ...DEFAULT_IMAGE_LAYER_STYLE },
    crop: createFullImageCrop(image.width, image.height),
    ...placement,
  };
}

export function createTextLayer(
  stageWidth: number,
  stageHeight: number,
  layerIndex: number,
): TextEditorLayer {
  const width = 280;
  const fontSize = 48;

  return createTextLayerAt({
    text: "Edit text",
    x: (stageWidth - width) / 2,
    y: stageHeight / 2 - fontSize / 2,
    width,
    fontSize,
    fill: "#1d1d1f",
    name: `Text ${layerIndex + 1}`,
  });
}

export function createTextLayerAt({
  text,
  x,
  y,
  width = 280,
  fontSize,
  fill,
  name,
  locked = false,
}: {
  text: string;
  x: number;
  y: number;
  width?: number;
  fontSize: number;
  fill: string;
  name: string;
  locked?: boolean;
}): TextEditorLayer {
  return {
    id: createLayerId(),
    type: "text",
    name,
    text,
    fontSize,
    fill,
    fontFamily: DEFAULT_TEXT_FONT_FAMILY,
    fontStyle: "normal",
    align: "left",
    visible: true,
    locked,
    opacity: 1,
    width,
    x,
    y,
    rotation: 0,
  };
}

export function createShapeLayer(
  shape: ShapeKind,
  stageWidth: number,
  stageHeight: number,
  layerIndex: number,
): ShapeEditorLayer {
  const defaults: Partial<
    Record<
      ShapeKind,
      { width: number; height: number; name: string; fill: string }
    >
  > = {
    rectangle: { width: 240, height: 160, name: "Rectangle", fill: "#0071e3" },
    circle: { width: 180, height: 180, name: "Circle", fill: "#34c759" },
    line: { width: 220, height: 120, name: "Line", fill: "#1d1d1f" },
    arrow: { width: 220, height: 120, name: "Arrow", fill: "#1d1d1f" },
    freehand: { width: 1, height: 1, name: "Drawing", fill: "#1d1d1f" },
    highlighter: { width: 1, height: 1, name: "Highlight", fill: "#ffd60a" },
  };

  const config = defaults[shape] ?? defaults.line!;
  const offset = layerIndex * 16;

  return createShapeLayerAt({
    shape,
    name: config.name,
    fill: config.fill,
    width: config.width,
    height: config.height,
    x: (stageWidth - config.width) / 2 + offset,
    y: (stageHeight - config.height) / 2 + offset,
    strokeWidth: shape === "line" || shape === "arrow" ? 4 : 0,
    ...(shape === "line" || shape === "arrow"
      ? { points: [0, 0, config.width, config.height] }
      : {}),
    ...(shape === "highlighter"
      ? { blendMode: "multiply" as const, opacity: 0.4, strokeWidth: 18 }
      : {}),
    ...(shape === "freehand" ? { strokeWidth: 4, tension: 0.45 } : {}),
    ...(shape === "arrow" ? { arrowHeadSize: 14 } : {}),
  });
}

export function createVectorShapeLayer({
  shape,
  x,
  y,
  width,
  height,
  points,
  settings,
  layerIndex,
}: {
  shape: Extract<ShapeKind, "line" | "arrow" | "freehand" | "highlighter">;
  x: number;
  y: number;
  width: number;
  height: number;
  points: number[];
  settings: DrawingToolSettings;
  layerIndex: number;
}): ShapeEditorLayer {
  const names: Record<typeof shape, string> = {
    line: "Line",
    arrow: "Arrow",
    freehand: "Drawing",
    highlighter: "Highlight",
  };

  const shapedStyle = styleForShapeKind(settings, shape);

  return {
    id: createLayerId(),
    type: "shape",
    shape,
    name: `${names[shape]} ${layerIndex + 1}`,
    points,
    width,
    height,
    x,
    y,
    rotation: 0,
    visible: true,
    locked: false,
    ...applyAnnotationStyleToShapeLayer(shapedStyle, shape),
  };
}

export function createCalloutLayer({
  calloutType,
  x,
  y,
  width,
  height,
  settings,
  layerIndex,
  markerNumber,
}: {
  calloutType: CalloutKind;
  x: number;
  y: number;
  width: number;
  height: number;
  settings: DrawingToolSettings;
  layerIndex: number;
  markerNumber?: number;
}): CalloutEditorLayer {
  const labels: Record<CalloutKind, string> = {
    label: "Label",
    "speech-bubble": "Bubble",
    "numbered-marker": "Marker",
  };

  const defaultText =
    calloutType === "numbered-marker"
      ? String(markerNumber ?? layerIndex + 1)
      : calloutType === "label"
        ? "Label"
        : "Note";

  const size =
    calloutType === "numbered-marker"
      ? { width: Math.max(width, 44), height: Math.max(height, 44) }
      : { width, height };

  return {
    id: createLayerId(),
    type: "callout",
    calloutType,
    name: `${labels[calloutType]} ${layerIndex + 1}`,
    text: defaultText,
    markerNumber,
    visible: true,
    locked: false,
    x,
    y,
    rotation: 0,
    ...size,
    ...applyAnnotationStyleToCalloutLayer(settings, calloutType),
  };
}

export function createShapeLayerAt({
  shape,
  x,
  y,
  width,
  height,
  fill,
  name,
  strokeWidth = 0,
  locked = false,
  cornerRadius,
  shadowStyle,
  points,
  dashed,
  arrowHeadSize,
  tension,
  blendMode,
  opacity = 1,
  strokeColor,
}: {
  shape: ShapeKind;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  name: string;
  strokeWidth?: number;
  locked?: boolean;
  cornerRadius?: number;
  shadowStyle?: {
    shadowBlur: number;
    shadowColor: string;
    shadowOffsetY: number;
    shadowOpacity: number;
  };
  points?: number[];
  dashed?: boolean;
  arrowHeadSize?: number;
  tension?: number;
  blendMode?: "normal" | "multiply";
  opacity?: number;
  strokeColor?: string;
}): ShapeEditorLayer {
  return {
    id: createLayerId(),
    type: "shape",
    shape,
    name,
    fill,
    strokeWidth,
    visible: true,
    locked,
    opacity,
    width,
    height,
    x,
    y,
    rotation: 0,
    ...(cornerRadius !== undefined ? { cornerRadius } : {}),
    ...(shadowStyle ?? {}),
    ...(points !== undefined ? { points } : {}),
    ...(dashed !== undefined ? { dashed } : {}),
    ...(arrowHeadSize !== undefined ? { arrowHeadSize } : {}),
    ...(tension !== undefined ? { tension } : {}),
    ...(blendMode !== undefined ? { blendMode } : {}),
    ...(strokeColor !== undefined ? { strokeColor } : {}),
  };
}

export function createCoverPatchLayer({
  x,
  y,
  width,
  height,
  layerIndex,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  layerIndex: number;
}): ShapeEditorLayer {
  return createShapeLayerAt({
    shape: "rectangle",
    name: `${COVER_PATCH_PREFIX} Patch ${layerIndex + 1}`,
    x,
    y,
    width,
    height,
    fill: DEFAULT_COVER_PATCH_STYLE.fill,
    cornerRadius: DEFAULT_COVER_PATCH_STYLE.cornerRadius,
    shadowStyle: {
      shadowBlur: DEFAULT_COVER_PATCH_STYLE.shadowBlur,
      shadowColor: DEFAULT_COVER_PATCH_STYLE.shadowColor,
      shadowOffsetY: DEFAULT_COVER_PATCH_STYLE.shadowOffsetY,
      shadowOpacity: DEFAULT_COVER_PATCH_STYLE.shadowOpacity,
    },
  });
}

export function isCoverPatchLayer(layer: EditorLayer): boolean {
  return (
    layer.type === "shape" &&
    layer.shape === "rectangle" &&
    layer.name.startsWith(COVER_PATCH_PREFIX)
  );
}

export function isVectorShape(layer: EditorLayer): layer is ShapeEditorLayer {
  return (
    layer.type === "shape" &&
    (layer.shape === "line" ||
      layer.shape === "arrow" ||
      layer.shape === "freehand" ||
      layer.shape === "highlighter")
  );
}

export function getLayerTypeLabel(layer: EditorLayer): string {
  switch (layer.type) {
    case "image":
      return "Image";
    case "text":
      return "Text";
    case "callout":
      if (layer.calloutType === "numbered-marker") {
        return "Marker";
      }
      if (layer.calloutType === "speech-bubble") {
        return "Bubble";
      }
      return "Label";
    case "shape":
      if (isCoverPatchLayer(layer)) {
        return "Cover";
      }
      if (layer.shape === "freehand") {
        return "Draw";
      }
      if (layer.shape === "highlighter") {
        return "Highlight";
      }
      return layer.shape.charAt(0).toUpperCase() + layer.shape.slice(1);
  }
}
