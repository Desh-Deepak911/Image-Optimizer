"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { validateImageFile } from "@/lib/imageValidation";
import { useEditorHistory } from "@/hooks/useEditorHistory";
import {
  createImageLayer,
  createLayerId,
  createShapeLayer,
  createTextLayer,
  DEFAULT_STAGE_BACKGROUND,
  type EditorLayer,
  type EditorLayerUpdate,
  type LayerTransformUpdate,
  type ShapeKind,
  type StageBackground,
} from "@/types/konvaEditor";
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
    (shape: ShapeKind) => {
      mutateDocument((previous) => {
        const nextLayer = createShapeLayer(
          shape,
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
    },
    [mutateDocument, stageHeight, stageWidth],
  );

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
            const { filters, ...rest } = update;
            return {
              ...layer,
              ...rest,
              ...(filters ? { filters: { ...layer.filters, ...filters } } : {}),
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
        const duplicate: EditorLayer = {
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
    addLayerFromFile,
    addTextLayer,
    addShapeLayer,
    selectLayer,
    updateLayer,
    updateLayerProperties,
    deleteLayer,
    deleteSelectedLayer,
    duplicateLayer,
    moveLayerUp: (layerId: string) => moveLayer(layerId, "up"),
    moveLayerDown: (layerId: string) => moveLayer(layerId, "down"),
    toggleLayerLock,
    toggleLayerVisibility,
    updateBackground,
    resetLayers,
    clearUploadError,
    undo: handleUndo,
    redo: handleRedo,
    checkpointHistory: checkpoint,
  };
}
