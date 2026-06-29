"use client";

import { useCallback, useRef, useState } from "react";
import Konva from "konva";
import { Group, Rect } from "react-konva";
import { MIN_COVER_PATCH_SIZE } from "@/lib/konva/cleanupTools";

interface CoverPatchOverlayProps {
  stageWidth: number;
  stageHeight: number;
  onCoverPatchComplete: (rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => void;
}

function getStagePointer(stage: Konva.Stage): { x: number; y: number } | null {
  const pointer = stage.getPointerPosition();
  if (!pointer) {
    return null;
  }

  const transform = stage.getAbsoluteTransform().copy().invert();
  return transform.point(pointer);
}

export function CoverPatchOverlay({
  stageWidth,
  stageHeight,
  onCoverPatchComplete,
}: CoverPatchOverlayProps) {
  const [previewRect, setPreviewRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const isDrawingRef = useRef(false);

  const handlePointerDown = useCallback(
    (event: Konva.KonvaEventObject<Event>) => {
      const stage = event.target.getStage();
      if (!stage) {
        return;
      }

      const point = getStagePointer(stage);
      if (!point) {
        return;
      }

      event.cancelBubble = true;
      isDrawingRef.current = true;
      startPointRef.current = point;
      setPreviewRect({ x: point.x, y: point.y, width: 0, height: 0 });
    },
    [],
  );

  const handlePointerMove = useCallback(
    (event: Konva.KonvaEventObject<Event>) => {
      if (!isDrawingRef.current || !startPointRef.current) {
        return;
      }

      const stage = event.target.getStage();
      if (!stage) {
        return;
      }

      const point = getStagePointer(stage);
      if (!point) {
        return;
      }

      event.cancelBubble = true;

      const start = startPointRef.current;
      const x = Math.min(start.x, point.x);
      const y = Math.min(start.y, point.y);
      const width = Math.abs(point.x - start.x);
      const height = Math.abs(point.y - start.y);

      setPreviewRect({ x, y, width, height });
    },
    [],
  );

  const finishDrawing = useCallback(
    (event?: Konva.KonvaEventObject<Event>) => {
      if (event) {
        event.cancelBubble = true;
      }

      if (!isDrawingRef.current || !previewRect) {
        isDrawingRef.current = false;
        startPointRef.current = null;
        setPreviewRect(null);
        return;
      }

      isDrawingRef.current = false;
      startPointRef.current = null;

      if (
        previewRect.width >= MIN_COVER_PATCH_SIZE &&
        previewRect.height >= MIN_COVER_PATCH_SIZE
      ) {
        onCoverPatchComplete(previewRect);
      }

      setPreviewRect(null);
    },
    [onCoverPatchComplete, previewRect],
  );

  return (
    <Group name="cleanup-guide">
      <Rect
        x={0}
        y={0}
        width={stageWidth}
        height={stageHeight}
        fill="rgba(0,0,0,0.001)"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={finishDrawing}
        onMouseLeave={() => finishDrawing()}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={finishDrawing}
      />

      {previewRect && previewRect.width > 0 && previewRect.height > 0 ? (
        <Rect
          x={previewRect.x}
          y={previewRect.y}
          width={previewRect.width}
          height={previewRect.height}
          fill="rgba(255,255,255,0.65)"
          stroke="#0071e3"
          strokeWidth={1.5}
          dash={[6, 4]}
          listening={false}
        />
      ) : null}
    </Group>
  );
}
