"use client";

import { useCallback, useMemo, useRef } from "react";
import { useAdvancedEditorSettings } from "@/hooks/useAdvancedEditorSettings";
import { useExportFlow } from "@/hooks/useExportFlow";
import { useEditorProjects } from "@/hooks/useEditorProjects";
import { useKonvaLayers } from "@/hooks/useKonvaLayers";
import {
  downloadKonvaExport,
  exportKonvaStageToBlob,
  getAdvancedExportFilename,
} from "@/lib/konva/exportKonvaStage";
import type Konva from "konva";
import { getEditorTemplate } from "@/lib/konva/editorTemplates";
import type { AdvancedEditorSettings } from "@/types/konvaEditor";
import type { EditorDocumentState } from "@/hooks/useKonvaLayers";

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
    replaceSettings,
    applyCanvasSize,
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

  const { setBackground, loadDocument } = layersState;

  const documentState = useMemo<EditorDocumentState>(
    () => ({
      layers: layersState.layers,
      selectedLayerId: layersState.selectedLayerId,
      background: layersState.background,
    }),
    [
      layersState.background,
      layersState.layers,
      layersState.selectedLayerId,
    ],
  );

  const loadProjectState = useCallback(
    ({
      settings: nextSettings,
      document,
    }: {
      settings: AdvancedEditorSettings;
      document: EditorDocumentState;
      projectId: string | null;
      projectName: string;
    }) => {
      replaceSettings(nextSettings);
      loadDocument(document);
      resetExportState();
    },
    [loadDocument, replaceSettings, resetExportState],
  );

  const projects = useEditorProjects({
    settings,
    document: documentState,
    canvasWidth: canvasDimensions.width,
    canvasHeight: canvasDimensions.height,
    onLoadProject: loadProjectState,
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

  const applyTemplate = useCallback(
    (templateId: string) => {
      const template = getEditorTemplate(templateId);
      if (!template) {
        return;
      }

      applyCanvasSize(template.width, template.height);
      setBackground(template.background);
      resetExportState();
      projects.markProjectUntitled();
    },
    [applyCanvasSize, projects, resetExportState, setBackground],
  );

  const resetAll = useCallback(() => {
    layersState.resetLayers();
    resetSettings();
    resetExportState();
    projects.markProjectUntitled();
  }, [layersState, projects, resetExportState, resetSettings]);

  return {
    settings,
    updateSettings,
    applyTemplate,
    applyCanvasSize,
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
    ...projects,
  };
}
