import type {
  AnnotationStyle,
  AnnotationStylePresetId,
  ArrowHeadStyle,
  StrokeDashStyle,
} from "@/types/annotationStyle";
import {
  ANNOTATION_STYLE_PRESETS,
  DEFAULT_ANNOTATION_GLOW,
  DEFAULT_ANNOTATION_SHADOW,
  DEFAULT_ANNOTATION_STYLE,
  LAST_ANNOTATION_STYLE_STORAGE_KEY,
  RECENT_ANNOTATION_COLORS_STORAGE_KEY,
} from "@/types/annotationStyle";
import type {
  CalloutEditorLayer,
  CalloutKind,
  ShapeEditorLayer,
  ShapeKind,
} from "@/types/konvaEditor";

export function normalizeAnnotationStyle(
  partial?: Partial<AnnotationStyle> | null,
): AnnotationStyle {
  if (!partial) {
    return structuredClone(DEFAULT_ANNOTATION_STYLE);
  }

  return {
    ...DEFAULT_ANNOTATION_STYLE,
    ...partial,
    shadow: {
      ...DEFAULT_ANNOTATION_SHADOW,
      ...partial.shadow,
    },
    glow: {
      ...DEFAULT_ANNOTATION_GLOW,
      ...partial.glow,
    },
  };
}

export function getStrokeDashPattern(
  strokeDash: StrokeDashStyle,
): number[] | undefined {
  switch (strokeDash) {
    case "dashed":
      return [10, 6];
    case "dotted":
      return [2, 6];
    default:
      return undefined;
  }
}

export function legacyDashedToStrokeDash(
  dashed?: boolean,
): StrokeDashStyle {
  return dashed ? "dashed" : "solid";
}

export function resolveShapeAnnotationStyle(
  layer: ShapeEditorLayer,
): AnnotationStyle {
  if (layer.annotationStyle) {
    return normalizeAnnotationStyle(layer.annotationStyle);
  }

  return normalizeAnnotationStyle({
    fill: layer.fill,
    strokeColor: layer.strokeColor ?? layer.fill,
    strokeWidth: layer.strokeWidth,
    strokeDash: legacyDashedToStrokeDash(layer.dashed),
    opacity: layer.opacity,
    lineCap: layer.lineCap ?? "round",
    lineJoin: layer.lineJoin ?? "round",
    arrowHeadSize: layer.arrowHeadSize ?? DEFAULT_ANNOTATION_STYLE.arrowHeadSize,
    arrowHeadStyle: layer.arrowHeadStyle ?? "filled",
    doubleHeaded: layer.doubleHeaded ?? false,
    cornerRadius: layer.cornerRadius ?? 0,
    blendMode: layer.blendMode ?? "normal",
    tension: layer.tension ?? DEFAULT_ANNOTATION_STYLE.tension,
    shadow: {
      enabled: (layer.shadowBlur ?? 0) > 0,
      blur: layer.shadowBlur ?? DEFAULT_ANNOTATION_SHADOW.blur,
      offsetX: layer.shadowOffsetX ?? 0,
      offsetY: layer.shadowOffsetY ?? DEFAULT_ANNOTATION_SHADOW.offsetY,
      color: layer.shadowColor ?? DEFAULT_ANNOTATION_SHADOW.color,
      opacity: layer.shadowOpacity ?? DEFAULT_ANNOTATION_SHADOW.opacity,
    },
    glow: {
      enabled: (layer.glowBlur ?? 0) > 0,
      color: layer.glowColor ?? DEFAULT_ANNOTATION_GLOW.color,
      blur: layer.glowBlur ?? DEFAULT_ANNOTATION_GLOW.blur,
      opacity: layer.glowOpacity ?? DEFAULT_ANNOTATION_GLOW.opacity,
    },
  });
}

export function resolveCalloutAnnotationStyle(
  layer: CalloutEditorLayer,
): AnnotationStyle {
  if (layer.annotationStyle) {
    return normalizeAnnotationStyle(layer.annotationStyle);
  }

  return normalizeAnnotationStyle({
    fill: layer.fill,
    strokeColor: layer.borderColor ?? DEFAULT_ANNOTATION_STYLE.borderColor,
    strokeWidth: layer.borderWidth ?? DEFAULT_ANNOTATION_STYLE.borderWidth,
    textColor: layer.textColor,
    fontSize: layer.fontSize,
    cornerRadius: layer.cornerRadius ?? DEFAULT_ANNOTATION_STYLE.cornerRadius,
    opacity: layer.opacity,
    shadow: {
      enabled: (layer.shadowBlur ?? 8) > 0,
      blur: layer.shadowBlur ?? 8,
      offsetX: 0,
      offsetY: layer.shadowOffsetY ?? 2,
      color: layer.shadowColor ?? "#000000",
      opacity: layer.shadowOpacity ?? 0.12,
    },
  });
}

