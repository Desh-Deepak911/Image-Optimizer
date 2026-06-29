"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Konva from "konva";
import {
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
import { CanvasZoomControls } from "@/components/advanced/CanvasZoomControls";
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
import {
  drawImageMaskPath,
  getImageCornerRadius,
  hasActiveDropShadow,
  hasActiveGlow,
  usesImageClipMask,
} from "@/lib/konva/imageLayerRender";
import { getLayerBounds, type LayerBounds } from "@/lib/konva/layerBounds";
import {
  snapLayerPosition,
  type SnapGuideLine,
} from "@/lib/konva/snapGuides";
import type {
  EditorLayer,
  ImageEditorLayer,
  ImageSourceCrop,
  LayerTransformUpdate,
  StageBackground,
} from "@/types/konvaEditor";
import { DEFAULT_IMAGE_LAYER_STYLE } from "@/types/konvaEditor";

type TransformableNode = Konva.Node;

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_STEP = 1.2;

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

  if (layer.type === "shape" && layer.shape === "line") {
    const lineNode = node as Konva.Line;
    const points = lineNode.points();
    const nextWidth = Math.max(4, Math.abs(points[2] - points[0]) * scaleX);
    const nextHeight = Math.max(0, Math.abs(points[3] - points[1]) * scaleY);

    lineNode.points([0, 0, nextWidth, nextHeight]);

    onChange({
      x: node.x(),
      y: node.y(),
      width: nextWidth,
      height: nextHeight,
      rotation: node.rotation(),
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

  if (layer.type === "shape" && layer.shape === "line") {
    return {
      x: node.x(),
      y: node.y(),
      width: layer.width,
      height: layer.height,
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

  return getLayerBounds(layer);
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

interface LayerNodeProps {
  layer: EditorLayer;
  onSelect: () => void;
  onChange: (update: LayerTransformUpdate) => void;
  registerNode: (layerId: string, node: TransformableNode | null) => void;
  onContextMenu: (layerId: string, clientX: number, clientY: number) => void;
  snapContext: SnapContext;
  cropEditingLayerId?: string | null;
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
}: LayerNodeProps & { layer: ImageEditorLayer }) {
  const groupRef = useRef<Konva.Group>(null);
  const imageRef = useRef<Konva.Image>(null);
  const glowRef = useRef<Konva.Image>(null);
  const [htmlImage, setHtmlImage] = useState<HTMLImageElement | null>(null);
  const dragHandlers = useMemo(
    () => createDragHandlers(layer, snapContext, onChange),
    [layer, onChange, snapContext],
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
  }, [htmlImage, layer.filters, layer.crop, style, crop]);

  if (!layer.visible || !htmlImage) {
    return null;
  }

  const sharedImageProps = {
    image: htmlImage,
    crop,
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
      listening={!isCropEditing}
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
          draggable={!layer.locked && !isCropEditing}
          onClick={onSelect}
          onTap={onSelect}
          onContextMenu={(event) => {
            event.evt.preventDefault();
            onSelect();
            onContextMenu(layer.id, event.evt.clientX, event.evt.clientY);
          }}
          {...(isCropEditing ? {} : dragHandlers)}
          onTransformEnd={(event) => {
            applyTransformEnd(event.target, layer, onChange);
          }}
        >
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
        draggable={!layer.locked && !isCropEditing}
        onClick={onSelect}
        onTap={onSelect}
        onContextMenu={(event) => {
          event.evt.preventDefault();
          onSelect();
          onContextMenu(layer.id, event.evt.clientX, event.evt.clientY);
        }}
        {...(isCropEditing ? {} : dragHandlers)}
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
}: LayerNodeProps & { layer: Extract<EditorLayer, { type: "text" }> }) {
  const textRef = useRef<Konva.Text>(null);
  const dragHandlers = useMemo(
    () => createDragHandlers(layer, snapContext, onChange),
    [layer, onChange, snapContext],
  );

  useEffect(() => {
    registerNode(layer.id, textRef.current);
    return () => {
      registerNode(layer.id, null);
    };
  }, [layer.id, registerNode, layer.text, layer.fontSize]);

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
      fill={layer.fill}
      rotation={layer.rotation}
      opacity={layer.opacity}
      draggable={!layer.locked}
      onClick={onSelect}
      onTap={onSelect}
      onContextMenu={(event) => {
        event.evt.preventDefault();
        onSelect();
        onContextMenu(layer.id, event.evt.clientX, event.evt.clientY);
      }}
      {...dragHandlers}
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
}: LayerNodeProps & { layer: Extract<EditorLayer, { type: "shape" }> }) {
  const shapeRef = useRef<Konva.Rect | Konva.Circle | Konva.Line>(null);
  const dragHandlers = useMemo(
    () => createDragHandlers(layer, snapContext, onChange),
    [layer, onChange, snapContext],
  );

  useEffect(() => {
    registerNode(layer.id, shapeRef.current);
    return () => {
      registerNode(layer.id, null);
    };
  }, [layer.id, registerNode, layer.shape, layer.width, layer.height]);

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
    draggable: !layer.locked,
    onClick: onSelect,
    onTap: onSelect,
    onContextMenu: contextMenuHandler,
    ...dragHandlers,
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

  if (layer.shape === "rectangle") {
    return (
      <Rect
        ref={shapeRef as React.RefObject<Konva.Rect>}
        x={layer.x}
        y={layer.y}
        width={layer.width}
        height={layer.height}
        fill={layer.fill}
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
        {...commonProps}
        onDragMove={commonProps.onDragMove}
        onDragEnd={commonProps.onDragEnd}
        onTransformEnd={(event) => {
          applyTransformEnd(event.target, layer, onChange);
        }}
      />
    );
  }

  return (
    <Line
      ref={shapeRef as React.RefObject<Konva.Line>}
      x={layer.x}
      y={layer.y}
      points={[0, 0, layer.width, layer.height]}
      stroke={layer.fill}
      strokeWidth={layer.strokeWidth}
      lineCap="round"
      hitStrokeWidth={20}
      {...commonProps}
    />
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
    const node =
      selectedLayer && !selectedLayer.locked && !cropEditingLayerId
        ? nodeMapRef.current.get(selectedLayerId ?? "")
        : null;

    if (node) {
      transformer.nodes([node]);
    } else {
      transformer.nodes([]);
    }

    transformer.getLayer()?.batchDraw();
  }, [cropEditingLayerId, layers, selectedLayerId]);

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

  const selectedLayer = layers.find((layer) => layer.id === selectedLayerId);
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
      style={{ maxHeight: "min(70vh, 720px)" }}
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
            if (event.target === event.target.getStage()) {
              onSelectLayer(null);
              setContextMenu(null);
            }
          }}
          onTouchStart={(event) => {
            if (event.target === event.target.getStage()) {
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
                listening={false}
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

            <Transformer
              ref={transformerRef}
              rotateEnabled={!selectedLayer?.locked && !cropEditingLayerId}
              enabledAnchors={
                selectedLayer?.locked || cropEditingLayerId
                  ? []
                  : selectedLayer?.type === "shape" &&
                      selectedLayer.shape === "line"
                    ? ["middle-left", "middle-right"]
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
