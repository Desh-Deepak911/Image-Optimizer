"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { validateImageFile } from "@/lib/imageValidation";
import { useEditorHistory } from "@/hooks/useEditorHistory";
import {
  alignEditorLayer,
  centerEditorLayer,
  type LayerAlignment,
} from "@/lib/konva/layerBounds";
import {
  fitLayerToCanvas,
  getBlurPosterBackdropPlacement,
  getComparisonSplitGeometry,
  getQuickLayoutPlacements,
  type QuickLayoutId,
} from "@/lib/konva/quickLayouts";
import { getScreenshotBackgroundPreset } from "@/lib/konva/screenshotBackgrounds";
import {
  buildAutoPaddingPlacement,
  buildAutoPaddingStyle,
  buildComparisonSplitLayers,
  buildScreenshotMockup,
  COMPARISON_LAYER_PREFIX,
  FRAME_LAYER_PREFIX,
  isAuxiliaryLayer,
  type ScreenshotMockupId,
} from "@/lib/konva/screenshotMockups";
import {
  createImageLayer,
  createLayerId,
  createCoverPatchLayer,
  createCalloutLayer,
  createShapeLayer,
  createTextLayer,
  createVectorShapeLayer,
  DEFAULT_IMAGE_FILTERS,
  DEFAULT_IMAGE_LAYER_STYLE,
  DEFAULT_STAGE_BACKGROUND,
  type CleanupBrushStroke,
  type CalloutKind,
  type EditorLayer,
  type EditorLayerUpdate,
  type ImageEditorLayer,
  type LayerTransformUpdate,
  type ShapeKind,
  type StageBackground,
} from "@/types/konvaEditor";
import {
  applyAnnotationStyleToShapeLayer,
  styleForShapeKind,
} from "@/lib/konva/annotationStyle";
import type { AnnotationStyle } from "@/types/annotationStyle";
import { createFullImageCrop } from "@/lib/konva/imageCrop";
import { createCleanupStrokeId } from "@/lib/konva/cleanupEffects";
import type { UploadedImage } from "@/types/optimizer";

export interface EditorDocumentState {
  layers: EditorLayer[];
  selectedLayerId: string | null;
  background: StageBackground;
}

interface UseKonvaLayersOptions {
  stageWidth: number;
  stageHeight: number;
  onLayersChange?: () => void;
}

const INITIAL_DOCUMENT: EditorDocumentState = {
  layers: [],
  selectedLayerId: null,
  background: { ...DEFAULT_STAGE_BACKGROUND },
};

function loadUploadedImage(file: File): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      reject(new Error(validation.message ?? "Unable to upload this file."));
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const img = new window.Image();

    img.onload = () => {
      resolve({
        file,
        previewUrl,
        name: file.name,
        size: file.size,
        mimeType: file.type,
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(previewUrl);
      reject(new Error("This image could not be loaded."));
    };

    img.src = previewUrl;
  });
}

