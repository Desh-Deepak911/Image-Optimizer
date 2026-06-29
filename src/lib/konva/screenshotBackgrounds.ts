import type { StageBackground } from "@/types/konvaEditor";

export interface ScreenshotBackgroundPreset {
  id: string;
  label: string;
  background: StageBackground;
}

export const SCREENSHOT_BACKGROUND_PRESETS: ScreenshotBackgroundPreset[] = [
  {
    id: "clean-white",
    label: "Clean white",
    background: {
      transparent: false,
      fillType: "solid",
      color: "#ffffff",
      gradientStops: [
        { offset: 0, color: "#ffffff" },
        { offset: 1, color: "#ffffff" },
      ],
      gradientAngle: 180,
    },
  },
  {
    id: "soft-gray",
    label: "Soft gray",
    background: {
      transparent: false,
      fillType: "solid",
      color: "#f5f5f7",
      gradientStops: [
        { offset: 0, color: "#f5f5f7" },
        { offset: 1, color: "#f5f5f7" },
      ],
      gradientAngle: 180,
    },
  },
  {
    id: "studio-light",
    label: "Studio light",
    background: {
      transparent: false,
      fillType: "linear",
      color: "#ffffff",
      gradientAngle: 180,
      gradientStops: [
        { offset: 0, color: "#ffffff" },
        { offset: 1, color: "#ececf1" },
      ],
    },
  },
  {
    id: "cool-mist",
    label: "Cool mist",
    background: {
      transparent: false,
      fillType: "linear",
      color: "#eef2f7",
      gradientAngle: 145,
      gradientStops: [
        { offset: 0, color: "#f8fafc" },
        { offset: 1, color: "#e3e9f2" },
      ],
    },
  },
  {
    id: "warm-paper",
    label: "Warm paper",
    background: {
      transparent: false,
      fillType: "linear",
      color: "#faf7f2",
      gradientAngle: 160,
      gradientStops: [
        { offset: 0, color: "#fffdf9" },
        { offset: 1, color: "#f1ebe3" },
      ],
    },
  },
  {
    id: "dark-stage",
    label: "Dark stage",
    background: {
      transparent: false,
      fillType: "radial",
      color: "#111111",
      gradientStops: [
        { offset: 0, color: "#2c2c2e" },
        { offset: 1, color: "#111111" },
      ],
      gradientAngle: 0,
    },
  },
];

export function getScreenshotBackgroundPreset(
  presetId: string,
): ScreenshotBackgroundPreset | undefined {
  return SCREENSHOT_BACKGROUND_PRESETS.find((preset) => preset.id === presetId);
}
