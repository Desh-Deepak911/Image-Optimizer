"use client";

import { useCallback, useRef } from "react";
import { useAdvancedEditorSettings } from "@/hooks/useAdvancedEditorSettings";
import { useExportFlow } from "@/hooks/useExportFlow";
import { useKonvaLayers } from "@/hooks/useKonvaLayers";
import {
  downloadKonvaExport,
  exportKonvaStageToBlob,
  getAdvancedExportFilename,
} from "@/lib/konva/exportKonvaStage";
import type Konva from "konva";

export function useAdvancedEditor() {
  const stageRef = useRef<Konva.Stage | null>(null);

  const {
    exportError,
    exportSuccess,
    isExporting,
    runExportTask,
    resetExportState,
    clearExportError,
    clearExportSuccess,
  } = useExportFlow();

  const {
    settings,
    updateSettings,
    resetSettings,
    canvasDimensions,
    exportDimensions,
  } = useAdvancedEditorSettings({
    onSettingsChange: resetExportState,
  });

  const layersState = useKonvaLayers({
    stageWidth: canvasDimensions.width,
    stageHeight: canvasDimensions.height,
    onLayersChange: resetExportState,
  });

  const setStageRef = useCallback((stage: Konva.Stage | null) => {
    stageRef.current = stage;
  }, []);

  const handleDownload = useCallback(async () => {
    const stage = stageRef.current;
    if (!stage || !layersState.canExport) {
      return;
    }

    await runExportTask(async () => {
      const blob = await exportKonvaStageToBlob(
        stage,
        settings.exportFormat,
        settings.quality,
        {
          background: layersState.background,
          canvasWidth: canvasDimensions.width,
          canvasHeight: canvasDimensions.height,
          exportWidth: exportDimensions.width,
          exportHeight: exportDimensions.height,
        },
      );
      const filename = getAdvancedExportFilename(settings.exportFormat);
      downloadKonvaExport(blob, filename);

      return {
        filename,
        size: blob.size,
        width: exportDimensions.width,
        height: exportDimensions.height,
      };
    });
  }, [
    canvasDimensions.height,
    canvasDimensions.width,
    exportDimensions.height,
    exportDimensions.width,
    layersState.background,
    layersState.canExport,
    runExportTask,
    settings.exportFormat,
    settings.quality,
  ]);

  const resetAll = useCallback(() => {
    layersState.resetLayers();
    resetSettings();
    resetExportState();
  }, [layersState, resetExportState, resetSettings]);

  return {
    settings,
    updateSettings,
    canvasDimensions,
    exportDimensions,
    exportError,
    exportSuccess,
    isExporting,
    setStageRef,
    handleDownload,
    resetAll,
    clearExportError,
    clearExportSuccess,
    ...layersState,
  };
}
