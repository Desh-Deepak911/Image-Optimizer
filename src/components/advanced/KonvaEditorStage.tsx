"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Konva from "konva";
import {
  Arrow,
  Circle,
  Group,
  Image as KonvaImage,
  Layer,
  Line,
  Rect,
  Stage,
  Text,
  Transformer,
} from "react-konva";
import { AnnotationDrawOverlay } from "@/components/advanced/AnnotationDrawOverlay";
import { CanvasZoomControls } from "@/components/advanced/CanvasZoomControls";
import { CleanupBrushOverlay } from "@/components/advanced/CleanupBrushOverlay";
import { CoverPatchOverlay } from "@/components/advanced/CoverPatchOverlay";
import { ImageCropEditor } from "@/components/advanced/ImageCropEditor";
import {
  LayerContextMenu,
  type LayerContextMenuItem,
} from "@/components/advanced/LayerContextMenu";
import {
  applyImageFilterAttributes,
  cacheFilteredImage,
  getActiveKonvaFilters,
} from "@/lib/konva/imageFilters";
import { getStageBackgroundFillProps } from "@/lib/konva/backgroundGradients";
import { getEffectiveImageCrop } from "@/lib/konva/imageCrop";
import { buildCleanupImageCanvas } from "@/lib/konva/cleanupEffects";
import {
  drawImageMaskPath,
  getImageCornerRadius,
  hasActiveDropShadow,
  hasActiveGlow,
  usesImageClipMask,
} from "@/lib/konva/imageLayerRender";
import { type LayerBounds } from "@/lib/konva/layerBounds";
import { getStrokeColor, EDITOR_TOOL_CURSORS, isAnnotationTool } from "@/lib/konva/annotationTools";
import {
  snapLayerPosition,
  type SnapGuideLine,
} from "@/lib/konva/snapGuides";
import type {
  CalloutEditorLayer,
  CalloutKind,
  CleanupBrushStroke,
  CleanupToolId,
  DrawingToolSettings,
  EditorLayer,
  EditorToolId,
  ImageEditorLayer,
  ImageSourceCrop,
  LayerTransformUpdate,
  ShapeEditorLayer,
  StageBackground,
} from "@/types/konvaEditor";
import {
  DEFAULT_IMAGE_LAYER_STYLE,
  DEFAULT_TEXT_FONT_FAMILY,
  isVectorShape,
} from "@/types/konvaEditor";

type TransformableNode = Konva.Node;

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_STEP = 1.2;

function isPointBasedShape(shape: ShapeEditorLayer["shape"]): boolean {
  return (
    shape === "line" ||
    shape === "arrow" ||
    shape === "freehand" ||
    shape === "highlighter"
  );
}

function scaleLinePoints(
  points: number[],
  scaleX: number,
  scaleY: number,
): number[] {
  return points.map((value, index) =>
    index % 2 === 0 ? value * scaleX : value * scaleY,
  );
}

function boundsFromPoints(points: number[]): { width: number; height: number } {
  let maxX = 0;
  let maxY = 0;

  for (let index = 0; index < points.length; index += 2) {
    maxX = Math.max(maxX, points[index] ?? 0);
    maxY = Math.max(maxY, points[index + 1] ?? 0);
  }

  return {
    width: Math.max(1, maxX),
    height: Math.max(1, maxY),
  };
}

function applyTransformEnd(
  node: TransformableNode,
  layer: EditorLayer,
  onChange: (update: LayerTransformUpdate) => void,
): void {
  const scaleX = node.scaleX();
  const scaleY = node.scaleY();

  node.scaleX(1);
  node.scaleY(1);

  if (layer.type === "text") {
    onChange({
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      fontSize: Math.max(8, layer.fontSize * scaleY),
      width: Math.max(40, node.width() * scaleX),
    });
    return;
  }

  if (layer.type === "shape" && layer.shape === "circle") {
    const nextWidth = Math.max(20, node.width() * scaleX);
    const nextHeight = Math.max(20, node.height() * scaleY);
    onChange({
      x: node.x() - nextWidth / 2,
      y: node.y() - nextHeight / 2,
      width: nextWidth,
      height: nextHeight,
      rotation: node.rotation(),
    });
    return;
  }

  if (layer.type === "shape" && isPointBasedShape(layer.shape)) {
    const lineNode = node as Konva.Line | Konva.Arrow;
    const scaledPoints = scaleLinePoints(lineNode.points(), scaleX, scaleY);
    lineNode.points(scaledPoints);
    const { width, height } = boundsFromPoints(scaledPoints);

    onChange({
      x: node.x(),
      y: node.y(),
      width,
      height,
      rotation: node.rotation(),
      points: scaledPoints,
    });
    return;
  }

  if (layer.type === "image") {
    onChange({
      x: node.x(),
      y: node.y(),
      width: Math.max(20, layer.width * scaleX),
      height: Math.max(20, layer.height * scaleY),
      rotation: node.rotation(),
    });
    return;
  }

  onChange({
    x: node.x(),
    y: node.y(),
    width: Math.max(20, node.width() * scaleX),
    height: Math.max(20, node.height() * scaleY),
    rotation: node.rotation(),
  });
}

