import type { OutputWidthPreset } from "@/types/optimizer";
import {
  MAX_OUTPUT_WIDTH,
  MIN_OUTPUT_WIDTH,
} from "@/types/optimizer";

export const OUTPUT_WIDTH_OPTIONS: {
  value: OutputWidthPreset;
  label: string;
  description: string;
}[] = [
  {
    value: "1080",
    label: "1080px",
    description: "Full HD width",
  },
  {
    value: "1440",
    label: "1440px",
    description: "QHD width",
  },
  {
    value: "1920",
    label: "1920px",
    description: "1080p width",
  },
  {
    value: "custom",
    label: "Custom",
    description: "Set your own output width",
  },
];

export function resolveOutputWidth(
  preset: OutputWidthPreset,
  customWidth: number,
): number {
  if (preset === "custom") {
    const normalizedWidth = Number.isFinite(customWidth)
      ? Math.round(customWidth)
      : MIN_OUTPUT_WIDTH;

    return Math.min(
      MAX_OUTPUT_WIDTH,
      Math.max(MIN_OUTPUT_WIDTH, normalizedWidth),
    );
  }

  return Number.parseInt(preset, 10);
}
