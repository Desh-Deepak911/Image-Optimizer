"use client";

import { useCallback, useRef } from "react";
import type { FrameDimensions } from "@/lib/render/types";
import type { SourceTransform } from "@/types/editor";
import type { FitMode } from "@/types/optimizer";

interface CropOverlayProps {
  transform: SourceTransform;
  frame: FrameDimensions;
  fitMode: FitMode;
  displayScale: number;
  onPanDelta: (delta: { dx: number; dy: number }) => void;
}

export function CropOverlay({
  transform,
  frame,
  fitMode,
  displayScale,
  onPanDelta,
}: CropOverlayProps) {
  const dragOriginRef = useRef<{ x: number; y: number } | null>(null);
  const isCover = fitMode === "cover";

  const overlayRect = isCover
    ? {
        x: 0,
        y: 0,
        width: frame.width,
        height: frame.height,
      }
    : transform.destination;

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      dragOriginRef.current = { x: event.clientX, y: event.clientY };
    },
    [],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!dragOriginRef.current) {
        return;
      }

      const dx = (event.clientX - dragOriginRef.current.x) / displayScale;
      const dy = (event.clientY - dragOriginRef.current.y) / displayScale;

      if (dx === 0 && dy === 0) {
        return;
      }

      onPanDelta({ dx, dy });
      dragOriginRef.current = { x: event.clientX, y: event.clientY };
    },
    [displayScale, onPanDelta],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (dragOriginRef.current) {
        event.currentTarget.releasePointerCapture(event.pointerId);
        dragOriginRef.current = null;
      }
    },
    [],
  );

  return (
    <div
      className="absolute inset-0 touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      aria-label="Drag to reposition the image"
      role="presentation"
    >
      <div
        className={`absolute rounded-md border-2 transition-colors ${
          isCover
            ? "border-transparent"
            : "border-[#0071e3]/80 bg-[#0071e3]/[0.06] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]"
        }`}
        style={{
          left: overlayRect.x * displayScale,
          top: overlayRect.y * displayScale,
          width: overlayRect.width * displayScale,
          height: overlayRect.height * displayScale,
          cursor: "grab",
        }}
      />
    </div>
  );
}