interface SnapContext {
  stageWidth: number;
  stageHeight: number;
  layers: EditorLayer[];
  onGuidesChange: (guides: SnapGuideLine[]) => void;
}

function getBoundsFromNode(node: Konva.Node, layer: EditorLayer): LayerBounds {
  if (layer.type === "text") {
    return {
      x: node.x(),
      y: node.y(),
      width: layer.width,
      height: layer.fontSize,
    };
  }

  if (layer.type === "shape" && layer.shape === "circle") {
    return {
      x: node.x() - layer.width / 2,
      y: node.y() - layer.height / 2,
      width: layer.width,
      height: layer.height,
    };
  }

  if (layer.type === "shape" && isPointBasedShape(layer.shape)) {
    return {
      x: node.x(),
      y: node.y(),
      width: layer.width,
      height: layer.height,
    };
  }

  if (layer.type === "callout") {
    return {
      x: node.x(),
      y: node.y(),
      width: layer.width,
      height: layer.height,
    };
  }

  return {
    x: node.x(),
    y: node.y(),
    width: layer.width,
    height: layer.height,
  };
}

function applyNodePosition(node: Konva.Node, layer: EditorLayer, bounds: LayerBounds): void {
  if (layer.type === "shape" && layer.shape === "circle") {
    node.position({
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    });
    return;
  }

  node.position({ x: bounds.x, y: bounds.y });
}

function createDragHandlers(
  layer: EditorLayer,
  snapContext: SnapContext,
  onChange: (update: LayerTransformUpdate) => void,
) {
  const snapNode = (node: Konva.Node) => {
    const bounds = getBoundsFromNode(node, layer);
    const snapped = snapLayerPosition(
      bounds,
      snapContext.stageWidth,
      snapContext.stageHeight,
      snapContext.layers,
      layer.id,
    );
    applyNodePosition(node, layer, { ...bounds, x: snapped.x, y: snapped.y });
    snapContext.onGuidesChange(snapped.guides);
    return snapped;
  };

  return {
    onDragMove: (event: Konva.KonvaEventObject<DragEvent>) => {
      snapNode(event.target);
    },
    onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) => {
      const snapped = snapNode(event.target);
      snapContext.onGuidesChange([]);
      onChange({ x: snapped.x, y: snapped.y });
    },
  };
}

function createLayerSelectionHandlers(onSelect: () => void) {
  return {
    onClick: (event: Konva.KonvaEventObject<MouseEvent>) => {
      event.cancelBubble = true;
      onSelect();
    },
    onTap: (event: Konva.KonvaEventObject<Event>) => {
      event.cancelBubble = true;
      onSelect();
    },
  };
}

interface LayerNodeProps {
  layer: EditorLayer;
  onSelect: () => void;
  onChange: (update: LayerTransformUpdate) => void;
  registerNode: (layerId: string, node: TransformableNode | null) => void;
  onContextMenu: (layerId: string, clientX: number, clientY: number) => void;
  snapContext: SnapContext;
  cropEditingLayerId?: string | null;
  isCleanupPainting?: boolean;
  isAnnotationDrawing?: boolean;
}

function resolveImageStyle(
  style: ImageEditorLayer["style"] | undefined,
): typeof DEFAULT_IMAGE_LAYER_STYLE {
  return {
    ...DEFAULT_IMAGE_LAYER_STYLE,
    ...style,
  };
}

function ImageMaskBorder({
  width,
  height,
  mask,
  cornerRadius,
  borderWidth,
  borderColor,
}: {
  width: number;
  height: number;
  mask: typeof DEFAULT_IMAGE_LAYER_STYLE.mask;
  cornerRadius: number;
  borderWidth: number;
  borderColor: string;
}) {
  if (borderWidth <= 0) {
    return null;
  }

  if (mask === "circle") {
    return (
      <Circle
        x={width / 2}
        y={height / 2}
        radius={Math.min(width, height) / 2}
        stroke={borderColor}
        strokeWidth={borderWidth}
        listening={false}
      />
    );
  }

  return (
    <Rect
      x={0}
      y={0}
      width={width}
      height={height}
      cornerRadius={mask === "rounded" ? cornerRadius : 0}
      stroke={borderColor}
      strokeWidth={borderWidth}
      listening={false}
    />
  );
}

