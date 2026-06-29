import type { DrawRect, SourceDimensions } from "@/lib/render/types";
import type { OptimizerSettings, UploadedImage } from "@/types/optimizer";

/** Source region in original image pixel coordinates. */
export interface SourceCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Maps a source crop into a destination rectangle on the output frame. */
export interface SourceTransform {
  sourceCrop: SourceCrop;
  destination: DrawRect;
}

/** Reserved for future multi-layer editing. */
export interface EditorLayer {
  id: string;
  type: "image";
  name: string;
  visible: boolean;
  opacity: number;
  transform: SourceTransform;
}

export interface EditorDocument {
  image: UploadedImage;
  settings: OptimizerSettings;
  /**
   * Explicit crop/placement override. When null or omitted, fit mode defaults
   * are computed at render time.
   */
  transform: SourceTransform | null;
  /** Optional layer stack for future editor features. */
  layers?: EditorLayer[];
}

export function createFullSourceCrop(source: SourceDimensions): SourceCrop {
  return {
    x: 0,
    y: 0,
    width: source.width,
    height: source.height,
  };
}

export function buildEditorDocument(
  image: UploadedImage,
  settings: OptimizerSettings,
  transform: SourceTransform | null = null,
): EditorDocument {
  return {
    image,
    settings,
    transform,
  };
}