export function applyAnnotationStyleToShapeLayer(
  style: AnnotationStyle,
  shape: ShapeKind,
): Pick<
  ShapeEditorLayer,
  | "annotationStyle"
  | "fill"
  | "strokeColor"
  | "strokeWidth"
  | "dashed"
  | "lineCap"
  | "lineJoin"
  | "arrowHeadSize"
  | "arrowHeadStyle"
  | "doubleHeaded"
  | "cornerRadius"
  | "blendMode"
  | "tension"
  | "opacity"
  | "shadowBlur"
  | "shadowColor"
  | "shadowOffsetX"
  | "shadowOffsetY"
  | "shadowOpacity"
  | "glowBlur"
  | "glowColor"
  | "glowOpacity"
> {
  const isHighlighter = shape === "highlighter";
  const strokeWidth = isHighlighter
    ? Math.max(style.strokeWidth * 3, 12)
    : style.strokeWidth;

  return {
    annotationStyle: normalizeAnnotationStyle(style),
    fill: isHighlighter ? style.fill || "#ffd60a" : style.fill,
    strokeColor: style.strokeColor,
    strokeWidth,
    dashed: style.strokeDash === "dashed",
    lineCap: style.lineCap,
    lineJoin: style.lineJoin,
    arrowHeadSize: style.arrowHeadSize,
    arrowHeadStyle: style.arrowHeadStyle,
    doubleHeaded: style.doubleHeaded,
    cornerRadius: style.cornerRadius,
    blendMode: style.blendMode,
    tension: style.tension,
    opacity: style.opacity,
    shadowBlur: style.shadow.enabled ? style.shadow.blur : 0,
    shadowColor: style.shadow.color,
    shadowOffsetX: style.shadow.offsetX,
    shadowOffsetY: style.shadow.offsetY,
    shadowOpacity: style.shadow.opacity,
    glowBlur: style.glow.enabled ? style.glow.blur : 0,
    glowColor: style.glow.color,
    glowOpacity: style.glow.opacity,
  };
}

export function applyAnnotationStyleToCalloutLayer(
  style: AnnotationStyle,
  calloutType: CalloutKind,
): Pick<
  CalloutEditorLayer,
  | "annotationStyle"
  | "fill"
  | "textColor"
  | "fontSize"
  | "cornerRadius"
  | "borderColor"
  | "borderWidth"
  | "opacity"
  | "shadowBlur"
  | "shadowColor"
  | "shadowOffsetY"
  | "shadowOpacity"
> {
  return {
    annotationStyle: normalizeAnnotationStyle(style),
    fill: style.fill,
    textColor: style.textColor,
    fontSize:
      calloutType === "numbered-marker"
        ? Math.max(style.fontSize, 18)
        : style.fontSize,
    cornerRadius:
      calloutType === "label" ? 999 : style.cornerRadius,
    borderColor: style.borderColor,
    borderWidth: style.borderWidth,
    opacity: style.opacity,
    shadowBlur: style.shadow.enabled ? style.shadow.blur : 0,
    shadowColor: style.shadow.color,
    shadowOffsetY: style.shadow.offsetY,
    shadowOpacity: style.shadow.opacity,
  };
}

export function getEffectiveStrokeColor(style: AnnotationStyle): string {
  return style.strokeColor || style.fill;
}

export interface KonvaEffectProps {
  shadowBlur?: number;
  shadowColor?: string;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowOpacity?: number;
}

export function getKonvaEffectProps(style: AnnotationStyle): KonvaEffectProps {
  const props: KonvaEffectProps = {};

  if (style.shadow.enabled && style.shadow.blur > 0) {
    props.shadowBlur = style.shadow.blur;
    props.shadowColor = style.shadow.color;
    props.shadowOffsetX = style.shadow.offsetX;
    props.shadowOffsetY = style.shadow.offsetY;
    props.shadowOpacity = style.shadow.opacity;
  }

  if (style.glow.enabled && style.glow.blur > 0) {
    props.shadowBlur = Math.max(
      props.shadowBlur ?? 0,
      style.glow.blur,
    );
    props.shadowColor = style.glow.color;
    props.shadowOffsetX = 0;
    props.shadowOffsetY = 0;
    props.shadowOpacity = Math.max(
      props.shadowOpacity ?? 0,
      style.glow.opacity,
    );
  }

  return props;
}