function ImageLayerNode({
  layer,
  onSelect,
  onChange,
  registerNode,
  onContextMenu,
  snapContext,
  cropEditingLayerId,
  isCleanupPainting = false,
  isAnnotationDrawing = false,
}: LayerNodeProps & { layer: ImageEditorLayer }) {
  const groupRef = useRef<Konva.Group>(null);
  const imageRef = useRef<Konva.Image>(null);
  const glowRef = useRef<Konva.Image>(null);
  const [htmlImage, setHtmlImage] = useState<HTMLImageElement | null>(null);
  const processedCanvas = useMemo(() => {
    if (!htmlImage || !layer.cleanupStrokes?.length) {
      return null;
    }

    return buildCleanupImageCanvas(layer, htmlImage);
  }, [htmlImage, layer]);
  const dragHandlers = useMemo(
    () => createDragHandlers(layer, snapContext, onChange),
    [layer, onChange, snapContext],
  );
  const selectionHandlers = useMemo(
    () => createLayerSelectionHandlers(onSelect),
    [onSelect],
  );

  const style = resolveImageStyle(layer.style);
  const crop = getEffectiveImageCrop(
    layer.crop,
    layer.image.width,
    layer.image.height,
  );
  const useClip = usesImageClipMask(style.mask);
  const useGlow = hasActiveGlow(style);
  const useDropShadow = hasActiveDropShadow(style);
  const useGroupWrapper = useClip || useGlow;
  const isCropEditing = cropEditingLayerId === layer.id;
  const isInteractionLocked =
    isCropEditing || isCleanupPainting || isAnnotationDrawing;
  const cornerRadius = getImageCornerRadius(style.mask, style.cornerRadius);

  useEffect(() => {
    let cancelled = false;
    const img = new window.Image();
    img.onload = () => {
      if (!cancelled) {
        setHtmlImage(img);
      }
    };
    img.onerror = () => {
      if (!cancelled) {
        setHtmlImage(null);
      }
    };
    img.src = layer.image.previewUrl;

    return () => {
      cancelled = true;
      setHtmlImage(null);
    };
  }, [layer.image.previewUrl]);

  useEffect(() => {
    const node = useGroupWrapper ? groupRef.current : imageRef.current;
    registerNode(layer.id, node);
    return () => {
      registerNode(layer.id, null);
    };
  }, [layer.id, registerNode, htmlImage, useGroupWrapper]);

  useEffect(() => {
    const nodes = [imageRef.current, glowRef.current].filter(Boolean) as Konva.Image[];
    if (nodes.length === 0 || !htmlImage) {
      return;
    }

    const activeFilters = getActiveKonvaFilters(layer.filters);
    for (const node of nodes) {
      node.filters(activeFilters);
      applyImageFilterAttributes(node, layer.filters);

      if (activeFilters.length > 0) {
        cacheFilteredImage(node);
      } else {
        node.clearCache();
      }
    }

    nodes[0]?.getLayer()?.batchDraw();
  }, [htmlImage, layer.filters, layer.crop, layer.cleanupStrokes, style, crop, processedCanvas]);

  if (!layer.visible || !htmlImage) {
    return null;
  }

  const displayImage = processedCanvas ?? htmlImage;
  const displayCrop = processedCanvas
    ? {
        x: 0,
        y: 0,
        width: processedCanvas.width,
        height: processedCanvas.height,
      }
    : crop;

  const sharedImageProps = {
    image: displayImage,
    crop: displayCrop,
    width: layer.width,
    height: layer.height,
  };

  const renderMainImage = (offsetX = 0, offsetY = 0) => (
    <KonvaImage
      ref={imageRef}
      {...sharedImageProps}
      x={offsetX}
      y={offsetY}
      cornerRadius={useClip ? 0 : cornerRadius}
      stroke={!useClip && style.borderWidth > 0 ? style.borderColor : undefined}
      strokeWidth={!useClip ? style.borderWidth : 0}
      shadowBlur={useDropShadow ? style.shadowBlur : 0}
      shadowColor={style.shadowColor}
      shadowOffsetY={style.shadowOffsetY}
      shadowOpacity={useDropShadow ? style.shadowOpacity : 0}
      listening={useGroupWrapper ? false : !isInteractionLocked}
    />
  );

  const renderGlowImage = () => {
    if (!useGlow) {
      return null;
    }

    return (
      <KonvaImage
        ref={glowRef}
        {...sharedImageProps}
        x={0}
        y={0}
        cornerRadius={useClip ? 0 : cornerRadius}
        opacity={0.01}
        shadowBlur={style.glowBlur}
        shadowColor={style.glowColor}
        shadowOffsetX={0}
        shadowOffsetY={0}
        shadowOpacity={style.glowOpacity}
        listening={false}
      />
    );
  };

  const groupContent = (
    <>
      {renderGlowImage()}
      {useClip ? (
        <Group
          listening={false}
          clipFunc={(context) => {
            drawImageMaskPath(
              context,
              layer.width,
              layer.height,
              style.mask,
              style.cornerRadius,
            );
          }}
        >
          {renderMainImage()}
        </Group>
      ) : (
        renderMainImage()
      )}
      {useClip ? (
        <ImageMaskBorder
          width={layer.width}
          height={layer.height}
          mask={style.mask}
          cornerRadius={style.cornerRadius}
          borderWidth={style.borderWidth}
          borderColor={style.borderColor}
        />
      ) : null}
    </>
  );

  if (useGroupWrapper) {
    return (
      <>
        <Group
          ref={groupRef}
          x={layer.x}
          y={layer.y}
          rotation={layer.rotation}
          opacity={layer.opacity}
          draggable={!layer.locked && !isInteractionLocked}
          onContextMenu={(event) => {
            event.evt.preventDefault();
            onSelect();
            onContextMenu(layer.id, event.evt.clientX, event.evt.clientY);
          }}
          {...selectionHandlers}
          {...(isInteractionLocked ? {} : dragHandlers)}
          onTransformEnd={(event) => {
            applyTransformEnd(event.target, layer, onChange);
          }}
        >
          <Rect
            width={layer.width}
            height={layer.height}
            fill="rgba(0,0,0,0.001)"
            listening={!isInteractionLocked}
          />
          {groupContent}
        </Group>
      </>
    );
  }

  return (
    <KonvaImage
        ref={imageRef}
        {...sharedImageProps}
        x={layer.x}
        y={layer.y}
        rotation={layer.rotation}
        opacity={layer.opacity}
        cornerRadius={cornerRadius}
        stroke={style.borderWidth > 0 ? style.borderColor : undefined}
        strokeWidth={style.borderWidth}
        shadowBlur={useDropShadow ? style.shadowBlur : 0}
        shadowColor={style.shadowColor}
        shadowOffsetY={style.shadowOffsetY}
        shadowOpacity={useDropShadow ? style.shadowOpacity : 0}
        draggable={!layer.locked && !isInteractionLocked}
        onContextMenu={(event) => {
          event.evt.preventDefault();
          onSelect();
          onContextMenu(layer.id, event.evt.clientX, event.evt.clientY);
        }}
        {...selectionHandlers}
        {...(isInteractionLocked ? {} : dragHandlers)}
      onTransformEnd={(event) => {
        applyTransformEnd(event.target, layer, onChange);
      }}
    />
  );
}

