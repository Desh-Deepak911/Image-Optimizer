"use client";

import dynamic from "next/dynamic";
import { AddLayerUpload } from "@/components/advanced/AddLayerUpload";
import { AdvancedExportPanel } from "@/components/advanced/AdvancedExportPanel";
import { EditorControlsPanel } from "@/components/advanced/EditorControlsPanel";
import { EditorToolbar } from "@/components/advanced/EditorToolbar";
import { LayerPanel } from "@/components/advanced/LayerPanel";
import { DownloadButton } from "@/components/optimizer/DownloadButton";
import { ExportSuccessAlert } from "@/components/optimizer/ExportSuccessAlert";
import { ResetButton } from "@/components/optimizer/ResetButton";
import { UploadErrorAlert } from "@/components/optimizer/UploadErrorAlert";
import { WorkspaceEmptyState } from "@/components/optimizer/WorkspaceEmptyState";
import { useAdvancedEditor } from "@/hooks/useAdvancedEditor";
import { useEditorKeyboardShortcuts } from "@/hooks/useEditorKeyboardShortcuts";

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

  useEditorKeyboardShortcuts({
    enabled: editor.showCanvas,
    onDeleteSelected: editor.deleteSelectedLayer,
    onUndo: editor.undo,
    onRedo: editor.redo,
  });

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
              <WorkspaceEmptyState />
            </div>
          )}

          <div className="order-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <AddLayerUpload
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
        </div>

        <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:self-start">
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

          <EditorControlsPanel
            selectedLayer={editor.selectedLayer}
            background={editor.background}
            onUpdateLayer={editor.updateLayerProperties}
            onUpdateBackground={editor.updateBackground}
            onHistoryCheckpoint={editor.checkpointHistory}
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
