import type { CleanupToolId } from "@/types/konvaEditor";

export const CLEANUP_TOOL_OPTIONS: {
  id: CleanupToolId;
  label: string;
  description: string;
}[] = [
  {
    id: "select",
    label: "Select",
    description: "Move and resize layers normally",
  },
  {
    id: "blur-brush",
    label: "Blur brush",
    description: "Paint to blur sensitive areas on the selected image",
  },
  {
    id: "pixelate-brush",
    label: "Pixelate brush",
    description: "Paint to pixelate details on the selected image",
  },
  {
    id: "cover-patch",
    label: "Cover patch",
    description: "Draw a rectangle to cover labels, tags, or text",
  },
  {
    id: "crop",
    label: "Crop",
    description: "Trim the selected image layer",
  },
];

export const CLEANUP_TOOL_HINTS: Record<CleanupToolId, string> = {
  select: "Select a layer to move, resize, or edit its properties.",
  "blur-brush":
    "Select an image layer, then paint over areas you want to blur. Adjust brush size and blur strength below.",
  "pixelate-brush":
    "Select an image layer, then paint to pixelate details. Adjust brush size and pixel block size below.",
  "cover-patch":
    "Drag on the canvas to draw a cover rectangle. Customize fill, opacity, corners, and shadow in edit controls.",
  crop: "Select an image layer, then drag handles to crop. Use reset crop to restore the full image.",
};

export const DEFAULT_CLEANUP_BRUSH_SIZE = 32;
export const DEFAULT_BLUR_INTENSITY = 12;
export const DEFAULT_PIXELATE_INTENSITY = 10;
export const MIN_COVER_PATCH_SIZE = 8;
