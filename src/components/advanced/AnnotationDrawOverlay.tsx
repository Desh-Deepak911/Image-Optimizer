"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import type { CalloutKind, EditorToolId } from "@/types/konvaEditor";
import type { AnnotationStyle } from "@/types/annotationStyle";
import {
  getArrowHeadDimensions,
  getEffectiveStrokeColor,
  getStrokeDashPattern,
} from "@/lib/konva/annotationStyle";

interface AnnotationDrawOverlayProps {
  editorTool: EditorToolId;
  annotationStyle: AnnotationStyle;
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

  const scale = stage.scaleX() || 1;
  return {
    x: pointer.x / scale,
    y: pointer.y / scale,
  };
}

export function AnnotationDrawOverlay({
  editorTool,
  annotationStyle,
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
  const previewLineRef = useRef<{ x: number; y: number; points: number[] } | null>(
    null,
  );
  const previewFreehandRef = useRef<number[]>([]);
  const previewRectRef = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const editorToolRef = useRef(editorTool);

  useEffect(() => {
    editorToolRef.current = editorTool;
  }, [editorTool]);

  const resetPreview = useCallback(() => {
    isDrawingRef.current = false;
    startPointRef.current = null;
    previewLineRef.current = null;
    previewFreehandRef.current = [];
    previewRectRef.current = null;
    setPreviewLine(null);
    setPreviewRect(null);
    setPreviewFreehand([]);
  }, []);

  const finishDrawing = useCallback(
    (stage?: Konva.Stage | null) => {
      if (!isDrawingRef.current || !startPointRef.current) {
        resetPreview();
        return;
      }

      const tool = editorToolRef.current;
      const start = startPointRef.current;
      const pointerStage = stage ?? stageRef.current;
      const pointer = pointerStage ? getStagePointer(pointerStage) : null;

      if (tool === "line" || tool === "arrow") {
        const linePreview = previewLineRef.current;
        const end = pointer ?? {
          x: start.x + (linePreview?.points[2] ?? 0),
          y: start.y + (linePreview?.points[3] ?? 0),
        };
        const geometry = lineGeometryFromDrag(start, end);

        if (geometry) {
          onLineComplete({
            shape: tool,
            ...geometry,
          });
        }
      } else if (tool === "freehand" || tool === "highlighter") {
        const geometry = freehandGeometryFromPoints(previewFreehandRef.current);

        if (geometry) {
          onFreehandComplete({
            shape: tool,
            ...geometry,
          });
        }
      } else if (isCalloutTool(tool)) {
        const rect = previewRectRef.current;

        if (rect) {
          const calloutType = calloutToolToKind(tool);

          if (
            calloutType &&
            rect.width >= MIN_CALLOUT_SIZE &&
            rect.height >= MIN_CALLOUT_SIZE
          ) {
            onCalloutComplete({
              calloutType,
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            });
          }
        }
      }

      resetPreview();
    },
    [onCalloutComplete, onFreehandComplete, onLineComplete, resetPreview],
  );

  useEffect(() => {
    if (editorTool === "select") {
      return;
    }

    const handleWindowPointerUp = () => {
      if (isDrawingRef.current) {
        finishDrawing(stageRef.current);
      }
    };

    window.addEventListener("mouseup", handleWindowPointerUp);
    window.addEventListener("touchend", handleWindowPointerUp);

    return () => {
      window.removeEventListener("mouseup", handleWindowPointerUp);
      window.removeEventListener("touchend", handleWindowPointerUp);
    };
  }, [editorTool, finishDrawing]);

  const handlePointerDown = useCallback(
    (event: Konva.KonvaEventObject<Event>) => {
      if (editorTool === "select") {
        return;
      }

      const stage = event.target.getStage();
      if (!stage) {
        return;
      }

      stageRef.current = stage;
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
        const nextRect = { x: point.x, y: point.y, width: 0, height: 0 };
        previewRectRef.current = nextRect;
        setPreviewRect(nextRect);
        return;
      }

      if (editorTool === "freehand" || editorTool === "highlighter") {
        previewFreehandRef.current = [point.x, point.y];
        setPreviewFreehand([point.x, point.y]);
        return;
      }

      if (editorTool === "line" || editorTool === "arrow") {
        const nextLine = { x: point.x, y: point.y, points: [0, 0, 0, 0] };
        previewLineRef.current = nextLine;
        setPreviewLine(nextLine);
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

      stageRef.current = stage;
      const point = getStagePointer(stage);
      if (!point) {
        return;
      }

      event.cancelBubble = true;
      const start = startPointRef.current;

      if (isCalloutTool(editorTool)) {
        const nextRect = {
          x: Math.min(start.x, point.x),
          y: Math.min(start.y, point.y),
          width: Math.abs(point.x - start.x),
          height: Math.abs(point.y - start.y),
        };
        previewRectRef.current = nextRect;
        setPreviewRect(nextRect);
        return;
      }

      if (editorTool === "freehand" || editorTool === "highlighter") {
        const nextPoints = simplifyFreehandPoints([
          ...previewFreehandRef.current,
          point.x,
          point.y,
        ]);
        previewFreehandRef.current = nextPoints;
        setPreviewFreehand(nextPoints);
        return;
      }

      if (editorTool === "line" || editorTool === "arrow") {
        const nextLine = {
          x: start.x,
          y: start.y,
          points: [0, 0, point.x - start.x, point.y - start.y],
        };
        previewLineRef.current = nextLine;
        setPreviewLine(nextLine);
      }
    },
    [editorTool],
  );

  const handlePointerUp = useCallback(
    (event: Konva.KonvaEventObject<Event>) => {
      event.cancelBubble = true;
      finishDrawing(event.target.getStage());
    },
    [finishDrawing],
  );

  if (editorTool === "select") {
    return null;
  }

  const strokeColor = getEffectiveStrokeColor(annotationStyle);
  const strokeWidth =
    editorTool === "highlighter"
      ? Math.max(annotationStyle.strokeWidth * 3, 12)
      : annotationStyle.strokeWidth;
  const dash = getStrokeDashPattern(annotationStyle.strokeDash);
  const previewOpacity =
    editorTool === "highlighter"
      ? annotationStyle.opacity
      : annotationStyle.opacity;
  const arrowHead = getArrowHeadDimensions(annotationStyle);

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
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      />

      {previewLine &&
      (editorTool === "line" || editorTool === "arrow") ? (
        editorTool === "arrow" ? (
          <Arrow
            x={previewLine.x}
            y={previewLine.y}
            points={previewLine.points}
            stroke={strokeColor}
            fill={arrowHead.fill}
            strokeWidth={strokeWidth}
            opacity={previewOpacity}
            pointerLength={arrowHead.pointerLength}
            pointerWidth={arrowHead.pointerWidth}
            pointerAtBeginning={annotationStyle.doubleHeaded}
            pointerAtEnding
            dash={dash}
            lineCap={annotationStyle.lineCap}
            lineJoin={annotationStyle.lineJoin}
            listening={false}
          />
        ) : (
          <Line
            x={previewLine.x}
            y={previewLine.y}
            points={previewLine.points}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            opacity={previewOpacity}
            dash={dash}
            lineCap={annotationStyle.lineCap}
            lineJoin={annotationStyle.lineJoin}
            listening={false}
          />
        )
      ) : null}

      {previewFreehand.length >= 4 &&
      (editorTool === "freehand" || editorTool === "highlighter") ? (
        <Line
          points={previewFreehand}
          stroke={editorTool === "highlighter" ? annotationStyle.fill : strokeColor}
          strokeWidth={strokeWidth}
          opacity={previewOpacity}
          tension={annotationStyle.tension}
          lineCap={annotationStyle.lineCap}
          lineJoin={annotationStyle.lineJoin}
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
          fill={annotationStyle.fill}
          opacity={0.65}
          stroke={annotationStyle.strokeColor}
          strokeWidth={1.5}
          dash={[6, 4]}
          cornerRadius={editorTool === "label" ? 999 : 12}
          listening={false}
        />
      ) : null}
    </Group>
  );
}