function TextLayerNode({
  layer,
  onSelect,
  onChange,
  registerNode,
  onContextMenu,
  snapContext,
  isAnnotationDrawing = false,
}: LayerNodeProps & { layer: Extract<EditorLayer, { type: "text" }> }) {
  const textRef = useRef<Konva.Text>(null);
  const dragHandlers = useMemo(
    () => createDragHandlers(layer, snapContext, onChange),
    [layer, onChange, snapContext],
  );
  const selectionHandlers = useMemo(
    () => createLayerSelectionHandlers(onSelect),
    [onSelect],
  );

  useEffect(() => {
    registerNode(layer.id, textRef.current);
    return () => {
      registerNode(layer.id, null);
    };
  }, [
    layer.id,
    registerNode,
    layer.text,
    layer.fontSize,
    layer.fontFamily,
    layer.fontStyle,
    layer.align,
    layer.width,
  ]);

  if (!layer.visible) {
    return null;
  }

  return (
    <Text
      ref={textRef}
      text={layer.text}
      x={layer.x}
      y={layer.y}
      width={layer.width}
      fontSize={layer.fontSize}
      fontFamily={layer.fontFamily ?? DEFAULT_TEXT_FONT_FAMILY}
      fontStyle={layer.fontStyle ?? "normal"}
      align={layer.align ?? "left"}
      fill={layer.fill}
      rotation={layer.rotation}
      opacity={layer.opacity}
      wrap="word"
      draggable={!layer.locked && !isAnnotationDrawing}
      onContextMenu={(event) => {
        event.evt.preventDefault();
        onSelect();
        onContextMenu(layer.id, event.evt.clientX, event.evt.clientY);
      }}
      {...selectionHandlers}
      {...(isAnnotationDrawing ? {} : dragHandlers)}
      onTransformEnd={(event) => {
        applyTransformEnd(event.target, layer, onChange);
      }}
    />
  );
}

