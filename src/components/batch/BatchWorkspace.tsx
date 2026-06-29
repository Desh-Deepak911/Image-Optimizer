"use client";

import { BatchFileList } from "@/components/batch/BatchFileList";
import { BatchPreview } from "@/components/batch/BatchPreview";
import { BatchSettingsPanel } from "@/components/batch/BatchSettingsPanel";
import { BatchUploadZone } from "@/components/batch/BatchUploadZone";
import { UploadErrorAlert } from "@/components/optimizer/UploadErrorAlert";
import { useBatchExport } from "@/hooks/useBatchExport";

export function BatchWorkspace() {
  const batch = useBatchExport();

  const isBusy = batch.isProcessing || batch.isDownloadingZip;

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-8">
        <div className="flex min-w-0 flex-col gap-4">
          {batch.uploadError ? (
            <UploadErrorAlert
              message={batch.uploadError}
              onDismiss={batch.clearUploadError}
            />
          ) : null}

          {batch.exportError ? (
            <UploadErrorAlert
              message={batch.exportError}
              onDismiss={batch.clearExportError}
            />
          ) : null}

          <BatchUploadZone
            itemCount={batch.items.length}
            maxCount={batch.maxBatchCount}
            onFilesSelect={(files) => {
              void batch.addFiles(files);
            }}
          />

          <BatchFileList
            items={batch.items}
            selectedItemId={batch.selectedItemId}
            onSelectItem={batch.selectItem}
            onRemoveItem={batch.removeItem}
            onRetryItem={(itemId) => {
              void batch.retryItem(itemId);
            }}
            isProcessing={batch.isProcessing}
          />

          {batch.selectedItem ? (
            <BatchPreview
              image={batch.selectedItem.image}
              settings={batch.settings}
            />
          ) : null}

          {batch.isProcessing && batch.progress.total > 0 ? (
            <div className="rounded-2xl border border-black/[0.06] bg-white px-4 py-4 shadow-sm">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-[#1d1d1f]">Processing batch</span>
                <span className="tabular-nums text-[#86868b]">
                  {batch.progress.completed} / {batch.progress.total}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f5f5f7]">
                <div
                  className="h-full rounded-full bg-[#0071e3] transition-all duration-300"
                  style={{
                    width: `${(batch.progress.completed / batch.progress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
          <BatchSettingsPanel
            settings={batch.settings}
            previewImage={batch.selectedItem?.image ?? null}
            onSettingChange={batch.updateSettings}
          />

          <div className="hidden flex-col gap-3 lg:flex">
            <button
              type="button"
              disabled={!batch.hasItems || isBusy}
              onClick={() => {
                void batch.processAll();
              }}
              className="w-full rounded-xl bg-[#0071e3] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0077ed] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {batch.isProcessing ? "Processing…" : "Process all images"}
            </button>

            <button
              type="button"
              disabled={!batch.canDownloadZip}
              onClick={() => {
                void batch.downloadZip();
              }}
              className="w-full rounded-xl border border-black/[0.06] bg-white px-4 py-3 text-sm font-semibold text-[#1d1d1f] transition-colors hover:border-[#0071e3]/30 hover:bg-[#0071e3]/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {batch.isDownloadingZip
                ? "Creating ZIP…"
                : `Download ZIP (${batch.doneCount})`}
            </button>

            <button
              type="button"
              disabled={!batch.hasItems || isBusy}
              onClick={batch.clearBatch}
              className="w-full rounded-xl border border-black/[0.06] bg-[#f5f5f7] px-4 py-3 text-sm font-medium text-[#86868b] transition-colors hover:bg-[#ebebed] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear batch
            </button>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.06] bg-white/90 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-lg flex-col gap-3">
          <button
            type="button"
            disabled={!batch.hasItems || isBusy}
            onClick={() => {
              void batch.processAll();
            }}
            className="w-full rounded-xl bg-[#0071e3] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0077ed] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {batch.isProcessing ? "Processing…" : "Process all images"}
          </button>

          <button
            type="button"
            disabled={!batch.canDownloadZip}
            onClick={() => {
              void batch.downloadZip();
            }}
            className="w-full rounded-xl border border-black/[0.06] bg-white px-4 py-3 text-sm font-semibold text-[#1d1d1f] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
          >
            {batch.isDownloadingZip
              ? "Creating ZIP…"
              : `Download ZIP (${batch.doneCount})`}
          </button>
        </div>
      </div>
    </>
  );
}
