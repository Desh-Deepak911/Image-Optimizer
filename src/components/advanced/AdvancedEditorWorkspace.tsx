"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef, useState } from "react";
import {
  AddLayerUpload,
  type AddLayerUploadHandle,
} from "@/components/advanced/AddLayerUpload";
import { AdvancedExportPanel } from "@/components/advanced/AdvancedExportPanel";
import { CleanupToolsPanel } from "@/components/advanced/CleanupToolsPanel";
import { DrawingToolsPanel } from "@/components/advanced/DrawingToolsPanel";
import { EditorControlsPanel } from "@/components/advanced/EditorControlsPanel";
import { EditorEmptyState } from "@/components/advanced/EditorEmptyState";
import { EditorToolbar } from "@/components/advanced/EditorToolbar";
import { LayerAlignmentControls } from "@/components/advanced/LayerAlignmentControls";
import { LayerPanel } from "@/components/advanced/LayerPanel";
import { LayerQuickActions } from "@/components/advanced/LayerQuickActions";
import type { LayerContextMenuItem } from "@/components/advanced/LayerContextMenu";
import { ProjectPanel } from "@/components/advanced/ProjectPanel";
import { QuickLayoutPanel } from "@/components/advanced/QuickLayoutPanel";
import { ScreenshotToolsPanel } from "@/components/advanced/ScreenshotToolsPanel";
import { TemplateGallery } from "@/components/advanced/TemplateGallery";
import { DownloadButton } from "@/components/optimizer/DownloadButton";
import { ExportSuccessAlert } from "@/components/optimizer/ExportSuccessAlert";
import { ResetButton } from "@/components/optimizer/ResetButton";
import { UploadErrorAlert } from "@/components/optimizer/UploadErrorAlert";
import { useAdvancedEditor } from "@/hooks/useAdvancedEditor";
import { useEditorKeyboardShortcuts } from "@/hooks/useEditorKeyboardShortcuts";
import type { LayerAlignment } from "@/lib/konva/layerBounds";
import type { QuickLayoutId } from "@/lib/konva/quickLayouts";
import type { ScreenshotMockupId } from "@/lib/konva/screenshotMockups";
import type { CleanupToolId, EditorToolId, ImageSourceCrop } from "@/types/konvaEditor";

const KonvaEditorStage = dynamic(
  () =>
    import("@/components/advanced/KonvaEditorStage").then(
      (module) => module.KonvaEditorStage,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[280px] items-center justify-center rounded-lg bg-[#f5f5f7] text-sm text-[#86868b]">
        Loading canvas editor…
      </div>
    ),
  },
);

