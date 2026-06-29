"use client";

import { formatFileSize } from "@/lib/formatters";
import type { BatchItem, BatchItemStatus } from "@/types/batch";

interface BatchFileListProps {
  items: BatchItem[];
  selectedItemId: string | null;
  onSelectItem: (itemId: string) => void;
  onRemoveItem: (itemId: string) => void;
  onRetryItem: (itemId: string) => void;
  isProcessing: boolean;
}

const STATUS_LABELS: Record<BatchItemStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  done: "Done",
  failed: "Failed",
};

function StatusBadge({ status }: { status: BatchItemStatus }) {
  const styles: Record<BatchItemStatus, string> = {
    pending: "bg-[#f5f5f7] text-[#86868b]",
    processing: "bg-[#0071e3]/10 text-[#0071e3]",
    done: "bg-[#34c759]/10 text-[#248a3d]",
    failed: "bg-[#ff3b30]/10 text-[#c41e3a]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${styles[status]}`}
    >
      {status === "processing" ? (
        <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-current" />
      ) : null}
      {STATUS_LABELS[status]}
    </span>
  );
}

export function BatchFileList({
  items,
  selectedItemId,
  onSelectItem,
  onRemoveItem,
  onRetryItem,
  isProcessing,
}: BatchFileListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-black/[0.06] bg-white px-4 py-8 text-center shadow-sm">
        <p className="text-sm text-[#86868b]">
          Uploaded images will appear here. Select one to preview batch settings.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white shadow-sm">
      <div className="border-b border-black/[0.04] px-4 py-3">
        <h2 className="text-sm font-semibold text-[#1d1d1f]">
          Batch queue ({items.length})
        </h2>
      </div>

      <ul className="max-h-80 divide-y divide-black/[0.04] overflow-y-auto">
        {items.map((item) => {
          const isSelected = item.id === selectedItemId;

          return (
            <li key={item.id}>
              <div
                className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                  isSelected ? "bg-[#0071e3]/[0.06]" : "hover:bg-[#f5f5f7]/80"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectItem(item.id)}
                  className="flex min-w-0 flex-1 items-start gap-3 text-left"
                >
                  <div
                    className="h-14 w-14 shrink-0 rounded-lg border border-black/[0.06] bg-[#f5f5f7] bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${item.image.previewUrl})`,
                    }}
                    role="img"
                    aria-label={item.image.name}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#1d1d1f]">
                      {item.image.name}
                    </p>
                    <p className="mt-0.5 text-xs text-[#86868b]">
                      {item.image.width} × {item.image.height}px ·{" "}
                      {formatFileSize(item.image.size)}
                    </p>
                    <div className="mt-2">
                      <StatusBadge status={item.status} />
                    </div>
                    {item.status === "failed" && item.error ? (
                      <p className="mt-1 text-xs text-[#ff3b30]">{item.error}</p>
                    ) : null}
                  </div>
                </button>

                <div className="flex shrink-0 flex-col gap-1">
                  {item.status === "failed" ? (
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => onRetryItem(item.id)}
                      className="rounded-lg px-2 py-1 text-xs font-medium text-[#0071e3] hover:bg-[#0071e3]/10 disabled:opacity-40"
                    >
                      Retry
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={isProcessing && item.status === "processing"}
                    onClick={() => onRemoveItem(item.id)}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-[#86868b] hover:bg-black/[0.04] disabled:opacity-40"
                    aria-label={`Remove ${item.image.name}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