export function getArrowHeadDimensions(
  style: AnnotationStyle,
): { pointerLength: number; pointerWidth: number; fill: string } {
  const pointerLength = style.arrowHeadSize;
  let pointerWidth = style.arrowHeadSize;

  if (style.arrowHeadStyle === "triangle") {
    pointerWidth = Math.max(8, style.arrowHeadSize * 0.75);
  } else if (style.arrowHeadStyle === "open") {
    pointerWidth = Math.max(10, style.arrowHeadSize * 1.1);
  }

  const fill =
    style.arrowHeadStyle === "open"
      ? "transparent"
      : getEffectiveStrokeColor(style);

  return { pointerLength, pointerWidth, fill };
}

export function getHighlighterStrokeWidth(style: AnnotationStyle): number {
  return Math.max(style.strokeWidth * 3, 12);
}

export function loadLastAnnotationStyle(): AnnotationStyle {
  if (typeof window === "undefined") {
    return normalizeAnnotationStyle();
  }

  try {
    const raw = window.localStorage.getItem(LAST_ANNOTATION_STYLE_STORAGE_KEY);
    if (!raw) {
      return normalizeAnnotationStyle();
    }

    return normalizeAnnotationStyle(JSON.parse(raw) as Partial<AnnotationStyle>);
  } catch {
    return normalizeAnnotationStyle();
  }
}

export function saveLastAnnotationStyle(style: AnnotationStyle): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      LAST_ANNOTATION_STYLE_STORAGE_KEY,
      JSON.stringify(normalizeAnnotationStyle(style)),
    );
  } catch {
    // ignore quota errors
  }
}

export function loadRecentAnnotationColors(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(
      RECENT_ANNOTATION_COLORS_STORAGE_KEY,
    );
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.slice(0, 8) : [];
  } catch {
    return [];
  }
}

export function trackRecentAnnotationColor(color: string): string[] {
  const normalized = color.toLowerCase();
  const previous = loadRecentAnnotationColors().filter(
    (entry) => entry.toLowerCase() !== normalized,
  );
  const next = [color, ...previous].slice(0, 8);

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        RECENT_ANNOTATION_COLORS_STORAGE_KEY,
        JSON.stringify(next),
      );
    } catch {
      // ignore
    }
  }

  return next;
}

export function applyAnnotationStylePreset(
  presetId: AnnotationStylePresetId,
  current: AnnotationStyle,
): AnnotationStyle {
  const preset = ANNOTATION_STYLE_PRESETS[presetId];
  return normalizeAnnotationStyle({
    ...current,
    ...preset.style,
    shadow: {
      ...current.shadow,
      ...(preset.style.shadow ?? {}),
    },
    glow: {
      ...current.glow,
      ...(preset.style.glow ?? {}),
    },
  });
}

export function styleForShapeKind(
  base: AnnotationStyle,
  shape: ShapeKind,
): AnnotationStyle {
  if (shape === "highlighter") {
    return normalizeAnnotationStyle({
      ...base,
      fill: base.fill === DEFAULT_ANNOTATION_STYLE.fill ? "#ffd60a" : base.fill,
      strokeColor:
        base.strokeColor === DEFAULT_ANNOTATION_STYLE.strokeColor
          ? "#ffd60a"
          : base.strokeColor,
      opacity: base.opacity === 1 ? 0.45 : base.opacity,
      blendMode: "multiply",
    });
  }

  return normalizeAnnotationStyle(base);
}

export function migrateLegacyDrawingSettings(
  legacy: Record<string, unknown>,
): AnnotationStyle {
  return normalizeAnnotationStyle({
    fill: (legacy.calloutFill as string) ?? (legacy.strokeColor as string),
    strokeColor: legacy.strokeColor as string,
    strokeWidth: legacy.strokeWidth as number,
    strokeDash: legacy.dashed ? "dashed" : "solid",
    opacity: (legacy.opacity as number) ?? (legacy.highlighterOpacity as number),
    textColor: legacy.calloutTextColor as string,
    tension: legacy.freehandTension as number,
    arrowHeadSize: legacy.arrowHeadSize as number,
  });
}

export function arrowHeadStyleLabel(style: ArrowHeadStyle): string {
  switch (style) {
    case "open":
      return "Open";
    case "triangle":
      return "Triangle";
    default:
      return "Filled";
  }
}
