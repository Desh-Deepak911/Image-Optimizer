"use client";

import { DownloadButton } from "@/components/optimizer/DownloadButton";
import { ExportSuccessAlert } from "@/components/optimizer/ExportSuccessAlert";
import { Header } from "@/components/optimizer/Header";
import { HeroSection } from "@/components/optimizer/HeroSection";
import { ImagePreview } from "@/components/optimizer/ImagePreview";
import { MetadataComparison } from "@/components/optimizer/MetadataComparison";
import { ResetButton } from "@/components/optimizer/ResetButton";
import { SettingsPanel } from "@/components/optimizer/SettingsPanel";
import { UploadErrorAlert } from "@/components/optimizer/UploadErrorAlert";
import { UploadZone } from "@/components/optimizer/UploadZone";
import { WorkspaceEmptyState } from "@/components/optimizer/WorkspaceEmptyState";
import { useOptimizerState } from "@/hooks/useOptimizerState";

export function OptimizerApp() {
  const {
    state,
    hasImage,
    uploadError,
    exportError,
    exportSuccess,
    isExporting,
    loadImageFromFile,
    resetAll,
    clearUploadError,
    clearExportError,
    clearExportSuccess,
    updateSettings,
    handleDownload,
  } = useOptimizerState();

  return (
    <div className="flex min-h-full flex-col bg-[#fbfbfd]">
      <Header />

      <HeroSection compact={hasImage} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-28 sm:px-6 sm:pb-16 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-8">
          <div className="flex min-w-0 flex-col gap-4">
            {uploadError ? (
              <UploadErrorAlert
                message={uploadError}
                onDismiss={clearUploadError}
              />
            ) : null}

            {exportError ? (
              <UploadErrorAlert
                message={exportError}
                onDismiss={clearExportError}
              />
            ) : null}

            {exportSuccess ? (
              <ExportSuccessAlert
                filename={exportSuccess.filename}
                size={exportSuccess.size}
                onDismiss={clearExportSuccess}
              />
            ) : null}

            <UploadZone onFileSelect={loadImageFromFile} hasImage={hasImage} />

            {hasImage && state.image ? (
              <>
                <MetadataComparison
                  image={state.image}
                  settings={state.settings}
                  exportSuccess={exportSuccess}
                />
                <ImagePreview
                  image={state.image}
                  aspectRatio={state.settings.aspectRatio}
                  fitMode={state.settings.fitMode}
                  isExporting={isExporting}
                />
              </>
            ) : (
              <WorkspaceEmptyState />
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
            <SettingsPanel
              settings={state.settings}
              image={state.image}
              onSettingChange={updateSettings}
              disabled={!hasImage}
            />

            <div className="hidden flex-col gap-3 lg:flex">
              <DownloadButton
                disabled={!hasImage}
                isExporting={isExporting}
                isSuccess={exportSuccess !== null}
                onClick={handleDownload}
                exportFormat={state.settings.exportFormat}
              />
              <ResetButton disabled={!hasImage && !exportSuccess} onClick={resetAll} />
            </div>
          </div>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.06] bg-white/90 p-4 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-lg flex-col gap-3">
          <DownloadButton
            disabled={!hasImage}
            isExporting={isExporting}
            isSuccess={exportSuccess !== null}
            onClick={handleDownload}
            exportFormat={state.settings.exportFormat}
          />
          {hasImage ? (
            <ResetButton disabled={isExporting} onClick={resetAll} />
          ) : null}
        </div>
      </div>

      <footer className="border-t border-black/[0.04] bg-white py-6 pb-28 lg:pb-6">
        <p className="text-center text-xs text-[#86868b]">
          All processing happens in your browser. Images never leave your device.
        </p>
      </footer>
    </div>
  );
}
