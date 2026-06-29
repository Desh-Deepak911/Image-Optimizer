import {
  getContainDrawRect,
  getCoverDrawRect,
  getFrameDimensions,
} from "@/lib/render/geometry";
import type { FrameDimensions, SourceDimensions } from "@/lib/render/types";
import type { SourceCrop, SourceTransform } from "@/types/editor";
import { createFullSourceCrop } from "@/types/editor";
import type { AspectRatio, FitMode } from "@/types/optimizer";

export interface ComputeTransformInput {
  source: SourceDimensions;
  frame: FrameDimensions;
  fitMode: FitMode;
}

export interface ComputeDefaultTransformInput extends ComputeTransformInput {
  aspectRatio: AspectRatio;
  outputWidth: number;
}

function getCoverSourceCrop(
  source: SourceDimensions,
  frame: FrameDimensions,
): SourceCrop {
  const scale = Math.max(
    frame.width / source.width,
    frame.height / source.height,
  );
  const visibleWidth = frame.width / scale;
  const visibleHeight = frame.height / scale;

  return {
    x: (source.width - visibleWidth) / 2,
    y: (source.height - visibleHeight) / 2,
    width: visibleWidth,
    height: visibleHeight,
  };
}

function getFullFrameDestination(frame: FrameDimensions): SourceTransform["destination"] {
  return {
    x: 0,
    y: 0,
    width: frame.width,
    height: frame.height,
  };
}

export function computeDefaultTransform(
  input: ComputeTransformInput,
): SourceTransform {
  const { source, frame, fitMode } = input;

  if (fitMode === "cover") {
    return {
      sourceCrop: getCoverSourceCrop(source, frame),
      destination: getFullFrameDestination(frame),
    };
  }

  return {
    sourceCrop: createFullSourceCrop(source),
    destination: getContainDrawRect(source, frame),
  };
}

export function computeDefaultTransformFromSettings(input: {
  source: SourceDimensions;
  aspectRatio: AspectRatio;
  fitMode: FitMode;
  outputWidth: number;
}): SourceTransform {
  const frame = getFrameDimensions(
    input.aspectRatio,
    input.outputWidth,
    input.source,
  );

  return computeDefaultTransform({
    source: input.source,
    frame,
    fitMode: input.fitMode,
  });
}

export function clampSourceCrop(
  crop: SourceCrop,
  source: SourceDimensions,
): SourceCrop {
  const x = Math.max(0, Math.min(crop.x, source.width));
  const y = Math.max(0, Math.min(crop.y, source.height));
  const maxWidth = source.width - x;
  const maxHeight = source.height - y;

  return {
    x,
    y,
    width: Math.max(1, Math.min(crop.width, maxWidth)),
    height: Math.max(1, Math.min(crop.height, maxHeight)),
  };
}

export function isFullSourceCrop(
  crop: SourceCrop,
  source: SourceDimensions,
): boolean {
  const epsilon = 0.5;

  return (
    Math.abs(crop.x) <= epsilon &&
    Math.abs(crop.y) <= epsilon &&
    Math.abs(crop.width - source.width) <= epsilon &&
    Math.abs(crop.height - source.height) <= epsilon
  );
}

export function resolveTransform(
  input: ComputeDefaultTransformInput,
  transform?: SourceTransform | null,
): SourceTransform {
  if (transform) {
    return {
      sourceCrop: clampSourceCrop(transform.sourceCrop, input.source),
      destination: transform.destination,
    };
  }

  return computeDefaultTransform(input);
}

/** Cover draw rect in frame space — useful for blur background rendering. */
export function getCoverFrameRect(
  source: SourceDimensions,
  frame: FrameDimensions,
): SourceTransform["destination"] {
  return getCoverDrawRect(source, frame);
}
