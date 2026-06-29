"use client";

import { useCallback, useRef, useState } from "react";
import Konva from "konva";
import { Arrow, Group, Line, Rect } from "react-konva";
import {
  calloutToolToKind,
  freehandGeometryFromPoints,
  isCalloutTool,
  lineGeometryFromDrag,
  MIN_CALLOUT_SIZE,
  simplifyFreehandPoints,
} from "@/lib/konva/annotationTools";
import type {
  CalloutKind,
  DrawingToolSettings,
  EditorToolId,
} from "@/types/konvaEditor";

interface AnnotationDrawOverlayProps {
  editorTool: EditorToolId;
  drawingSettings: DrawingToolSettings;
  stageWidth: number;
  stageHeight: number;
  onLineComplete: (geometry: {
    shape: "line" | "arrow";
    x: number;
    y: number;
    width: number;
    height: number;
    points: number[];
  }) => void;
  onFreehandComplete: (geometry: {
    shape: "freehand" | "highlighter";
    x: number;
    y: number;
    width: number;
    height: number;
    points: number[];
  }) => void;
  onCalloutComplete: (geometry: {
    calloutType: CalloutKind;
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

export function AnnotationDrawOverlay({
  editorTool,
  drawingSettings,
  stageWidth,
  stageHeight,
  onLineComplete,
  onFreehandComplete,
  onCalloutComplete,
}: AnnotationDrawOverlayProps) {
  const [previewLine, setPreviewLine] = useState<{
    x: number;
    y: number;
    points: number[];
  } | null>(null);
  const [previewRect, setPreviewRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [previewFreehand, setPreviewFreehand] = useState<number[]>([]);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const isDrawingRef = useRef(false);

  const resetPreview = useCallback(() => {
    isDrawingRef.current = false;
    startPointRef.current = null;
    setPreviewLine(null);
    setPreviewRect(null);
    setPreviewFreehand([]);
  }, []);

  const handlePointerDown = useCallback(
    (event: Konva.KonvaEventObject<Event>) => {
      if (editorTool === "select") {
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
      isDrawingRef.current = true;
      startPointRef.current = point;

      if (editorTool === "numbered-marker") {
        onCalloutComplete({
          calloutType: "numbered-marker",
          x: point.x - 22,
          y: point.y - 22,
          width: 44,
          height: 44,
        });
        resetPreview();
        return;
      }

      if (isCalloutTool(editorTool)) {
        setPreviewRect({ x: point.x, y: point.y, width: 0, height: 0 });
        return;
      }

      if (editorTool === "freehand" || editorTool === "highlighter") {
        setPreviewFreehand([point.x, point.y]);
        return;
      }

      if (editorTool === "line" || editorTool === "arrow") {
        setPreviewLine({ x: point.x, y: point.y, points: [0, 0, 0, 0] });
      }
    },
    [editorTool, onCalloutComplete, resetPreview],
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

      if (isCalloutTool(editorTool)) {
        const x = Math.min(start.x, point.x);
        const y = Math.min(start.y, point.y);
        setPreviewRect({
          x,
          y,
          width: Math.abs(point.x - start.x),
          height: Math.abs(point.y - start.y),
        });
        return;
      }

      if (editorTool === "freehand" || editorTool === "highlighter") {
        setPreviewFreehand((previous) =>
          simplifyFreehandPoints([...previous, point.x, point.y]),
        );
        return;
      }

      if (editorTool === "line" || editorTool === "arrow") {
        setPreviewLine({
          x: start.x,
          y: start.y,
          points: [0, 0, point.x - start.x, point.y - start.y],
        });
      }
    },
    [editorTool],
  );

  const finishDrawing = useCallback(
    (event?: Konva.KonvaEventObject<Event>) => {
      if (event) {
        event.cancelBubble = true;
      }

      if (!isDrawingRef.current || !startPointRef.current) {
        resetPreview();
        return;
      }

      const start = startPointRef.current;

      if (editorTool === "line" || editorTool === "arrow") {
        const endX = start.x + (previewLine?.points[2] ?? 0);
        const endY = start.y + (previewLine?.points[3] ?? 0);
        const geometry = lineGeometryFromDrag(start, { x: endX, y: endY });

        if (geometry) {
          onLineComplete({
            shape: editorTool,
            ...geometry,
          });
        }
      } else if (editorTool === "freehand" || editorTool === "highlighter") {
        const geometry = freehandGeometryFromPoints(previewFreehand);

        if (geometry) {
          onFreehandComplete({
            shape: editorTool,
            ...geometry,
          });
        }
      } else if (isCalloutTool(editorTool) && previewRect) {
        const calloutType = calloutToolToKind(editorTool);

        if (
          calloutType &&
          previewRect.width >= MIN_CALLOUT_SIZE &&
          previewRect.height >= MIN_CALLOUT_SIZE
        ) {
          onCalloutComplete({
            calloutType,
            x: previewRect.x,
            y: previewRect.y,
            width: previewRect.width,
            height: previewRect.height,
          });
        }
      }

      resetPreview();
    },
    [
      editorTool,
      onCalloutComplete,
      onFreehandComplete,
      onLineComplete,
      previewFreehand,
      previewLine,
      previewRect,
      resetPreview,
    ],
  );

  if (editorTool === "select") {
    return null;
  }

  const strokeColor = drawingSettings.strokeColor;
  const strokeWidth = drawingSettings.strokeWidth;
  const dash = drawingSettings.dashed ? [10, 6] : undefined;

  return (
    <Group name="drawing-guide">
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

      {previewLine &&
      (editorTool === "line" || editorTool === "arrow") ? (
        editorTool === "arrow" ? (
          <Arrow
            x={previewLine.x}
            y={previewLine.y}
            points={previewLine.points}
            stroke={strokeColor}
            fill={strokeColor}
            strokeWidth={strokeWidth}
            pointerLength={drawingSettings.arrowHeadSize}
            pointerWidth={drawingSettings.arrowHeadSize}
            dash={dash}
            lineCap="round"
            listening={false}
          />
        ) : (
          <Line
            x={previewLine.x}
            y={previewLine.y}
            points={previewLine.points}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            dash={dash}
            lineCap="round"
            listening={false}
          />
        )
      ) : null}

      {previewFreehand.length >= 4 &&
      (editorTool === "freehand" || editorTool === "highlighter") ? (
        <Line
          points={previewFreehand}
          stroke={editorTool === "highlighter" ? "#ffd60a" : strokeColor}
          strokeWidth={
            editorTool === "highlighter"
              ? Math.max(strokeWidth * 3, 12)
              : strokeWidth
          }
          opacity={
            editorTool === "highlighter"
              ? drawingSettings.highlighterOpacity
              : drawingSettings.opacity
          }
          tension={drawingSettings.freehandTension}
          lineCap="round"
          lineJoin="round"
          globalCompositeOperation={
            editorTool === "highlighter" ? "multiply" : undefined
          }
          listening={false}
        />
      ) : null}

      {previewRect &&
      previewRect.width > 0 &&
      previewRect.height > 0 &&
      isCalloutTool(editorTool) ? (
        <Rect
          x={previewRect.x}
          y={previewRect.y}
          width={previewRect.width}
          height={previewRect.height}
          fill="rgba(255,255,255,0.65)"
          stroke="#0071e3"
          strokeWidth={1.5}
          dash={[6, 4]}
          cornerRadius={editorTool === "label" ? 999 : 12}
          listening={false}
        />
      ) : null}
    </Group>
  );
}
