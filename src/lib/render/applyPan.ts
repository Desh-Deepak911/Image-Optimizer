import type { SourceDimensions } from "@/lib/render/types";
import type { SourceTransform } from "@/types/editor";
import { clampSourceCrop } from "@/lib/render/computeTransform";
import type { FitMode } from "@/types/optimizer";

export interface PanDelta {
  dx: number;
  dy: number;
}

export function applyPanDelta(
  transform: SourceTransform,
  fitMode: FitMode,
  delta: PanDelta,
  source: SourceDimensions,
): SourceTransform {
  if (fitMode === "cover") {
    const sourceDx =
      (delta.dx * transform.sourceCrop.width) / transform.destination.width;
    const sourceDy =
      (delta.dy * transform.sourceCrop.height) / transform.destination.height;

    return {
      sourceCrop: clampSourceCrop(
        {
          x: transform.sourceCrop.x - sourceDx,
          y: transform.sourceCrop.y - sourceDy,
          width: transform.sourceCrop.width,
          height: transform.sourceCrop.height,
        },
        source,
      ),
      destination: transform.destination,
    };
  }

  return {
    sourceCrop: transform.sourceCrop,
    destination: {
      x: transform.destination.x + delta.dx,
      y: transform.destination.y + delta.dy,
      width: transform.destination.width,
      height: transform.destination.height,
    },
  };
}