export function AdvancedEditorWorkspace() {
  const editor = useAdvancedEditor();
  const uploadRef = useRef<AddLayerUploadHandle>(null);
  const [cropEditingLayerId, setCropEditingLayerId] = useState<string | null>(
    null,
  );
  const activeCropEditingLayerId =
    cropEditingLayerId === editor.selectedLayerId ? cropEditingLayerId : null;

  useEditorKeyboardShortcuts({
    enabled: editor.showCanvas,
    onDeleteSelected: editor.deleteSelectedLayer,
    onUndo: editor.undo,
    onRedo: editor.redo,
    onEscape: editor.resetToSelectTool,
  });

  const handleSelectedLayerAction = (
    action: (layerId: string) => void,
  ) => {
    if (!editor.selectedLayerId) {
      return;
    }

    action(editor.selectedLayerId);
  };

  const getLayerContextMenuItems = useCallback(
    (layerId: string): LayerContextMenuItem[] => {
      const layer = editor.layers.find((item) => item.id === layerId);
      const isImage = layer?.type === "image";

      return [
        {
          id: "duplicate",
          label: "Duplicate",
          onClick: () => editor.duplicateLayer(layerId),
        },
        {
          id: "forward",
          label: "Bring forward",
          onClick: () => editor.moveLayerUp(layerId),
        },
        {
          id: "backward",
          label: "Send backward",
          onClick: () => editor.moveLayerDown(layerId),
        },
        {
          id: "center",
          label: "Center",
          onClick: () => editor.centerLayer(layerId),
        },
        ...(isImage
          ? [
              {
                id: "fit",
                label: "Fit to canvas",
                onClick: () => editor.fitLayerToCanvasMode(layerId, "contain"),
              },
              {
                id: "fill",
                label: "Fill canvas",
                onClick: () => editor.fitLayerToCanvasMode(layerId, "cover"),
              },
              {
                id: "reset",
                label: "Reset effects",
                onClick: () => editor.resetLayerEffects(layerId),
              },
            ]
          : []),
        {
          id: "delete",
          label: "Delete",
          onClick: () => editor.deleteLayer(layerId),
          destructive: true,
        },
      ];
    },
    [editor],
  );

  const handleCleanupToolChange = useCallback(
    (tool: CleanupToolId) => {
      if (tool !== "crop" && cropEditingLayerId) {
        editor.checkpointHistory();
        setCropEditingLayerId(null);
      }

      editor.setCleanupTool(tool);
    },
    [cropEditingLayerId, editor],
  );

  const handleEditorToolChange = useCallback(
    (tool: EditorToolId) => {
      if (tool !== "select" && cropEditingLayerId) {
        editor.checkpointHistory();
        setCropEditingLayerId(null);
      }

      editor.setEditorTool(tool);
    },
    [cropEditingLayerId, editor],
  );

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)] lg:gap-8">
        <div className="flex min-w-0 flex-col gap-4">
          {editor.uploadError ? (
            <UploadErrorAlert
              message={editor.uploadError}
              onDismiss={editor.clearUploadError}
            />
          ) : null}

          {editor.exportError ? (
            <UploadErrorAlert
              message={editor.exportError}
              onDismiss={editor.clearExportError}
            />
          ) : null}

          {editor.exportSuccess ? (
            <ExportSuccessAlert
              filename={editor.exportSuccess.filename}
              size={editor.exportSuccess.size}
              onDismiss={editor.clearExportSuccess}
            />
          ) : null}

          {editor.projectError ? (
            <UploadErrorAlert
              message={editor.projectError}
              onDismiss={editor.clearProjectError}
            />
          ) : null}

          {editor.showCanvas ? (
            <div className="order-1 overflow-hidden rounded-2xl border border-black/[0.06] bg-white shadow-sm">
              <div className="border-b border-black/[0.04] px-4 py-3 sm:px-5">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-[#1d1d1f]">
                      Composition canvas
                    </h2>
                    <p className="mt-0.5 text-xs text-[#86868b] sm:truncate">
                      Canvas {editor.canvasDimensions.width} ×{" "}
                      {editor.canvasDimensions.height}px · Export{" "}
                      {editor.exportDimensions.width} ×{" "}
                      {editor.exportDimensions.height}px
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative bg-[#f5f5f7] p-3 sm:p-4">
                <KonvaEditorStage
                  layers={editor.layers}
                  selectedLayerId={editor.selectedLayerId}
                  stageWidth={editor.canvasDimensions.width}
                  stageHeight={editor.canvasDimensions.height}
                  background={editor.background}
                  onSelectLayer={editor.selectLayer}
                  onLayerChange={editor.updateLayer}
                  onStageRef={editor.setStageRef}
                  getContextMenuItems={getLayerContextMenuItems}
                  cropEditingLayerId={activeCropEditingLayerId}
                  onCropChange={(layerId: string, crop: ImageSourceCrop) => {
                    editor.updateLayerProperties(layerId, { crop }, false);
                  }}
                  cleanupTool={editor.cleanupTool}
                  brushSize={editor.brushSize}
                  brushIntensity={editor.brushIntensity}
                  onCleanupStrokeStart={editor.checkpointHistory}
                  onCleanupStrokePreview={editor.previewCleanupStrokes}
                  onCoverPatchComplete={(rect) => {
                    editor.addCoverPatchLayer(rect);
                    editor.setCleanupTool("select");
                  }}
                  editorTool={editor.editorTool}
                  drawingSettings={editor.drawingSettings}
                  onLineComplete={(geometry) => {
                    editor.addVectorShapeLayer({
                      ...geometry,
                      settings: editor.drawingSettings,
                    });
                    editor.setEditorTool("select");
                  }}
                  onFreehandComplete={(geometry) => {
                    editor.addVectorShapeLayer({
                      ...geometry,
                      settings: editor.drawingSettings,
                    });
                    editor.setEditorTool("select");
                  }}
                  onCalloutComplete={(geometry) => {
                    editor.addCalloutLayer({
                      ...geometry,
                      settings: editor.drawingSettings,
                      markerNumber:
                        geometry.calloutType === "numbered-marker"
                          ? editor.getNextMarkerNumber()
                          : undefined,
                    });
                    editor.setEditorTool("select");
                  }}
                />

                {editor.isExporting ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/75 backdrop-blur-sm">
                    <p className="text-sm font-medium text-[#1d1d1f]">
                      Exporting composition…
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="order-1">
              <EditorEmptyState
                onSelectTemplate={editor.applyTemplate}
                onUploadClick={() => uploadRef.current?.openFilePicker()}
              />
            </div>
          )}

          <div className="order-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <AddLayerUpload
              ref={uploadRef}
              onFileSelect={(file) => {
                void editor.addLayerFromFile(file);
              }}
              layerCount={editor.layers.length}
            />

            <EditorToolbar
              onAddText={editor.addTextLayer}
              onAddShape={editor.addShapeLayer}
              onUndo={editor.undo}
              onRedo={editor.redo}
              canUndo={editor.canUndo}
              canRedo={editor.canRedo}
            />
          </div>

          {editor.showCanvas ? (
            <div className="order-3 lg:hidden space-y-4">
              <DrawingToolsPanel
                editorTool={editor.editorTool}
                drawingSettings={editor.drawingSettings}
                onEditorToolChange={handleEditorToolChange}
                onDrawingSettingChange={editor.updateDrawingSetting}
              />
              <CleanupToolsPanel
                cleanupTool={editor.cleanupTool}
                brushSize={editor.brushSize}
                brushIntensity={editor.brushIntensity}
                selectedLayer={editor.selectedLayer}
                cropEditingLayerId={activeCropEditingLayerId}
                onCleanupToolChange={handleCleanupToolChange}
                onBrushSizeChange={editor.setBrushSize}
                onBrushIntensityChange={editor.setBrushIntensity}
                onStartCropEdit={(layerId) => {
                  editor.selectLayer(layerId);
                  editor.checkpointHistory();
                  setCropEditingLayerId(layerId);
                }}
                onFinishCropEdit={() => {
                  editor.checkpointHistory();
                  setCropEditingLayerId(null);
                }}
                onResetCrop={(layerId) => {
                  editor.resetLayerCrop(layerId);
                  setCropEditingLayerId(null);
                }}
                onClearCleanupStrokes={editor.clearCleanupStrokes}
              />
              <QuickLayoutPanel
                imageLayerCount={editor.imageLayerCount}
                onApplyLayout={(layoutId: QuickLayoutId) => {
                  editor.applyQuickLayout(layoutId);
                }}
              />
              <div className="mt-4">
                <ScreenshotToolsPanel
                  imageLayerCount={editor.imageLayerCount}
                  selectedImageLayerId={
                    editor.selectedLayer?.type === "image"
                      ? editor.selectedLayer.id
                      : null
                  }
                  onApplyMockup={(mockupId: ScreenshotMockupId, layerId) => {
                    editor.applyScreenshotMockup(mockupId, layerId);
                  }}
                  onApplyAutoPadding={(layerId) => {
                    editor.applyAutoPadding(layerId);
                  }}
                  onApplyBackground={(presetId) => {
                    editor.applyScreenshotBackground(presetId);
                  }}
                  onApplyLayout={(layoutId: QuickLayoutId) => {
                    editor.applyQuickLayout(layoutId);
                  }}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col gap-4 pb-36 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:self-start lg:pb-0">
          <ProjectPanel
            activeProjectName={editor.activeProjectName}
            savedProjects={editor.savedProjects}
            isBusy={editor.isProjectBusy}
            onActiveProjectNameChange={editor.setActiveProjectName}
            onSaveProject={() => {
              void editor.saveCurrentProject();
            }}
            onOpenProject={(projectId) => {
              void editor.openSavedProject(projectId);
            }}
            onRenameProject={(projectId, name) => {
              void editor.renameProject(projectId, name);
            }}
            onDeleteProject={editor.removeProject}
            onExportProjectJson={() => {
              void editor.exportCurrentProjectJson();
            }}
            onImportProjectJson={(file) => {
              void editor.importProjectJson(file);
            }}
          />

          {editor.showCanvas ? (
            <TemplateGallery onSelectTemplate={editor.applyTemplate} />
          ) : null}

          <LayerPanel
            layers={editor.layers}
            selectedLayerId={editor.selectedLayerId}
            onSelectLayer={editor.selectLayer}
            onDeleteLayer={editor.deleteLayer}
            onDuplicateLayer={editor.duplicateLayer}
            onMoveLayerUp={editor.moveLayerUp}
            onMoveLayerDown={editor.moveLayerDown}
            onToggleLock={editor.toggleLayerLock}
            onToggleVisibility={editor.toggleLayerVisibility}
          />

          <LayerQuickActions
            selectedLayer={editor.selectedLayer}
            onCenter={() => {
              handleSelectedLayerAction(editor.centerLayer);
            }}
            onFitToCanvas={() => {
              handleSelectedLayerAction((layerId) => {
                editor.fitLayerToCanvasMode(layerId, "contain");
              });
            }}
            onFillCanvas={() => {
              handleSelectedLayerAction((layerId) => {
                editor.fitLayerToCanvasMode(layerId, "cover");
              });
            }}
            onDuplicate={() => {
              handleSelectedLayerAction(editor.duplicateLayer);
            }}
            onBringForward={() => {
              handleSelectedLayerAction(editor.moveLayerUp);
            }}
            onSendBackward={() => {
              handleSelectedLayerAction(editor.moveLayerDown);
            }}
            onResetEffects={() => {
              handleSelectedLayerAction(editor.resetLayerEffects);
            }}
          />

          <LayerAlignmentControls
            disabled={!editor.selectedLayer}
            onAlign={(alignment: LayerAlignment) => {
              handleSelectedLayerAction((layerId) => {
                editor.alignLayer(layerId, alignment);
              });
            }}
          />

          {editor.showCanvas ? (
            <div className="hidden lg:block space-y-4">
              <DrawingToolsPanel
                editorTool={editor.editorTool}
                drawingSettings={editor.drawingSettings}
                onEditorToolChange={handleEditorToolChange}
                onDrawingSettingChange={editor.updateDrawingSetting}
              />
              <CleanupToolsPanel
                cleanupTool={editor.cleanupTool}
                brushSize={editor.brushSize}
                brushIntensity={editor.brushIntensity}
                selectedLayer={editor.selectedLayer}
                cropEditingLayerId={activeCropEditingLayerId}
                onCleanupToolChange={handleCleanupToolChange}
                onBrushSizeChange={editor.setBrushSize}
                onBrushIntensityChange={editor.setBrushIntensity}
                onStartCropEdit={(layerId) => {
                  editor.selectLayer(layerId);
                  editor.checkpointHistory();
                  setCropEditingLayerId(layerId);
                }}
                onFinishCropEdit={() => {
                  editor.checkpointHistory();
                  setCropEditingLayerId(null);
                }}
                onResetCrop={(layerId) => {
                  editor.resetLayerCrop(layerId);
                  setCropEditingLayerId(null);
                }}
                onClearCleanupStrokes={editor.clearCleanupStrokes}
              />
              <ScreenshotToolsPanel
                imageLayerCount={editor.imageLayerCount}
                selectedImageLayerId={
                  editor.selectedLayer?.type === "image"
                    ? editor.selectedLayer.id
                    : null
                }
                onApplyMockup={(mockupId: ScreenshotMockupId, layerId) => {
                  editor.applyScreenshotMockup(mockupId, layerId);
                }}
                onApplyAutoPadding={(layerId) => {
                  editor.applyAutoPadding(layerId);
                }}
                onApplyBackground={(presetId) => {
                  editor.applyScreenshotBackground(presetId);
                }}
                onApplyLayout={(layoutId: QuickLayoutId) => {
                  editor.applyQuickLayout(layoutId);
                }}
              />
              <QuickLayoutPanel
                imageLayerCount={editor.imageLayerCount}
                onApplyLayout={(layoutId: QuickLayoutId) => {
                  editor.applyQuickLayout(layoutId);
                }}
              />
            </div>
          ) : null}

          <EditorControlsPanel
            selectedLayer={editor.selectedLayer}
            background={editor.background}
            cropEditingLayerId={activeCropEditingLayerId}
            onUpdateLayer={editor.updateLayerProperties}
            onUpdateBackground={editor.updateBackground}
            onHistoryCheckpoint={editor.checkpointHistory}
            onStartCropEdit={(layerId) => {
              editor.selectLayer(layerId);
              editor.checkpointHistory();
              setCropEditingLayerId(layerId);
            }}
            onFinishCropEdit={() => {
              editor.checkpointHistory();
              setCropEditingLayerId(null);
            }}
            onResetCrop={(layerId) => {
              editor.resetLayerCrop(layerId);
              setCropEditingLayerId(null);
            }}
          />

          <AdvancedExportPanel
            settings={editor.settings}
            canvasWidth={editor.canvasDimensions.width}
            canvasHeight={editor.canvasDimensions.height}
            exportWidth={editor.exportDimensions.width}
            exportHeight={editor.exportDimensions.height}
            onSettingChange={editor.updateSettings}
          />

          <div className="hidden flex-col gap-3 lg:flex">
            <DownloadButton
              disabled={!editor.canExport}
              isExporting={editor.isExporting}
              isSuccess={editor.exportSuccess !== null}
              onClick={() => {
                void editor.handleDownload();
              }}
              exportFormat={editor.settings.exportFormat}
            />
            <ResetButton
              disabled={!editor.canExport && !editor.exportSuccess}
              onClick={editor.resetAll}
            />
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.06] bg-white/90 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-lg flex-col gap-3">
          <DownloadButton
            disabled={!editor.canExport}
            isExporting={editor.isExporting}
            isSuccess={editor.exportSuccess !== null}
            onClick={() => {
              void editor.handleDownload();
            }}
            exportFormat={editor.settings.exportFormat}
          />
          {editor.canExport ? (
            <ResetButton disabled={editor.isExporting} onClick={editor.resetAll} />
          ) : null}
        </div>
      </div>
    </>
  );
}
