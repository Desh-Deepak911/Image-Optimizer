"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Konva from "konva";
import {
  Circle,
  Image as KonvaImage,
  Layer,
  Line,
  Rect,
  Stage,
  Text,
  Transformer,
} from "react-konva";
import {
  applyImageFilterAttributes,
  cacheFilteredImage,
  getActiveKonvaFilters,
} from "@/lib/konva/imageFilters";
import type {
  EditorLayer,
  LayerTransformUpdate,
  StageBackground,
} from "@/types/konvaEditor";

type TransformableNode = Konva.Node;

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
      x: node.x(),
      y: node.y(),
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

  onChange({
    x: node.x(),
    y: node.y(),
    width: Math.max(20, node.width() * scaleX),
    height: Math.max(20, node.height() * scaleY),
    rotation: node.rotation(),
  });
}

interface LayerNodeProps {
  layer: EditorLayer;
  onSelect: () => void;
  onChange: (update: LayerTransformUpdate) => void;
  registerNode: (layerId: string, node: TransformableNode | null) => void;
}

function ImageLayerNode({
  layer,
  onSelect,
  onChange,
  registerNode,
}: LayerNodeProps & { layer: Extract<EditorLayer, { type: "image" }> }) {
  const imageRef = useRef<Konva.Image>(null);
  const [htmlImage, setHtmlImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.onload = () => setHtmlImage(img);
    img.src = layer.image.previewUrl;

    return () => {
      setHtmlImage(null);
    };
  }, [layer.image.previewUrl]);

  useEffect(() => {
    registerNode(layer.id, imageRef.current);
    return () => {
      registerNode(layer.id, null);
    };
  }, [layer.id, registerNode, htmlImage]);

  useEffect(() => {
    const node = imageRef.current;
    if (!node || !htmlImage) {
      return;
    }

    const activeFilters = getActiveKonvaFilters(layer.filters);
    node.filters(activeFilters);
    applyImageFilterAttributes(node, layer.filters);

    if (activeFilters.length > 0) {
      cacheFilteredImage(node);
    } else {
      node.clearCache();
      node.getLayer()?.batchDraw();
    }
  }, [htmlImage, layer.filters]);

  if (!layer.visible || !htmlImage) {
    return null;
  }

  return (
    <KonvaImage
      ref={imageRef}
      image={htmlImage}
      x={layer.x}
      y={layer.y}
      width={layer.width}
      height={layer.height}
      rotation={layer.rotation}
      opacity={layer.opacity}
      draggable={!layer.locked}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(event) => {
        onChange({
          x: event.target.x(),
          y: event.target.y(),
        });
      }}
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
}: LayerNodeProps & { layer: Extract<EditorLayer, { type: "text" }> }) {
  const textRef = useRef<Konva.Text>(null);

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
      onDragEnd={(event) => {
        onChange({
          x: event.target.x(),
          y: event.target.y(),
        });
      }}
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
}: LayerNodeProps & { layer: Extract<EditorLayer, { type: "shape" }> }) {
  const shapeRef = useRef<Konva.Rect | Konva.Circle | Konva.Line>(null);

  useEffect(() => {
    registerNode(layer.id, shapeRef.current);
    return () => {
      registerNode(layer.id, null);
    };
  }, [layer.id, registerNode, layer.shape, layer.width, layer.height]);

  if (!layer.visible) {
    return null;
  }

  const commonProps = {
    opacity: layer.opacity,
    rotation: layer.rotation,
    draggable: !layer.locked,
    onClick: onSelect,
    onTap: onSelect,
    onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) => {
      onChange({
        x: event.target.x(),
        y: event.target.y(),
      });
    },
    onTransformEnd: (event: Konva.KonvaEventObject<Event>) => {
      applyTransformEnd(event.target, layer, onChange);
    },
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
        onDragEnd={(event) => {
          const node = event.target;
          onChange({
            x: node.x() - layer.width / 2,
            y: node.y() - layer.height / 2,
          });
        }}
        onTransformEnd={(event) => {
          const node = event.target as Konva.Circle;
          const scale = Math.max(node.scaleX(), node.scaleY());
          node.scaleX(1);
          node.scaleY(1);
          const nextSize = Math.max(20, Math.min(layer.width, layer.height) * scale);
          onChange({
            x: node.x() - nextSize / 2,
            y: node.y() - nextSize / 2,
            width: nextSize,
            height: nextSize,
            rotation: node.rotation(),
          });
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
}: KonvaEditorStageProps) {
  const transformerRef = useRef<Konva.Transformer>(null);
  const nodeMapRef = useRef<Map<string, TransformableNode>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayScale, setDisplayScale] = useState(1);

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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const updateScale = () => {
      setDisplayScale(container.clientWidth / stageWidth);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [stageWidth]);

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) {
      return;
    }

    const selectedLayer = layers.find((layer) => layer.id === selectedLayerId);
    const node =
      selectedLayer && !selectedLayer.locked
        ? nodeMapRef.current.get(selectedLayerId ?? "")
        : null;

    if (node) {
      transformer.nodes([node]);
    } else {
      transformer.nodes([]);
    }

    transformer.getLayer()?.batchDraw();
  }, [layers, selectedLayerId]);

  const selectedLayer = layers.find((layer) => layer.id === selectedLayerId);

  return (
    <div
      ref={containerRef}
      className={`w-full rounded-lg ${background.transparent ? "checkerboard" : ""}`}
    >
      <Stage
        ref={onStageRef}
        width={stageWidth * displayScale}
        height={stageHeight * displayScale}
        scaleX={displayScale}
        scaleY={displayScale}
        onMouseDown={(event) => {
          if (event.target === event.target.getStage()) {
            onSelectLayer(null);
          }
        }}
        onTouchStart={(event) => {
          if (event.target === event.target.getStage()) {
            onSelectLayer(null);
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
              fill={background.color}
              listening={false}
            />
          ) : null}

          {layers.map((layer) => (
            <EditorLayerNode
              key={layer.id}
              layer={layer}
              onSelect={() => onSelectLayer(layer.id)}
              onChange={(update) => onLayerChange(layer.id, update)}
              registerNode={registerNode}
            />
          ))}

          <Transformer
            ref={transformerRef}
            rotateEnabled={!selectedLayer?.locked}
            enabledAnchors={
              selectedLayer?.locked
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
  );
}