function ShapeLayerNode({
  layer,
  onSelect,
  onChange,
  registerNode,
  onContextMenu,
  snapContext,
  isAnnotationDrawing = false,
}: LayerNodeProps & {
  layer: Extract<EditorLayer, { type: "shape" }>;
  isAnnotationDrawing?: boolean;
}) {
  const shapeRef = useRef<Konva.Rect | Konva.Circle | Konva.Line | Konva.Arrow | Konva.Group>(
    null,
  );
  const dragHandlers = useMemo(
    () => createDragHandlers(layer, snapContext, onChange),
    [layer, onChange, snapContext],
  );
  const selectionHandlers = useMemo(
    () => createLayerSelectionHandlers(onSelect),
    [onSelect],
  );

  useEffect(() => {
    registerNode(layer.id, shapeRef.current);
    return () => {
      registerNode(layer.id, null);
    };
  }, [
    layer.id,
    registerNode,
    layer.shape,
    layer.width,
    layer.height,
    layer.points,
  ]);

  if (!layer.visible) {
    return null;
  }

  const contextMenuHandler = (event: Konva.KonvaEventObject<PointerEvent>) => {
    event.evt.preventDefault();
    onSelect();
    onContextMenu(layer.id, event.evt.clientX, event.evt.clientY);
  };

  const commonProps = {
    opacity: layer.opacity,
    rotation: layer.rotation,
    draggable: !layer.locked && !isAnnotationDrawing,
    onContextMenu: contextMenuHandler,
    ...selectionHandlers,
    ...(isAnnotationDrawing ? {} : dragHandlers),
    onTransformEnd: (event: Konva.KonvaEventObject<Event>) => {
      applyTransformEnd(event.target, layer, onChange);
    },
    ...(layer.shadowBlur && layer.shadowBlur > 0
      ? {
          shadowBlur: layer.shadowBlur,
          shadowColor: layer.shadowColor ?? "#000000",
          shadowOffsetY: layer.shadowOffsetY ?? 0,
          shadowOpacity: layer.shadowOpacity ?? 0.35,
        }
      : {}),
  };

  const strokeColor = getStrokeColor(layer);
  const dash = layer.dashed ? [10, 6] : undefined;
  const vectorPoints = layer.points ?? [0, 0, layer.width, layer.height];

  if (layer.shape === "rectangle") {
    return (
      <Rect
        ref={shapeRef as React.RefObject<Konva.Rect>}
        x={layer.x}
        y={layer.y}
        width={layer.width}
        height={layer.height}
        fill={layer.fill}
        stroke={layer.strokeColor}
        strokeWidth={layer.strokeWidth}
        cornerRadius={layer.cornerRadius ?? 0}
        {...commonProps}
      />
    );
  }

  if (layer.shape === "circle") {
    const radius = Math.min(layer.width, layer.height) / 2;

    return (
      <Circle
        ref={shapeRef as React.RefObject<Konva.Circle>}
        x={layer.x + layer.width / 2}
        y={layer.y + layer.height / 2}
        radius={radius}
        fill={layer.fill}
        stroke={layer.strokeColor}
        strokeWidth={layer.strokeWidth}
        {...commonProps}
        onDragMove={commonProps.onDragMove}
        onDragEnd={commonProps.onDragEnd}
        onTransformEnd={(event) => {
          applyTransformEnd(event.target, layer, onChange);
        }}
      />
    );
  }

  if (layer.shape === "arrow") {
    return (
      <Arrow
        ref={shapeRef as React.RefObject<Konva.Arrow>}
        x={layer.x}
        y={layer.y}
        points={vectorPoints}
        stroke={strokeColor}
        fill={strokeColor}
        strokeWidth={layer.strokeWidth}
        pointerLength={layer.arrowHeadSize ?? 14}
        pointerWidth={layer.arrowHeadSize ?? 14}
        dash={dash}
        lineCap="round"
        hitStrokeWidth={20}
        {...commonProps}
      />
    );
  }

  if (layer.shape === "freehand" || layer.shape === "highlighter") {
    return (
      <Line
        ref={shapeRef as React.RefObject<Konva.Line>}
        x={layer.x}
        y={layer.y}
        points={vectorPoints}
        stroke={layer.shape === "highlighter" ? layer.fill : strokeColor}
        strokeWidth={layer.strokeWidth}
        tension={layer.tension ?? 0.45}
        lineCap="round"
        lineJoin="round"
        globalCompositeOperation={
          layer.blendMode === "multiply" ? "multiply" : undefined
        }
        hitStrokeWidth={Math.max(layer.strokeWidth, 16)}
        {...commonProps}
      />
    );
  }

  return (
    <Line
      ref={shapeRef as React.RefObject<Konva.Line>}
      x={layer.x}
      y={layer.y}
      points={vectorPoints}
      stroke={strokeColor}
      strokeWidth={layer.strokeWidth}
      dash={dash}
      lineCap="round"
      hitStrokeWidth={20}
      {...commonProps}
    />
  );
}

