import type {
  ExportFormat,
  OptimizerSettings,
  UploadedImage,
} from "@/types/optimizer";
import { createFullImageCrop } from "@/lib/konva/imageCrop";

export type AppMode = "optimizer" | "advanced";

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

export type ShapeKind = "rectangle" | "circle" | "line";

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
}

export interface TextEditorLayer extends BaseEditorLayer {
  type: "text";
  text: string;
  fontSize: number;
  fill: string;
  width: number;
}

export interface ShapeEditorLayer extends BaseEditorLayer {
  type: "shape";
  shape: ShapeKind;
  fill: string;
  width: number;
  height: number;
  strokeWidth: number;
  shadowBlur?: number;
  shadowColor?: string;
  shadowOffsetY?: number;
  shadowOpacity?: number;
}

export type EditorLayer = ImageEditorLayer | TextEditorLayer | ShapeEditorLayer;

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
}

export type EditorLayerUpdate = Partial<
  Omit<ImageEditorLayer, "id" | "type" | "image" | "filters" | "style"> &
    Omit<TextEditorLayer, "id" | "type"> &
    Omit<ShapeEditorLayer, "id" | "type">
> & {
  filters?: Partial<ImageFilters>;
  style?: Partial<ImageLayerStyle>;
  crop?: ImageSourceCrop;
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
    text: "Edit me",
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
  const defaults: Record<
    ShapeKind,
    { width: number; height: number; name: string; fill: string }
  > = {
    rectangle: { width: 240, height: 160, name: "Rectangle", fill: "#0071e3" },
    circle: { width: 180, height: 180, name: "Circle", fill: "#34c759" },
    line: { width: 220, height: 0, name: "Line", fill: "#1d1d1f" },
  };

  const config = defaults[shape];
  const offset = layerIndex * 16;

  return createShapeLayerAt({
    shape,
    name: config.name,
    fill: config.fill,
    width: config.width,
    height: config.height,
    x: (stageWidth - config.width) / 2 + offset,
    y: (stageHeight - config.height) / 2 + offset,
    strokeWidth: shape === "line" ? 4 : 0,
  });
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
  shadowStyle,
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
  shadowStyle?: {
    shadowBlur: number;
    shadowColor: string;
    shadowOffsetY: number;
    shadowOpacity: number;
  };
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
    opacity: 1,
    width,
    height,
    x,
    y,
    rotation: 0,
    ...(shadowStyle ?? {}),
  };
}

export function getLayerTypeLabel(layer: EditorLayer): string {
  switch (layer.type) {
    case "image":
      return "Image";
    case "text":
      return "Text";
    case "shape":
      return layer.shape.charAt(0).toUpperCase() + layer.shape.slice(1);
  }
}
