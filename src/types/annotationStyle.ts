export type StrokeDashStyle = "solid" | "dashed" | "dotted";
export type LineCapStyle = "round" | "square";
export type LineJoinStyle = "round" | "miter";
export type ArrowHeadStyle = "filled" | "open" | "triangle";

export interface AnnotationShadowStyle {
  enabled: boolean;
  blur: number;
  offsetX: number;
  offsetY: number;
  color: string;
  opacity: number;
}

export interface AnnotationGlowStyle {
  enabled: boolean;
  color: string;
  blur: number;
  opacity: number;
}

/** Unified styling for lines, arrows, shapes, and callouts. */
export interface AnnotationStyle {
  fill: string;
  strokeColor: string;
  strokeWidth: number;
  strokeDash: StrokeDashStyle;
  opacity: number;
  lineCap: LineCapStyle;
  lineJoin: LineJoinStyle;
  shadow: AnnotationShadowStyle;
  glow: AnnotationGlowStyle;
  arrowHeadSize: number;
  arrowHeadStyle: ArrowHeadStyle;
  doubleHeaded: boolean;
  textColor: string;
  fontSize: number;
  cornerRadius: number;
  borderColor: string;
  borderWidth: number;
  blendMode: "normal" | "multiply";
  tension: number;
}

export const ANNOTATION_COLOR_PALETTE: {
  id: string;
  label: string;
  value: string;
}[] = [
  { id: "black", label: "Black", value: "#1d1d1f" },
  { id: "white", label: "White", value: "#ffffff" },
  { id: "gray", label: "Gray", value: "#8e8e93" },
  { id: "red", label: "Red", value: "#ff3b30" },
  { id: "orange", label: "Orange", value: "#ff9500" },
  { id: "yellow", label: "Yellow", value: "#ffd60a" },
  { id: "green", label: "Green", value: "#34c759" },
  { id: "mint", label: "Mint", value: "#63e6e2" },
  { id: "cyan", label: "Cyan", value: "#32ade6" },
  { id: "blue", label: "Blue", value: "#0071e3" },
  { id: "indigo", label: "Indigo", value: "#5856d6" },
  { id: "purple", label: "Purple", value: "#af52de" },
  { id: "pink", label: "Pink", value: "#ff2d55" },
];

export const DEFAULT_ANNOTATION_SHADOW: AnnotationShadowStyle = {
  enabled: false,
  blur: 8,
  offsetX: 0,
  offsetY: 4,
  color: "#000000",
  opacity: 0.25,
};

export const DEFAULT_ANNOTATION_GLOW: AnnotationGlowStyle = {
  enabled: false,
  color: "#0071e3",
  blur: 16,
  opacity: 0.65,
};

export const DEFAULT_ANNOTATION_STYLE: AnnotationStyle = {
  fill: "#1d1d1f",
  strokeColor: "#1d1d1f",
  strokeWidth: 4,
  strokeDash: "solid",
  opacity: 1,
  lineCap: "round",
  lineJoin: "round",
  shadow: { ...DEFAULT_ANNOTATION_SHADOW },
  glow: { ...DEFAULT_ANNOTATION_GLOW },
  arrowHeadSize: 14,
  arrowHeadStyle: "filled",
  doubleHeaded: false,
  textColor: "#1d1d1f",
  fontSize: 16,
  cornerRadius: 12,
  borderColor: "#1d1d1f",
  borderWidth: 1.5,
  blendMode: "normal",
  tension: 0.45,
};

export type AnnotationStylePresetId =
  | "warning"
  | "success"
  | "info"
  | "highlight"
  | "neutral";

export const ANNOTATION_STYLE_PRESETS: Record<
  AnnotationStylePresetId,
  { label: string; style: Partial<AnnotationStyle> }
> = {
  warning: {
    label: "Warning",
    style: {
      fill: "#ff3b30",
      strokeColor: "#ff3b30",
      textColor: "#ffffff",
      borderColor: "#ff3b30",
    },
  },
  success: {
    label: "Success",
    style: {
      fill: "#34c759",
      strokeColor: "#34c759",
      textColor: "#ffffff",
      borderColor: "#34c759",
    },
  },
  info: {
    label: "Info",
    style: {
      fill: "#0071e3",
      strokeColor: "#0071e3",
      textColor: "#ffffff",
      borderColor: "#0071e3",
    },
  },
  highlight: {
    label: "Highlight",
    style: {
      fill: "#ffd60a",
      strokeColor: "#ffd60a",
      opacity: 0.45,
      blendMode: "multiply",
      strokeWidth: 12,
    },
  },
  neutral: {
    label: "Neutral",
    style: {
      fill: "#8e8e93",
      strokeColor: "#8e8e93",
      textColor: "#1d1d1f",
      borderColor: "#8e8e93",
    },
  },
};

export const LAST_ANNOTATION_STYLE_STORAGE_KEY =
  "image-optimizer-annotation-style-last";
export const RECENT_ANNOTATION_COLORS_STORAGE_KEY =
  "image-optimizer-annotation-recent-colors";
