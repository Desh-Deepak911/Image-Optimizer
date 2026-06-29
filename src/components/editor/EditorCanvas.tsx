"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { buildFrameRenderInput, drawFrame } from "@/lib/render/drawFrame";
import { getFramingContext } from "@/lib/render/framingContext";
import type { FrameDimensions } from "@/lib/render/types";
import type { SourceTransform } from "@/types/editor";
import type { OptimizerSettings, UploadedImage } from "@/types/optimizer";

export interface EditorCanvasHandle {
  frame: FrameDimensions | null;
  displayScale: number;
}

interface EditorCanvasProps {
  image: UploadedImage;
  settings: OptimizerSettings;
  transform: SourceTransform;
  onDisplayScaleChange?: (scale: number) => void;
}

export const EditorCanvas = forwardRef<EditorCanvasHandle, EditorCanvasProps>(
  function EditorCanvas(
    { image, settings, transform, onDisplayScaleChange },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const imageElementRef = useRef<HTMLImageElement | null>(null);
    const [frame, setFrame] = useState<FrameDimensions | null>(null);
    const [displayScale, setDisplayScale] = useState(1);

    const updateDisplayScale = useCallback(() => {
      const wrapper = wrapperRef.current;
      const currentFrame = frame;

      if (!wrapper || !currentFrame) {
        return;
      }

      const nextScale = wrapper.clientWidth / currentFrame.width;
      setDisplayScale(nextScale);
      onDisplayScaleChange?.(nextScale);
    }, [frame, onDisplayScaleChange]);

    useImperativeHandle(
      ref,
      () => ({
        frame,
        displayScale,
      }),
      [displayScale, frame],
    );

    useEffect(() => {
      const wrapper = wrapperRef.current;
      if (!wrapper || !frame) {
        return;
      }

      updateDisplayScale();

      const observer = new ResizeObserver(updateDisplayScale);
      observer.observe(wrapper);

      return () => {
        observer.disconnect();
      };
    }, [frame, updateDisplayScale]);

    useEffect(() => {
      let cancelled = false;
      const img = new window.Image();

      const render = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d", {
          alpha: settings.exportFormat !== "jpeg",
        });

        if (!canvas || !ctx) {
          return;
        }

        const framing = getFramingContext(image, settings);
        canvas.width = framing.frame.width;
        canvas.height = framing.frame.height;
        setFrame(framing.frame);

        const input = buildFrameRenderInput({
          source: framing.source,
          aspectRatio: settings.aspectRatio,
          fitMode: settings.fitMode,
          outputWidth: framing.outputWidth,
          exportFormat: settings.exportFormat,
          transform,
        });

        drawFrame(ctx, img, input, framing.frame);
      };

      img.onload = () => {
        if (cancelled) {
          return;
        }

        imageElementRef.current = img;
        render();
      };

      img.onerror = () => {
        imageElementRef.current = null;
      };

      if (imageElementRef.current?.src === image.previewUrl) {
        render();
      } else {
        img.src = image.previewUrl;
      }

      return () => {
        cancelled = true;
      };
    }, [image, settings, transform]);

    return (
      <div ref={wrapperRef} className="w-full">
        <canvas
          ref={canvasRef}
          className="block h-auto w-full rounded-lg shadow-sm"
          aria-label={`Editor preview of ${image.name}`}
        />
      </div>
    );
  },
);
