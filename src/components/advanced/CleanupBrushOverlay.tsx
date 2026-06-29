"use client";

import { useCallback, useRef, useState } from "react";
import Konva from "konva";
import { Circle, Group, Rect } from "react-konva";
import { createCleanupStrokeId } from "@/lib/konva/cleanupEffects";
import type {
  CleanupBrushStroke,
  CleanupBrushType,
  ImageEditorLayer,
} from "@/types/konvaEditor";

interface CleanupBrushOverlayProps {
  layer: ImageEditorLayer;
  brushType: CleanupBrushType;
  brushSize: number;
  intensity: number;
  existingStrokes: CleanupBrushStroke[];
  onStrokeStart: () => void;
  onStrokePreview: (strokes: CleanupBrushStroke[]) => void;
  onStrokeComplete: (stroke: CleanupBrushStroke) => void;
}

function getLayerLocalPointer(
  stage: Konva.Stage,
  layer: ImageEditorLayer,
): { x: number; y: number } | null {
  const pointer = stage.getPointerPosition();
  if (!pointer) {
    return null;
  }

  const transform = stage.getAbsoluteTransform().copy().invert();
  const stagePoint = transform.point(pointer);
  const centerX = layer.x + layer.width / 2;
  const centerY = layer.y + layer.height / 2;
  const radians = (-layer.rotation * Math.PI) / 180;
  const deltaX = stagePoint.x - centerX;
  const deltaY = stagePoint.y - centerY;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return {
    x: deltaX * cos - deltaY * sin + layer.width / 2,
    y: deltaX * sin + deltaY * cos + layer.height / 2,
  };
}

function isInsideLayer(localX: number, localY: number, layer: ImageEditorLayer) {
  return (
    localX >= 0 &&
    localY >= 0 &&
    localX <= layer.width &&
    localY <= layer.height
  );
}

export function CleanupBrushOverlay({
  layer,
  brushType,
  brushSize,
  intensity,
  existingStrokes,
  onStrokeStart,
  onStrokePreview,
  onStrokeComplete,
}: CleanupBrushOverlayProps) {
  const [cursorPoint, setCursorPoint] = useState<{ x: number; y: number } | null>(
    null,
  );
  const activeStrokeRef = useRef<CleanupBrushStroke | null>(null);
  const isPaintingRef = useRef(false);

  const handlePointerDown = useCallback(
    (event: Konva.KonvaEventObject<Event>) => {
      const stage = event.target.getStage();
      if (!stage) {
        return;
      }

      const localPoint = getLayerLocalPointer(stage, layer);
      if (!localPoint || !isInsideLayer(localPoint.x, localPoint.y, layer)) {
        return;
      }

      event.cancelBubble = true;
      isPaintingRef.current = true;
      onStrokeStart();

      const stroke: CleanupBrushStroke = {
        id: createCleanupStrokeId(),
        type: brushType,
        points: [localPoint.x, localPoint.y],
        brushSize,
        intensity,
      };

      activeStrokeRef.current = stroke;
      onStrokePreview([...existingStrokes, stroke]);
      setCursorPoint(localPoint);
    },
    [brushSize, brushType, existingStrokes, intensity, layer, onStrokePreview, onStrokeStart],
  );

  const handlePointerMove = useCallback(
    (event: Konva.KonvaEventObject<Event>) => {
      const stage = event.target.getStage();
      if (!stage) {
        return;
      }

      const localPoint = getLayerLocalPointer(stage, layer);
      if (!localPoint) {
        return;
      }

      setCursorPoint(
        isInsideLayer(localPoint.x, localPoint.y, layer) ? localPoint : null,
      );

      if (!isPaintingRef.current || !activeStrokeRef.current) {
        return;
      }

      event.cancelBubble = true;

      const stroke = activeStrokeRef.current;
      const lastIndex = stroke.points.length - 2;
      const lastX = stroke.points[lastIndex];
      const lastY = stroke.points[lastIndex + 1];

      if (
        Math.hypot(localPoint.x - lastX, localPoint.y - lastY) <
        Math.max(2, brushSize / 8)
      ) {
        return;
      }

      const nextStroke: CleanupBrushStroke = {
        ...stroke,
        points: [...stroke.points, localPoint.x, localPoint.y],
      };

      activeStrokeRef.current = nextStroke;
      onStrokePreview([...existingStrokes, nextStroke]);
    },
    [brushSize, existingStrokes, layer, onStrokePreview],
  );

  const finishStroke = useCallback(() => {
    if (!isPaintingRef.current || !activeStrokeRef.current) {
      return;
    }

    isPaintingRef.current = false;
    const stroke = activeStrokeRef.current;
    activeStrokeRef.current = null;

    if (stroke.points.length >= 2) {
      onStrokeComplete(stroke);
    } else {
      onStrokePreview(existingStrokes);
    }
  }, [existingStrokes, onStrokeComplete, onStrokePreview]);

  const handlePointerUp = useCallback(
    (event: Konva.KonvaEventObject<Event>) => {
      event.cancelBubble = true;
      finishStroke();
    },
    [finishStroke],
  );

  return (
    <Group
      x={layer.x}
      y={layer.y}
      rotation={layer.rotation}
      name="cleanup-guide"
    >
      <Rect
        width={layer.width}
        height={layer.height}
        fill="rgba(0,0,0,0.001)"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={finishStroke}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      />

      {cursorPoint ? (
        <Circle
          x={cursorPoint.x}
          y={cursorPoint.y}
          radius={brushSize / 2}
          stroke="#0071e3"
          strokeWidth={1.5}
          dash={[4, 4]}
          listening={false}
        />
      ) : null}
    </Group>
  );
}