export function useKonvaLayers(options: UseKonvaLayersOptions) {
  const { stageWidth, stageHeight, onLayersChange } = options;
  const [uploadError, setUploadError] = useState<string | null>(null);
  const previewUrlsRef = useRef<Set<string>>(new Set());

  const {
    state: document,
    commit,
    patch,
    checkpoint,
    undo,
    redo,
    resetHistory,
    canUndo,
    canRedo,
  } = useEditorHistory<EditorDocumentState>(INITIAL_DOCUMENT);

  const { layers, selectedLayerId, background } = document;

  const trackPreviewUrl = useCallback((url: string) => {
    previewUrlsRef.current.add(url);
  }, []);

  const releasePreviewUrl = useCallback(
    (url: string, activeLayers: EditorLayer[]) => {
      const stillUsed = activeLayers.some(
        (layer) => layer.type === "image" && layer.image.previewUrl === url,
      );
      if (!stillUsed && previewUrlsRef.current.has(url)) {
        URL.revokeObjectURL(url);
        previewUrlsRef.current.delete(url);
      }
    },
    [],
  );

  useEffect(() => {
    const urls = previewUrlsRef.current;
    return () => {
      urls.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      urls.clear();
    };
  }, []);

  const notifyChange = useCallback(() => {
    onLayersChange?.();
  }, [onLayersChange]);

  const mutateDocument = useCallback(
    (updater: (previous: EditorDocumentState) => EditorDocumentState) => {
      commit(updater);
      notifyChange();
    },
    [commit, notifyChange],
  );

  const addLayerFromFile = useCallback(
    async (file: File) => {
      setUploadError(null);

      try {
        const uploadedImage = await loadUploadedImage(file);
        trackPreviewUrl(uploadedImage.previewUrl);

        mutateDocument((previous) => {
          const nextLayer = createImageLayer(
            uploadedImage,
            stageWidth,
            stageHeight,
            previous.layers.length,
          );

          return {
            ...previous,
            layers: [...previous.layers, nextLayer],
            selectedLayerId: nextLayer.id,
          };
        });
      } catch (error) {
        setUploadError(
          error instanceof Error ? error.message : "Unable to add layer.",
        );
      }
    },
    [mutateDocument, stageHeight, stageWidth, trackPreviewUrl],
  );

  const addTextLayer = useCallback(() => {
    mutateDocument((previous) => {
      const nextLayer = createTextLayer(
        stageWidth,
        stageHeight,
        previous.layers.length,
      );

      return {
        ...previous,
        layers: [...previous.layers, nextLayer],
        selectedLayerId: nextLayer.id,
      };
    });
  }, [mutateDocument, stageHeight, stageWidth]);

  const addShapeLayer = useCallback(
    (shape: ShapeKind, style?: AnnotationStyle) => {
      mutateDocument((previous) => {
        const nextLayer = createShapeLayer(
          shape,
          stageWidth,
          stageHeight,
          previous.layers.length,
        );
        const styledLayer = style
          ? {
              ...nextLayer,
              ...applyAnnotationStyleToShapeLayer(
                styleForShapeKind(style, shape),
                shape,
              ),
            }
          : nextLayer;

        return {
          ...previous,
          layers: [...previous.layers, styledLayer],
          selectedLayerId: styledLayer.id,
        };
      });
    },
    [mutateDocument, stageHeight, stageWidth],
  );

  const addVectorShapeLayer = useCallback(
    ({
      shape,
      x,
      y,
      width,
      height,
      points,
      settings,
    }: {
      shape: Extract<ShapeKind, "line" | "arrow" | "freehand" | "highlighter">;
      x: number;
      y: number;
      width: number;
      height: number;
      points: number[];
      settings: AnnotationStyle;
    }) => {
      mutateDocument((previous) => {
        const nextLayer = createVectorShapeLayer({
          shape,
          x,
          y,
          width,
          height,
          points,
          settings,
          layerIndex: previous.layers.length,
        });

        return {
          ...previous,
          layers: [...previous.layers, nextLayer],
          selectedLayerId: nextLayer.id,
        };
      });
    },
    [mutateDocument],
  );

  const addCalloutLayer = useCallback(
    ({
      calloutType,
      x,
      y,
      width,
      height,
      settings,
      markerNumber,
    }: {
      calloutType: CalloutKind;
      x: number;
      y: number;
      width: number;
      height: number;
      settings: AnnotationStyle;
      markerNumber?: number;
    }) => {
      mutateDocument((previous) => {
        const nextLayer = createCalloutLayer({
          calloutType,
          x,
          y,
          width,
          height,
          settings,
          layerIndex: previous.layers.length,
          markerNumber,
        });

        return {
          ...previous,
          layers: [...previous.layers, nextLayer],
          selectedLayerId: nextLayer.id,
        };
      });
    },
    [mutateDocument],
  );

  const getNextMarkerNumber = useCallback(() => {
    return (
      layers.filter(
        (layer) =>
          layer.type === "callout" && layer.calloutType === "numbered-marker",
      ).length + 1
    );
  }, [layers]);

  const selectLayer = useCallback(
    (layerId: string | null) => {
      patch((previous) =>
        previous.selectedLayerId === layerId
          ? previous
          : { ...previous, selectedLayerId: layerId },
      );
    },
    [patch],
  );

  const updateLayer = useCallback(
    (layerId: string, update: LayerTransformUpdate) => {
      mutateDocument((previous) => ({
        ...previous,
        layers: previous.layers.map((layer) =>
          layer.id === layerId ? { ...layer, ...update } : layer,
        ),
      }));
    },
    [mutateDocument],
  );

  const updateLayerProperties = useCallback(
    (layerId: string, update: EditorLayerUpdate, recordHistory = true) => {
      const applyUpdate = (previous: EditorDocumentState) => ({
        ...previous,
        layers: previous.layers.map((layer) => {
          if (layer.id !== layerId) {
            return layer;
          }

          if (layer.type === "image") {
            const { filters, style, cleanupStrokes, ...rest } = update;
            return {
              ...layer,
              ...rest,
              ...(filters ? { filters: { ...layer.filters, ...filters } } : {}),
              ...(style ? { style: { ...layer.style, ...style } } : {}),
              ...(cleanupStrokes !== undefined ? { cleanupStrokes } : {}),
            };
          }

          return { ...layer, ...update } as EditorLayer;
        }),
      });

      if (recordHistory) {
        mutateDocument(applyUpdate);
        return;
      }

      patch(applyUpdate);
      notifyChange();
    },
    [mutateDocument, notifyChange, patch],
  );

  const deleteLayer = useCallback(
    (layerId: string) => {
      mutateDocument((previous) => {
        const target = previous.layers.find((layer) => layer.id === layerId);
        const nextLayers = previous.layers.filter((layer) => layer.id !== layerId);

        if (target?.type === "image") {
          releasePreviewUrl(target.image.previewUrl, nextLayers);
        }

        return {
          ...previous,
          layers: nextLayers,
          selectedLayerId:
            previous.selectedLayerId === layerId ? null : previous.selectedLayerId,
        };
      });
    },
    [mutateDocument, releasePreviewUrl],
  );

  const deleteSelectedLayer = useCallback(() => {
    if (!selectedLayerId) {
      return;
    }

    deleteLayer(selectedLayerId);
  }, [deleteLayer, selectedLayerId]);

  const duplicateLayer = useCallback(
    (layerId: string) => {
      mutateDocument((previous) => {
        const index = previous.layers.findIndex((layer) => layer.id === layerId);
        if (index === -1) {
          return previous;
        }

        const source = previous.layers[index];
        const duplicate: EditorLayer =
          source.type === "image"
            ? {
                ...source,
                id: createLayerId(),
                name: source.name.includes("copy")
                  ? source.name
                  : `${source.name} copy`,
                x: source.x + 24,
                y: source.y + 24,
                locked: false,
                filters: { ...source.filters },
                style: { ...source.style },
                crop: source.crop ? { ...source.crop } : undefined,
                cleanupStrokes: source.cleanupStrokes?.map((stroke) => ({
                  ...stroke,
                  id: createCleanupStrokeId(),
                  points: [...stroke.points],
                })),
              }
            : {
                ...source,
                id: createLayerId(),
                name: source.name.includes("copy")
                  ? source.name
                  : `${source.name} copy`,
                x: source.x + 24,
                y: source.y + 24,
                locked: false,
              };

        const nextLayers = [...previous.layers];
        nextLayers.splice(index + 1, 0, duplicate);

        return {
          ...previous,
          layers: nextLayers,
          selectedLayerId: duplicate.id,
        };
      });
    },
    [mutateDocument],
  );

  const moveLayer = useCallback(
    (layerId: string, direction: "up" | "down") => {
      mutateDocument((previous) => {
        const index = previous.layers.findIndex((layer) => layer.id === layerId);
        if (index === -1) {
          return previous;
        }

        const targetIndex = direction === "up" ? index + 1 : index - 1;
        if (targetIndex < 0 || targetIndex >= previous.layers.length) {
          return previous;
        }

        const nextLayers = [...previous.layers];
        const [item] = nextLayers.splice(index, 1);
        nextLayers.splice(targetIndex, 0, item);

        return {
          ...previous,
          layers: nextLayers,
        };
      });
    },
    [mutateDocument],
  );

  const toggleLayerLock = useCallback(
    (layerId: string) => {
      mutateDocument((previous) => ({
        ...previous,
        layers: previous.layers.map((layer) =>
          layer.id === layerId ? { ...layer, locked: !layer.locked } : layer,
        ),
      }));
    },
    [mutateDocument],
  );

  const toggleLayerVisibility = useCallback(
    (layerId: string) => {
      mutateDocument((previous) => ({
        ...previous,
        layers: previous.layers.map((layer) =>
          layer.id === layerId ? { ...layer, visible: !layer.visible } : layer,
        ),
      }));
    },
    [mutateDocument],
  );

  const updateBackground = useCallback(
    (update: Partial<StageBackground>) => {
      mutateDocument((previous) => ({
        ...previous,
        background: { ...previous.background, ...update },
      }));
    },
    [mutateDocument],
  );

  const resetLayers = useCallback(() => {
    layers.forEach((layer) => {
      if (layer.type === "image") {
        releasePreviewUrl(layer.image.previewUrl, []);
      }
    });
    resetHistory(INITIAL_DOCUMENT);
    setUploadError(null);
    notifyChange();
  }, [layers, notifyChange, releasePreviewUrl, resetHistory]);

  const loadDocument = useCallback(
    (nextDocument: EditorDocumentState) => {
      const nextPreviewUrls = new Set(
        nextDocument.layers
          .filter((layer): layer is ImageEditorLayer => layer.type === "image")
          .map((layer) => layer.image.previewUrl),
      );

      layers.forEach((layer) => {
        if (
          layer.type === "image" &&
          !nextPreviewUrls.has(layer.image.previewUrl)
        ) {
          releasePreviewUrl(layer.image.previewUrl, nextDocument.layers);
        }
      });

      nextDocument.layers.forEach((layer) => {
        if (layer.type === "image") {
          trackPreviewUrl(layer.image.previewUrl);
        }
      });

      resetHistory(nextDocument);
      setUploadError(null);
      notifyChange();
    },
    [layers, notifyChange, releasePreviewUrl, resetHistory, trackPreviewUrl],
  );

  const clearUploadError = useCallback(() => {
    setUploadError(null);
  }, []);

  const handleUndo = useCallback(() => {
    undo();
    notifyChange();
  }, [notifyChange, undo]);

  const handleRedo = useCallback(() => {
    redo();
    notifyChange();
  }, [notifyChange, redo]);

  const imageLayerCount = layers.filter((layer) => layer.type === "image").length;

  const removeAuxiliaryLayers = useCallback(
    (currentLayers: EditorLayer[], prefix: string) =>
      currentLayers.filter((layer) => !isAuxiliaryLayer(layer, prefix)),
    [],
  );

  const applyScreenshotMockup = useCallback(
    (mockupId: ScreenshotMockupId, layerId?: string) => {
      const imageLayers = layers.filter(
        (layer): layer is ImageEditorLayer => layer.type === "image",
      );

      if (imageLayers.length === 0) {
        return;
      }

      const target =
        imageLayers.find((layer) => layer.id === layerId) ??
        imageLayers[imageLayers.length - 1];
      const result = buildScreenshotMockup(
        mockupId,
        target,
        stageWidth,
        stageHeight,
      );
      const [bodyLayer, ...remainingChrome] = result.frameLayers;
      const screenLayer = remainingChrome.find((layer) =>
        layer.name.includes("screen"),
      );
      const chromeLayers = remainingChrome.filter(
        (layer) => layer !== screenLayer,
      );

      mutateDocument((previous) => {
        let nextLayers = removeAuxiliaryLayers(
          previous.layers,
          FRAME_LAYER_PREFIX,
        );
        nextLayers = nextLayers.map((layer) => {
          if (layer.id !== target.id || layer.type !== "image") {
            return layer;
          }

          const { x, y, width, height } = result.screenshotPlacement;
          const updatedLayer: ImageEditorLayer = {
            ...layer,
            x,
            y,
            width,
            height,
            rotation: 0,
            style: {
              ...layer.style,
              ...result.screenshotStyle,
            },
          };

          return updatedLayer;
        });

        const targetIndex = nextLayers.findIndex((layer) => layer.id === target.id);
        if (targetIndex === -1 || !bodyLayer) {
          return previous;
        }

        let insertIndex = targetIndex;
        nextLayers.splice(insertIndex, 0, bodyLayer);
        insertIndex += 1;

        if (screenLayer) {
          nextLayers.splice(insertIndex, 0, screenLayer);
          insertIndex += 1;
        }

        nextLayers.splice(insertIndex + 1, 0, ...chromeLayers);

        return {
          ...previous,
          layers: nextLayers,
          selectedLayerId: target.id,
          background: result.background
            ? { ...previous.background, ...result.background }
            : previous.background,
        };
      });
    },
    [layers, mutateDocument, removeAuxiliaryLayers, stageHeight, stageWidth],
  );

  const applyScreenshotBackground = useCallback(
    (presetId: string) => {
      const preset = getScreenshotBackgroundPreset(presetId);
      if (!preset) {
        return;
      }

      mutateDocument((previous) => ({
        ...previous,
        background: { ...preset.background },
      }));
    },
    [mutateDocument],
  );

  const applyAutoPadding = useCallback(
    (layerId?: string) => {
      const imageLayers = layers.filter(
        (layer): layer is ImageEditorLayer => layer.type === "image",
      );

      if (imageLayers.length === 0) {
        return;
      }

      const target =
        imageLayers.find((layer) => layer.id === layerId) ??
        imageLayers[imageLayers.length - 1];
      const placement = buildAutoPaddingPlacement(target, stageWidth, stageHeight);
      const style = buildAutoPaddingStyle(stageWidth, stageHeight);

      mutateDocument((previous) => ({
        ...previous,
        layers: previous.layers.map((layer) => {
          if (layer.id !== target.id || layer.type !== "image") {
            return layer;
          }

          const { x, y, width, height } = placement;
          const updatedLayer: ImageEditorLayer = {
            ...layer,
            x,
            y,
            width,
            height,
            rotation: 0,
            style: {
              ...layer.style,
              ...style,
            },
          };

          return updatedLayer;
        }),
        selectedLayerId: target.id,
        background: {
          ...previous.background,
          transparent: false,
          fillType: "solid",
          color: "#f5f5f7",
        },
      }));
    },
    [layers, mutateDocument, stageHeight, stageWidth],
  );

  const applyQuickLayout = useCallback(
    (layoutId: QuickLayoutId) => {
      const imageLayers = layers.filter(
        (layer): layer is ImageEditorLayer => layer.type === "image",
      );

      if (layoutId === "blur-poster") {
        if (imageLayers.length === 0) {
          return;
        }

        const foreground = imageLayers[imageLayers.length - 1];
        const foregroundPlacement = getQuickLayoutPlacements(
          layoutId,
          [foreground],
          stageWidth,
          stageHeight,
        ).get(foreground.id);

        mutateDocument((previous) => {
          const backdropSource = foreground;
          const backdropPlacement = getBlurPosterBackdropPlacement(
            backdropSource,
            stageWidth,
            stageHeight,
          );

          const backdrop: ImageEditorLayer = {
            ...backdropSource,
            id: createLayerId(),
            name: `${backdropSource.name} background`,
            locked: true,
            x: backdropPlacement.x,
            y: backdropPlacement.y,
            width: backdropPlacement.width,
            height: backdropPlacement.height,
            rotation: 0,
            filters: {
              ...DEFAULT_IMAGE_FILTERS,
              ...backdropPlacement.filters,
            },
            style: { ...DEFAULT_IMAGE_LAYER_STYLE },
          };

          const layersWithoutBackdrop = previous.layers.filter(
            (layer) =>
              !(
                layer.type === "image" && layer.name.endsWith(" background")
              ),
          );

          const nextLayers = layersWithoutBackdrop.map((layer) => {
            if (layer.id !== foreground.id || layer.type !== "image") {
              return layer;
            }

            if (!foregroundPlacement) {
              return layer;
            }

            return {
              ...layer,
              ...foregroundPlacement,
              filters: {
                ...layer.filters,
                ...(foregroundPlacement.filters ?? {}),
              },
            };
          });

          const foregroundIndex = nextLayers.findIndex(
            (layer) => layer.id === foreground.id,
          );
          if (foregroundIndex === -1) {
            return previous;
          }

          nextLayers.splice(foregroundIndex, 0, backdrop);

          return {
            ...previous,
            layers: nextLayers,
            selectedLayerId: foreground.id,
          };
        });
        return;
      }

      if (
        layoutId === "comparison-split" ||
        layoutId === "before-after-collage"
      ) {
        if (imageLayers.length < 2) {
          return;
        }

        const placements = getQuickLayoutPlacements(
          layoutId,
          imageLayers,
          stageWidth,
          stageHeight,
        );
        const geometry = getComparisonSplitGeometry(stageWidth, stageHeight);
        const comparisonLayers = buildComparisonSplitLayers(
          geometry.leftCell,
          geometry.rightCell,
          stageWidth,
          stageHeight,
          true,
        );

        mutateDocument((previous) => {
          let nextLayers = removeAuxiliaryLayers(
            previous.layers,
            COMPARISON_LAYER_PREFIX,
          );
          nextLayers = nextLayers.map((layer) => {
            if (layer.type !== "image") {
              return layer;
            }

            const placement = placements.get(layer.id);
            if (!placement) {
              return layer;
            }

            return {
              ...layer,
              x: placement.x,
              y: placement.y,
              width: placement.width,
              height: placement.height,
              rotation: 0,
              filters: {
                ...layer.filters,
                ...(placement.filters ?? {}),
              },
            };
          });

          return {
            ...previous,
            layers: [...nextLayers, ...comparisonLayers],
            background: {
              ...previous.background,
              transparent: false,
              fillType: "solid",
              color: "#111111",
            },
          };
        });
        return;
      }

      if (layoutId === "auto-padding") {
        if (imageLayers.length === 0) {
          return;
        }

        const target = imageLayers[imageLayers.length - 1];
        const placement = buildAutoPaddingPlacement(
          target,
          stageWidth,
          stageHeight,
        );
        const style = buildAutoPaddingStyle(stageWidth, stageHeight);

        mutateDocument((previous) => ({
          ...previous,
          layers: previous.layers.map((layer) => {
            if (layer.id !== target.id || layer.type !== "image") {
              return layer;
            }

            const { x, y, width, height } = placement;
            const updatedLayer: ImageEditorLayer = {
              ...layer,
              x,
              y,
              width,
              height,
              rotation: 0,
              style: {
                ...layer.style,
                ...style,
              },
            };

            return updatedLayer;
          }),
          selectedLayerId: target.id,
          background: {
            ...previous.background,
            transparent: false,
            fillType: "linear",
            color: "#f5f5f7",
            gradientAngle: 180,
            gradientStops: [
              { offset: 0, color: "#ffffff" },
              { offset: 1, color: "#f5f5f7" },
            ],
          },
        }));
        return;
      }

      const placements = getQuickLayoutPlacements(
        layoutId,
        imageLayers,
        stageWidth,
        stageHeight,
      );

      mutateDocument((previous) => ({
        ...previous,
        layers: previous.layers.map((layer) => {
          if (layer.type !== "image") {
            return layer;
          }

          const placement = placements.get(layer.id);
          if (!placement) {
            return layer;
          }

          return {
            ...layer,
            x: placement.x,
            y: placement.y,
            width: placement.width,
            height: placement.height,
            rotation: 0,
            filters: {
              ...layer.filters,
              ...(placement.filters ?? {}),
            },
          };
        }),
      }));
    },
    [layers, mutateDocument, removeAuxiliaryLayers, stageHeight, stageWidth],
  );

  const centerLayer = useCallback(
    (layerId: string) => {
      const layer = layers.find((item) => item.id === layerId);
      if (!layer) {
        return;
      }

      const placement = centerEditorLayer(layer, stageWidth, stageHeight);
      updateLayer(layerId, placement);
    },
    [layers, stageHeight, stageWidth, updateLayer],
  );

  const fitLayerToCanvasMode = useCallback(
    (layerId: string, mode: "contain" | "cover") => {
      const layer = layers.find((item) => item.id === layerId);
      if (!layer || layer.type !== "image") {
        return;
      }

      const placement = fitLayerToCanvas(layer, stageWidth, stageHeight, mode);
      updateLayer(layerId, placement);
    },
    [layers, stageHeight, stageWidth, updateLayer],
  );

  const resetLayerEffects = useCallback(
    (layerId: string) => {
      const layer = layers.find((item) => item.id === layerId);
      if (!layer || layer.type !== "image") {
        return;
      }

      updateLayerProperties(layerId, {
        filters: { ...DEFAULT_IMAGE_FILTERS },
        style: { ...DEFAULT_IMAGE_LAYER_STYLE },
        crop: createFullImageCrop(layer.image.width, layer.image.height),
        cleanupStrokes: [],
      });
    },
    [layers, updateLayerProperties],
  );

  const previewCleanupStrokes = useCallback(
    (layerId: string, strokes: CleanupBrushStroke[]) => {
      updateLayerProperties(layerId, { cleanupStrokes: strokes }, false);
    },
    [updateLayerProperties],
  );

  const clearCleanupStrokes = useCallback(
    (layerId: string) => {
      updateLayerProperties(layerId, { cleanupStrokes: [] });
    },
    [updateLayerProperties],
  );

  const addCoverPatchLayer = useCallback(
    (rect: { x: number; y: number; width: number; height: number }) => {
      mutateDocument((previous) => {
        const patch = createCoverPatchLayer({
          ...rect,
          layerIndex: previous.layers.length,
        });

        return {
          ...previous,
          layers: [...previous.layers, patch],
          selectedLayerId: patch.id,
        };
      });
    },
    [mutateDocument],
  );

  const resetLayerCrop = useCallback(
    (layerId: string) => {
      const layer = layers.find((item) => item.id === layerId);
      if (!layer || layer.type !== "image") {
        return;
      }

      updateLayerProperties(layerId, {
        crop: createFullImageCrop(layer.image.width, layer.image.height),
      });
    },
    [layers, updateLayerProperties],
  );

  const alignLayer = useCallback(
    (layerId: string, alignment: LayerAlignment) => {
      const layer = layers.find((item) => item.id === layerId);
      if (!layer) {
        return;
      }

      const placement = alignEditorLayer(
        layer,
        alignment,
        stageWidth,
        stageHeight,
      );
      updateLayer(layerId, placement);
    },
    [layers, stageHeight, stageWidth, updateLayer],
  );

  const setBackground = useCallback(
    (nextBackground: StageBackground) => {
      mutateDocument((previous) => ({
        ...previous,
        background: nextBackground,
      }));
    },
    [mutateDocument],
  );

  const hasLayers = layers.length > 0;
  const showCanvas = hasLayers || !background.transparent;
  const canExport = showCanvas;

  return {
    layers,
    selectedLayerId,
    selectedLayer: layers.find((layer) => layer.id === selectedLayerId) ?? null,
    uploadError,
    background,
    stageWidth,
    stageHeight,
    hasLayers,
    showCanvas,
    canExport,
    canUndo,
    canRedo,
    imageLayerCount,
    addLayerFromFile,
    addTextLayer,
    addShapeLayer,
    addVectorShapeLayer,
    addCalloutLayer,
    getNextMarkerNumber,
    applyQuickLayout,
    applyScreenshotMockup,
    applyScreenshotBackground,
    applyAutoPadding,
    selectLayer,
    updateLayer,
    updateLayerProperties,
    deleteLayer,
    deleteSelectedLayer,
    duplicateLayer,
    centerLayer,
    alignLayer,
    fitLayerToCanvasMode,
    resetLayerEffects,
    resetLayerCrop,
    previewCleanupStrokes,
    clearCleanupStrokes,
    addCoverPatchLayer,
    setBackground,
    moveLayerUp: (layerId: string) => moveLayer(layerId, "up"),
    moveLayerDown: (layerId: string) => moveLayer(layerId, "down"),
    toggleLayerLock,
    toggleLayerVisibility,
    updateBackground,
    resetLayers,
    loadDocument,
    clearUploadError,
    undo: handleUndo,
    redo: handleRedo,
    checkpointHistory: checkpoint,
  };
}