function CalloutLayerNode({
  layer,
  onSelect,
  onChange,
  registerNode,
  onContextMenu,
  snapContext,
  isAnnotationDrawing = false,
}: LayerNodeProps & {
  layer: CalloutEditorLayer;
  isAnnotationDrawing?: boolean;
}) {
  const groupRef = useRef<Konva.Group>(null);
  const dragHandlers = useMemo(
    () => createDragHandlers(layer, snapContext, onChange),
    [layer, onChange, snapContext],
  );
  const selectionHandlers = useMemo(
    () => createLayerSelectionHandlers(onSelect),
    [onSelect],
  );

  useEffect(() => {
    registerNode(layer.id, groupRef.current);
    return () => {
      registerNode(layer.id, null);
    };
  }, [
    layer.id,
    registerNode,
    layer.width,
    layer.height,
    layer.text,
    layer.calloutType,
  ]);

  if (!layer.visible) {
    return null;
  }

  const contextMenuHandler = (event: Konva.KonvaEventObject<PointerEvent>) => {
    event.evt.preventDefault();
    onSelect();
    onContextMenu(layer.id, event.evt.clientX, event.evt.clientY);
  };

  const commonGroupProps = {
    x: layer.x,
    y: layer.y,
    rotation: layer.rotation,
    opacity: layer.opacity,
    draggable: !layer.locked && !isAnnotationDrawing,
    onContextMenu: contextMenuHandler,
    ...selectionHandlers,
    ...(isAnnotationDrawing ? {} : dragHandlers),
    onTransformEnd: (event: Konva.KonvaEventObject<Event>) => {
      applyTransformEnd(event.target, layer, onChange);
    },
  };

  if (layer.calloutType === "numbered-marker") {
    const radius = Math.min(layer.width, layer.height) / 2;

    return (
      <Group ref={groupRef} {...commonGroupProps}>
        <Circle
          x={layer.width / 2}
          y={layer.height / 2}
          radius={radius}
          fill={layer.fill}
          stroke="#1d1d1f"
          strokeWidth={2}
          listening={false}
        />
        <Text
          x={0}
          y={layer.height / 2 - layer.fontSize / 2}
          width={layer.width}
          text={layer.text}
          fontSize={layer.fontSize}
          fontStyle="bold"
          align="center"
          fill={layer.textColor}
          listening={false}
        />
      </Group>
    );
  }

  const cornerRadius =
    layer.cornerRadius ?? (layer.calloutType === "label" ? 999 : 12);

  return (
    <Group ref={groupRef} {...commonGroupProps}>
      <Rect
        x={0}
        y={0}
        width={layer.width}
        height={layer.height - (layer.calloutType === "speech-bubble" ? 12 : 0)}
        fill={layer.fill}
        stroke="#1d1d1f"
        strokeWidth={1.5}
        cornerRadius={cornerRadius}
        shadowBlur={8}
        shadowColor="#000000"
        shadowOffsetY={2}
        shadowOpacity={0.12}
        listening={false}
      />
      {layer.calloutType === "speech-bubble" ? (
        <Line
          points={[
            layer.width * 0.25,
            layer.height - 12,
            layer.width * 0.15,
            layer.height,
            layer.width * 0.35,
            layer.height - 12,
          ]}
          fill={layer.fill}
          closed
          stroke="#1d1d1f"
          strokeWidth={1.5}
          listening={false}
        />
      ) : null}
      <Text
        x={12}
        y={12}
        width={layer.width - 24}
        height={layer.height - 24}
        text={layer.text}
        fontSize={layer.fontSize}
        fill={layer.textColor}
        align="center"
        verticalAlign="middle"
        listening={false}
      />
    </Group>
  );
}

function EditorLayerNode(props: LayerNodeProps) {
  const { layer } = props;

  switch (layer.type) {
    case "image":
      return <ImageLayerNode {...props} layer={layer} />;
    case "text":
      return <TextLayerNode {...props} layer={layer} />;
    case "shape":
      return <ShapeLayerNode {...props} layer={layer} />;
    case "callout":
      return <CalloutLayerNode {...props} layer={layer} />;
  }
}

