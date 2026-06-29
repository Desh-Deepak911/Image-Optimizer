"use client";

import { useRef } from "react";
import { Circle, Group, Rect } from "react-konva";
import type Konva from "konva";
import {
  clampImageCrop,
  getEffectiveImageCrop,
} from "@/lib/konva/imageCrop";
import type { ImageEditorLayer, ImageSourceCrop } from "@/types/konvaEditor";

interface ImageCropEditorProps {
  layer: ImageEditorLayer;
  onCropChange: (crop: ImageSourceCrop) => void;
}

function layerDeltaToCropDelta(
  delta: number,
  layerExtent: number,
  cropExtent: number,
): number {
  if (layerExtent === 0) {
    return 0;
  }

  return delta * (cropExtent / layerExtent);
}

function CropHandle({
  x,
  y,
  cursor,
  onDragStart,
  onDrag,
}: {
  x: number;
  y: number;
  cursor: string;
  onDragStart: () => void;
  onDrag: (dx: number, dy: number) => void;
}) {
  const originRef = useRef<{ x: number; y: number } | null>(null);

  return (
    <Circle
      x={x}
      y={y}
      radius={7}
      fill="#ffffff"
      stroke="#0071e3"
      strokeWidth={2}
      name="crop-guide"
      draggable
      onMouseEnter={(event) => {
        const stage = event.target.getStage();
        if (stage) {
          stage.container().style.cursor = cursor;
        }
      }}
      onMouseLeave={(event) => {
        const stage = event.target.getStage();
        if (stage) {
          stage.container().style.cursor = "default";
        }
      }}
      onDragStart={(event) => {
        onDragStart();
        originRef.current = { x: event.target.x(), y: event.target.y() };
      }}
      onDragMove={(event) => {
        if (!originRef.current) {
          return;
        }

        const dx = event.target.x() - originRef.current.x;
        const dy = event.target.y() - originRef.current.y;
        onDrag(dx, dy);
        event.target.position({
          x: originRef.current.x + dx,
          y: originRef.current.y + dy,
        });
      }}
      onDragEnd={(event) => {
        originRef.current = null;
        event.target.position({ x, y });
      }}
    />
  );
}

export function ImageCropEditor({
  layer,
  onCropChange,
}: ImageCropEditorProps) {
  const cropStartRef = useRef<ImageSourceCrop>(
    getEffectiveImageCrop(layer.crop, layer.image.width, layer.image.height),
  );
  const panOriginRef = useRef<{ x: number; y: number } | null>(null);

  const updateCrop = (nextCrop: ImageSourceCrop) => {
    onCropChange(
      clampImageCrop(nextCrop, layer.image.width, layer.image.height),
    );
  };

  const beginCropDrag = () => {
    cropStartRef.current = getEffectiveImageCrop(
      layer.crop,
      layer.image.width,
      layer.image.height,
    );
  };

  const handlePanDragMove = (event: Konva.KonvaEventObject<DragEvent>) => {
    if (!panOriginRef.current) {
      return;
    }

    const dx = event.target.x() - panOriginRef.current.x;
    const dy = event.target.y() - panOriginRef.current.y;
    const start = cropStartRef.current;

    updateCrop({
      x: start.x - layerDeltaToCropDelta(dx, layer.width, start.width),
      y: start.y - layerDeltaToCropDelta(dy, layer.height, start.height),
      width: start.width,
      height: start.height,
    });
  };

  return (
    <Group listening>
      <Rect
        x={layer.x}
        y={layer.y}
        width={layer.width}
        height={layer.height}
        rotation={layer.rotation}
        stroke="#0071e3"
        strokeWidth={2}
        dash={[8, 4]}
        fill="rgba(0,113,227,0.08)"
        name="crop-guide"
        draggable
        onDragStart={(event) => {
          beginCropDrag();
          panOriginRef.current = { x: event.target.x(), y: event.target.y() };
        }}
        onDragMove={handlePanDragMove}
        onDragEnd={(event) => {
          panOriginRef.current = null;
          event.target.position({ x: layer.x, y: layer.y });
        }}
      />

      <Group x={layer.x} y={layer.y} rotation={layer.rotation}>
        <CropHandle
          x={0}
          y={0}
          cursor="nwse-resize"
          onDragStart={beginCropDrag}
          onDrag={(dx, dy) => {
            const start = cropStartRef.current;
            const deltaX = layerDeltaToCropDelta(dx, layer.width, start.width);
            const deltaY = layerDeltaToCropDelta(dy, layer.height, start.height);
            updateCrop({
              x: start.x + deltaX,
              y: start.y + deltaY,
              width: start.width - deltaX,
              height: start.height - deltaY,
            });
          }}
        />
        <CropHandle
          x={layer.width}
          y={0}
          cursor="nesw-resize"
          onDragStart={beginCropDrag}
          onDrag={(dx, dy) => {
            const start = cropStartRef.current;
            updateCrop({
              x: start.x,
              y:
                start.y +
                layerDeltaToCropDelta(dy, layer.height, start.height),
              width:
                start.width + layerDeltaToCropDelta(dx, layer.width, start.width),
              height: start.height - layerDeltaToCropDelta(dy, layer.height, start.height),
            });
          }}
        />
        <CropHandle
          x={0}
          y={layer.height}
          cursor="nesw-resize"
          onDragStart={beginCropDrag}
          onDrag={(dx, dy) => {
            const start = cropStartRef.current;
            updateCrop({
              x: start.x + layerDeltaToCropDelta(dx, layer.width, start.width),
              y: start.y,
              width: start.width - layerDeltaToCropDelta(dx, layer.width, start.width),
              height:
                start.height + layerDeltaToCropDelta(dy, layer.height, start.height),
            });
          }}
        />
        <CropHandle
          x={layer.width}
          y={layer.height}
          cursor="nwse-resize"
          onDragStart={beginCropDrag}
          onDrag={(dx, dy) => {
            const start = cropStartRef.current;
            updateCrop({
              x: start.x,
              y: start.y,
              width:
                start.width + layerDeltaToCropDelta(dx, layer.width, start.width),
              height:
                start.height + layerDeltaToCropDelta(dy, layer.height, start.height),
            });
          }}
        />
      </Group>
    </Group>
  );
}
