import { getAspectRatioLabel, getFitModeLabel } from "@/lib/aspectRatio";

interface EditorToolbarProps {
  fileName: string;
  fileTypeLabel: string;
  aspectRatioLabel?: string;
  fitModeLabel?: string;
  onResetFraming: () => void;
}

export function EditorToolbar({
  fileName,
  fileTypeLabel,
  aspectRatioLabel,
  fitModeLabel,
  onResetFraming,
}: EditorToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-black/[0.04] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[#1d1d1f]">
          {fileName}
        </p>
        <p className="mt-0.5 text-xs text-[#86868b]">
          {fileTypeLabel}
          {aspectRatioLabel && fitModeLabel
            ? ` · ${aspectRatioLabel} · ${fitModeLabel}`
            : null}
        </p>
      </div>
      <button
        type="button"
        onClick={onResetFraming}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-black/[0.08] bg-[#f5f5f7] px-4 py-2 text-xs font-medium text-[#1d1d1f] transition-colors hover:bg-[#ebebed]"
      >
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.75}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
          />
        </svg>
        Reset framing
      </button>
    </div>
  );
}

export function getEditorToolbarLabels(
  aspectRatio: Parameters<typeof getAspectRatioLabel>[0],
  fitMode: Parameters<typeof getFitModeLabel>[0],
) {
  return {
    aspectRatioLabel: getAspectRatioLabel(aspectRatio),
    fitModeLabel: getFitModeLabel(fitMode),
  };
}