interface KonvaEditorStageProps {
  layers: EditorLayer[];
  selectedLayerId: string | null;
  stageWidth: number;
  stageHeight: number;
  background: StageBackground;
  onSelectLayer: (layerId: string | null) => void;
  onLayerChange: (layerId: string, update: LayerTransformUpdate) => void;
  onStageRef: (stage: Konva.Stage | null) => void;
  getContextMenuItems?: (layerId: string) => LayerContextMenuItem[];
  cropEditingLayerId?: string | null;
  onCropChange?: (layerId: string, crop: ImageSourceCrop) => void;
  cleanupTool?: CleanupToolId;
  brushSize?: number;
  brushIntensity?: number;
  onCleanupStrokeStart?: () => void;
  onCleanupStrokePreview?: (
    layerId: string,
    strokes: CleanupBrushStroke[],
  ) => void;
  onCoverPatchComplete?: (rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => void;
  editorTool?: EditorToolId;
  drawingSettings?: DrawingToolSettings;
  onLineComplete?: (geometry: {
    shape: "line" | "arrow";
    x: number;
    y: number;
    width: number;
    height: number;
    points: number[];
  }) => void;
  onFreehandComplete?: (geometry: {
    shape: "freehand" | "highlighter";
    x: number;
    y: number;
    width: number;
    height: number;
    points: number[];
  }) => void;
  onCalloutComplete?: (geometry: {
    calloutType: CalloutKind;
    x: number;
    y: number;
    width: number;
    height: number;
  }) => void;
}

export function KonvaEditorStage({
  layers,
  selectedLayerId,
  stageWidth,
  stageHeight,
  background,
  onSelectLayer,
  onLayerChange,
  onStageRef,
  getContextMenuItems,
  cropEditingLayerId = null,
  onCropChange,
  cleanupTool = "select",
  brushSize = 32,
  brushIntensity = 12,
  onCleanupStrokeStart,
  onCleanupStrokePreview,
  onCoverPatchComplete,
  editorTool = "select",
  drawingSettings,
  onLineComplete,
  onFreehandComplete,
  onCalloutComplete,
}: KonvaEditorStageProps) {
  const transformerRef = useRef<Konva.Transformer>(null);
  const nodeMapRef = useRef<Map<string, TransformableNode>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const dimensionsRef = useRef({ stageWidth, stageHeight });
  const [fitScale, setFitScale] = useState(1);
  const [zoomMultiplier, setZoomMultiplier] = useState(1);
  const [snapGuides, setSnapGuides] = useState<SnapGuideLine[]>([]);
  const [contextMenu, setContextMenu] = useState<{
    layerId: string;
    x: number;
    y: number;
  } | null>(null);
  const [nodeRegistryVersion, setNodeRegistryVersion] = useState(0);

  const effectiveScale = fitScale * zoomMultiplier;
  const stagePixelWidth = stageWidth * effectiveScale;
  const stagePixelHeight = stageHeight * effectiveScale;

  const registerNode = useCallback(
    (layerId: string, node: TransformableNode | null) => {
      if (node) {
        nodeMapRef.current.set(layerId, node);
      } else {
        nodeMapRef.current.delete(layerId);
      }

      setNodeRegistryVersion((version) => version + 1);
    },
    [],
  );

  const updateFitScale = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const previousDimensions = dimensionsRef.current;
    if (
      previousDimensions.stageWidth !== stageWidth ||
      previousDimensions.stageHeight !== stageHeight
    ) {
      dimensionsRef.current = { stageWidth, stageHeight };
      setZoomMultiplier(1);
    }

    setFitScale(container.clientWidth / stageWidth);
  }, [stageHeight, stageWidth]);

  useEffect(() => {
    updateFitScale();
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const observer = new ResizeObserver(updateFitScale);
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [updateFitScale]);

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) {
      return;
    }

    const selectedLayer = layers.find((layer) => layer.id === selectedLayerId);
    const isCleanupToolActive =
      cleanupTool === "blur-brush" ||
      cleanupTool === "pixelate-brush" ||
      cleanupTool === "cover-patch";
    const isAnnotationToolActive = isAnnotationTool(editorTool);
    const node =
      selectedLayer &&
      !selectedLayer.locked &&
      !cropEditingLayerId &&
      !isCleanupToolActive &&
      !isAnnotationToolActive
        ? nodeMapRef.current.get(selectedLayerId ?? "")
        : null;

    if (node) {
      transformer.nodes([node]);
    } else {
      transformer.nodes([]);
    }

    transformer.getLayer()?.batchDraw();
  }, [
    cleanupTool,
    cropEditingLayerId,
    editorTool,
    layers,
    nodeRegistryVersion,
    selectedLayerId,
  ]);

  const selectedLayer = layers.find((layer) => layer.id === selectedLayerId);
  const selectedImageLayer =
    selectedLayer?.type === "image" ? selectedLayer : null;
  const isBlurBrushActive = cleanupTool === "blur-brush";
  const isPixelateBrushActive = cleanupTool === "pixelate-brush";
  const isCoverPatchActive = cleanupTool === "cover-patch";
  const isBrushToolActive = isBlurBrushActive || isPixelateBrushActive;
  const isAnnotationToolActive = isAnnotationTool(editorTool);
  const canPaintSelectedImage =
    selectedImageLayer !== null &&
    !selectedImageLayer.locked &&
    isBrushToolActive &&
    editorTool === "select";

  const snapContext = useMemo<SnapContext>(
    () => ({
      stageWidth,
      stageHeight,
      layers,
      onGuidesChange: setSnapGuides,
    }),
    [layers, stageHeight, stageWidth],
  );

  const handleContextMenu = useCallback(
    (layerId: string, clientX: number, clientY: number) => {
      if (!getContextMenuItems) {
        return;
      }

      setContextMenu({ layerId, x: clientX, y: clientY });
    },
    [getContextMenuItems],
  );

  const contextMenuItems =
    contextMenu && getContextMenuItems
      ? getContextMenuItems(contextMenu.layerId)
      : [];

  const backgroundFillProps = useMemo(
    () => getStageBackgroundFillProps(background, stageWidth, stageHeight),
    [background, stageHeight, stageWidth],
  );

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-auto rounded-lg ${
        background.transparent ? "checkerboard" : ""
      }`}
      style={{
        maxHeight: "min(70vh, 720px)",
        cursor: EDITOR_TOOL_CURSORS[editorTool],
      }}
    >
      <CanvasZoomControls
        zoomPercent={Math.round(zoomMultiplier * 100)}
        onZoomIn={() => {
          setZoomMultiplier((current) =>
            Math.min(MAX_ZOOM, current * ZOOM_STEP),
          );
        }}
        onZoomOut={() => {
          setZoomMultiplier((current) =>
            Math.max(MIN_ZOOM, current / ZOOM_STEP),
          );
        }}
        onResetZoom={() => {
          setZoomMultiplier(1);
        }}
        onFitToScreen={() => {
          setZoomMultiplier(1);
          updateFitScale();
        }}
      />

      <div
        className="mx-auto"
        style={{
          width: stagePixelWidth,
          height: stagePixelHeight,
        }}
      >
        <Stage
          ref={onStageRef}
          width={stagePixelWidth}
          height={stagePixelHeight}
          scaleX={effectiveScale}
          scaleY={effectiveScale}
          onMouseDown={(event) => {
            const target = event.target;
            const clickedEmpty =
              target === target.getStage() ||
              target.name() === "stage-background";

            if (clickedEmpty) {
              onSelectLayer(null);
              setContextMenu(null);
            }
          }}
          onTouchStart={(event) => {
            const target = event.target;
            const clickedEmpty =
              target === target.getStage() ||
              target.name() === "stage-background";

            if (clickedEmpty) {
              onSelectLayer(null);
              setContextMenu(null);
            }
          }}
        >
          <Layer>
            {!background.transparent ? (
              <Rect
                name="stage-background"
                x={0}
                y={0}
                width={stageWidth}
                height={stageHeight}
                listening={true}
                {...backgroundFillProps}
              />
            ) : null}

            {snapGuides.map((guide, index) =>
              guide.orientation === "vertical" ? (
                <Line
                  key={`guide-v-${index}`}
                  name="snap-guide"
                  points={[guide.position, 0, guide.position, stageHeight]}
                  stroke="#0071e3"
                  strokeWidth={1}
                  dash={[6, 4]}
                  listening={false}
                />
              ) : (
                <Line
                  key={`guide-h-${index}`}
                  name="snap-guide"
                  points={[0, guide.position, stageWidth, guide.position]}
                  stroke="#0071e3"
                  strokeWidth={1}
                  dash={[6, 4]}
                  listening={false}
                />
              ),
            )}

            {layers.map((layer) => (
              <EditorLayerNode
                key={layer.id}
                layer={layer}
                onSelect={() => onSelectLayer(layer.id)}
                onChange={(update) => onLayerChange(layer.id, update)}
                registerNode={registerNode}
                onContextMenu={handleContextMenu}
                snapContext={snapContext}
                cropEditingLayerId={cropEditingLayerId}
                isCleanupPainting={
                  canPaintSelectedImage && layer.id === selectedImageLayer?.id
                }
                isAnnotationDrawing={isAnnotationToolActive}
              />
            ))}

            {cropEditingLayerId && onCropChange
              ? (() => {
                  const cropLayer = layers.find(
                    (layer): layer is ImageEditorLayer =>
                      layer.id === cropEditingLayerId && layer.type === "image",
                  );
                  if (!cropLayer) {
                    return null;
                  }

                  return (
                    <ImageCropEditor
                      layer={cropLayer}
                      onCropChange={(nextCrop) =>
                        onCropChange(cropLayer.id, nextCrop)
                      }
                    />
                  );
                })()
              : null}

            {canPaintSelectedImage &&
            selectedImageLayer &&
            onCleanupStrokeStart &&
            onCleanupStrokePreview ? (
              <CleanupBrushOverlay
                layer={selectedImageLayer}
                brushType={isBlurBrushActive ? "blur" : "pixelate"}
                brushSize={brushSize}
                intensity={brushIntensity}
                existingStrokes={selectedImageLayer.cleanupStrokes ?? []}
                onStrokeStart={onCleanupStrokeStart}
                onStrokePreview={(strokes) =>
                  onCleanupStrokePreview(selectedImageLayer.id, strokes)
                }
                onStrokeComplete={() => undefined}
              />
            ) : null}

            {isCoverPatchActive && onCoverPatchComplete && editorTool === "select" ? (
              <CoverPatchOverlay
                stageWidth={stageWidth}
                stageHeight={stageHeight}
                onCoverPatchComplete={onCoverPatchComplete}
              />
            ) : null}

            {isAnnotationToolActive &&
            drawingSettings &&
            onLineComplete &&
            onFreehandComplete &&
            onCalloutComplete ? (
              <AnnotationDrawOverlay
                editorTool={editorTool}
                drawingSettings={drawingSettings}
                stageWidth={stageWidth}
                stageHeight={stageHeight}
                onLineComplete={onLineComplete}
                onFreehandComplete={onFreehandComplete}
                onCalloutComplete={onCalloutComplete}
              />
            ) : null}

            <Transformer
              ref={transformerRef}
              rotateEnabled={
                !selectedLayer?.locked &&
                !cropEditingLayerId &&
                !isBrushToolActive &&
                !isCoverPatchActive &&
                !isAnnotationToolActive
              }
              enabledAnchors={
                selectedLayer?.locked ||
                cropEditingLayerId ||
                isBrushToolActive ||
                isCoverPatchActive ||
                isAnnotationToolActive
                  ? []
                  : selectedLayer?.type === "shape" &&
                      isVectorShape(selectedLayer)
                    ? [
                        "top-left",
                        "top-right",
                        "bottom-left",
                        "bottom-right",
                        "middle-left",
                        "middle-right",
                        "top-center",
                        "bottom-center",
                      ]
                    : [
                        "top-left",
                        "top-right",
                        "bottom-left",
                        "bottom-right",
                        "middle-left",
                        "middle-right",
                        "top-center",
                        "bottom-center",
                      ]
              }
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 8 || newBox.height < 8) {
                  return oldBox;
                }

                return newBox;
              }}
            />
          </Layer>
        </Stage>
      </div>

      <LayerContextMenu
        open={contextMenu !== null}
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        items={contextMenuItems}
        onClose={() => {
          setContextMenu(null);
        }}
      />
    </div>
  );
}
