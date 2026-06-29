"use client";

import { useCallback, useMemo, useState } from "react";
import {
  resolveCanvasDimensions,
  resolveExportDimensions,
} from "@/lib/konva/outputPresets";
import {
  DEFAULT_ADVANCED_EDITOR_SETTINGS,
  type AdvancedEditorSettings,
} from "@/types/konvaEditor";

interface UseAdvancedEditorSettingsOptions {
  onSettingsChange?: () => void;
}

export function useAdvancedEditorSettings(
  options: UseAdvancedEditorSettingsOptions = {},
) {
  const { onSettingsChange } = options;
  const [settings, setSettings] = useState<AdvancedEditorSettings>(
    DEFAULT_ADVANCED_EDITOR_SETTINGS,
  );

  const canvasDimensions = useMemo(
    () =>
      resolveCanvasDimensions(
        settings.canvasPreset,
        settings.customCanvasWidth,
        settings.customCanvasHeight,
      ),
    [
      settings.canvasPreset,
      settings.customCanvasHeight,
      settings.customCanvasWidth,
    ],
  );

  const exportDimensions = useMemo(
    () =>
      resolveExportDimensions(
        settings.exportPreset,
        canvasDimensions.width,
        canvasDimensions.height,
        settings.customExportWidth,
        settings.customExportHeight,
      ),
    [
      canvasDimensions.height,
      canvasDimensions.width,
      settings.customExportHeight,
      settings.customExportWidth,
      settings.exportPreset,
    ],
  );

  const updateSettings = useCallback(
    <K extends keyof AdvancedEditorSettings>(
      key: K,
      value: AdvancedEditorSettings[K],
    ) => {
      onSettingsChange?.();
      setSettings((previous) => ({
        ...previous,
        [key]: value,
      }));
    },
    [onSettingsChange],
  );

  const applyCanvasSize = useCallback(
    (width: number, height: number) => {
      onSettingsChange?.();
      setSettings((previous) => ({
        ...previous,
        canvasPreset: "custom",
        customCanvasWidth: width,
        customCanvasHeight: height,
        exportPreset: "canvas",
      }));
    },
    [onSettingsChange],
  );

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_ADVANCED_EDITOR_SETTINGS);
  }, []);

  const replaceSettings = useCallback(
    (nextSettings: AdvancedEditorSettings) => {
      onSettingsChange?.();
      setSettings(nextSettings);
    },
    [onSettingsChange],
  );

  return {
    settings,
    updateSettings,
    resetSettings,
    replaceSettings,
    applyCanvasSize,
    canvasDimensions,
    exportDimensions,
  };
}
