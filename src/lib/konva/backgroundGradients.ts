import type { StageBackground } from "@/types/konvaEditor";
import { DEFAULT_STAGE_BACKGROUND } from "@/types/konvaEditor";

export interface BackgroundGradientPreset {
  id: string;
  label: string;
  background: Pick<
    StageBackground,
    "fillType" | "color" | "gradientStops" | "gradientAngle"
  >;
}

export const BACKGROUND_GRADIENT_PRESETS: BackgroundGradientPreset[] = [
  {
    id: "sunset",
    label: "Sunset",
    background: {
      fillType: "linear",
      color: "#ff7e5f",
      gradientAngle: 135,
      gradientStops: [
        { offset: 0, color: "#ff7e5f" },
        { offset: 1, color: "#feb47b" },
      ],
    },
  },
  {
    id: "ocean",
    label: "Ocean",
    background: {
      fillType: "linear",
      color: "#0071e3",
      gradientAngle: 180,
      gradientStops: [
        { offset: 0, color: "#56ccf2" },
        { offset: 1, color: "#0071e3" },
      ],
    },
  },
  {
    id: "purple-haze",
    label: "Purple haze",
    background: {
      fillType: "linear",
      color: "#667eea",
      gradientAngle: 160,
      gradientStops: [
        { offset: 0, color: "#667eea" },
        { offset: 1, color: "#764ba2" },
      ],
    },
  },
  {
    id: "forest",
    label: "Forest",
    background: {
      fillType: "linear",
      color: "#134e5e",
      gradientAngle: 145,
      gradientStops: [
        { offset: 0, color: "#134e5e" },
        { offset: 1, color: "#71b280" },
      ],
    },
  },
  {
    id: "midnight",
    label: "Midnight",
    background: {
      fillType: "radial",
      color: "#0f2027",
      gradientAngle: 0,
      gradientStops: [
        { offset: 0, color: "#2c5364" },
        { offset: 1, color: "#0f2027" },
      ],
    },
  },
  {
    id: "rose-gold",
    label: "Rose gold",
    background: {
      fillType: "radial",
      color: "#f4c4c2",
      gradientAngle: 0,
      gradientStops: [
        { offset: 0, color: "#ffe8e0" },
        { offset: 1, color: "#e8a598" },
      ],
    },
  },
];

export function normalizeStageBackground(
  background: StageBackground,
): Required<
  Pick<
    StageBackground,
    "transparent" | "fillType" | "color" | "gradientStops" | "gradientAngle"
  >
> {
  return {
    transparent: background.transparent,
    fillType: background.fillType ?? "solid",
    color: background.color ?? DEFAULT_STAGE_BACKGROUND.color,
    gradientStops:
      background.gradientStops?.length && background.gradientStops.length > 0
        ? background.gradientStops
        : [
            { offset: 0, color: background.color ?? "#ffffff" },
            { offset: 1, color: background.color ?? "#ffffff" },
          ],
    gradientAngle: background.gradientAngle ?? 180,
  };
}

function getLinearGradientPoints(
  width: number,
  height: number,
  angleDegrees: number,
): {
  start: { x: number; y: number };
  end: { x: number; y: number };
} {
  const angleRadians = ((angleDegrees - 90) * Math.PI) / 180;
  const centerX = width / 2;
  const centerY = height / 2;
  const length = Math.sqrt(width * width + height * height) / 2;
  const dx = Math.cos(angleRadians) * length;
  const dy = Math.sin(angleRadians) * length;

  return {
    start: { x: centerX - dx, y: centerY - dy },
    end: { x: centerX + dx, y: centerY + dy },
  };
}

function getGradientColorStops(
  background: StageBackground,
): (number | string)[] {
  const stops = normalizeStageBackground(background).gradientStops ?? [];
  const flat: (number | string)[] = [];

  for (const stop of stops) {
    flat.push(stop.offset, stop.color);
  }

  return flat;
}

export function getStageBackgroundFillProps(
  background: StageBackground,
  width: number,
  height: number,
): Record<string, unknown> {
  const normalized = normalizeStageBackground(background);

  if (normalized.fillType === "solid") {
    return { fill: normalized.color };
  }

  if (normalized.fillType === "linear") {
    const { start, end } = getLinearGradientPoints(
      width,
      height,
      normalized.gradientAngle,
    );

    return {
      fillLinearGradientStartPoint: start,
      fillLinearGradientEndPoint: end,
      fillLinearGradientColorStops: getGradientColorStops(normalized),
    };
  }

  const radius = Math.max(width, height) / 2;

  return {
    fillRadialGradientStartPoint: { x: width / 2, y: height / 2 },
    fillRadialGradientEndPoint: { x: width / 2, y: height / 2 },
    fillRadialGradientStartRadius: 0,
    fillRadialGradientEndRadius: radius,
    fillRadialGradientColorStops: getGradientColorStops(normalized),
  };
}
