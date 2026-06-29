"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useEditorSettings } from "@/hooks/useEditorSettings";
import { useEditorTransform } from "@/hooks/useEditorTransform";
import { useExportFlow } from "@/hooks/useExportFlow";
import type { ExportSuccessState } from "@/hooks/useExportFlow";
import { useImageUpload } from "@/hooks/useImageUpload";
import { applyPanDelta } from "@/lib/render/applyPan";
import { computeDefaultTransformFromSettings } from "@/lib/render/computeTransform";
import {
  getFramingContext,
  getFramingSettingsKey,
} from "@/lib/render/framingContext";
import type { SourceTransform } from "@/types/editor";
import type { OptimizerState } from "@/types/optimizer";

export type { ExportSuccessState };

export function useOptimizerState() {
  const {
    exportError,
    exportSuccess,
    isExporting,
    handleDownload: runExport,
    resetExportState,
    clearExportError,
    clearExportSuccess,
  } = useExportFlow();

  const {
    image,
    hasImage,
    uploadError,
    loadImageFromFile,
    clearImage: clearUploadedImage,
    clearUploadError,
  } = useImageUpload({
    onLoadStart: resetExportState,
  });

  const { settings, updateSettings, resetSettings } = useEditorSettings({
    onSettingsChange: resetExportState,
  });

  const { transform, updateTransform, resetTransform } = useEditorTransform();

  const framingSettingsKey = useMemo(
    () => (hasImage ? getFramingSettingsKey(settings) : null),
    [hasImage, settings],
  );

  const computeDefaultTransform = useCallback((): SourceTransform | null => {
    if (!image) {
      return null;
    }

    const framing = getFramingContext(image, settings);

    return computeDefaultTransformFromSettings({
      source: framing.source,
      aspectRatio: settings.aspectRatio,
      fitMode: settings.fitMode,
      outputWidth: framing.outputWidth,
    });
  }, [image, settings]);

  useEffect(() => {
    if (!image || !framingSettingsKey) {
      return;
    }

    const defaultTransform = computeDefaultTransform();
    if (defaultTransform) {
      updateTransform(defaultTransform);
    }
  }, [image, framingSettingsKey, computeDefaultTransform, updateTransform]);

  const resolvedTransform = useMemo(() => {
    if (!image) {
      return null;
    }

    return transform ?? computeDefaultTransform();
  }, [computeDefaultTransform, image, transform]);

  const state = useMemo<OptimizerState>(
    () => ({
      image,
      settings,
      transform: resolvedTransform ?? undefined,
    }),
    [image, resolvedTransform, settings],
  );

  const resetFraming = useCallback(() => {
    const defaultTransform = computeDefaultTransform();
    if (defaultTransform) {
      updateTransform(defaultTransform);
    }
  }, [computeDefaultTransform, updateTransform]);

  const applyPan = useCallback(
    (delta: { dx: number; dy: number }) => {
      if (!image || !resolvedTransform) {
        return;
      }

      const framing = getFramingContext(image, settings);
      const nextTransform = applyPanDelta(
        resolvedTransform,
        settings.fitMode,
        delta,
        framing.source,
      );

      updateTransform(nextTransform);
    },
    [image, resolvedTransform, settings, updateTransform],
  );

  const clearImage = useCallback(() => {
    clearUploadedImage();
    resetExportState();
  }, [clearUploadedImage, resetExportState]);

  const resetAll = useCallback(() => {
    clearUploadedImage();
    resetSettings();
    resetTransform();
    resetExportState();
  }, [
    clearUploadedImage,
    resetExportState,
    resetSettings,
    resetTransform,
  ]);

  const handleDownload = useCallback(() => {
    if (!image || !resolvedTransform) {
      return;
    }

    void runExport({
      image,
      settings,
      transform: resolvedTransform,
    });
  }, [image, resolvedTransform, runExport, settings]);

  return {
    state,
    hasImage,
    resolvedTransform,
    uploadError,
    exportError,
    exportSuccess,
    isExporting,
    loadImageFromFile,
    clearImage,
    resetAll,
    resetFraming,
    applyPan,
    clearUploadError,
    clearExportError,
    clearExportSuccess,
    updateSettings,
    handleDownload,
  };
}
