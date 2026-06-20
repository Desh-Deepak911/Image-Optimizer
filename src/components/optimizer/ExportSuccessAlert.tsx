import { formatFileSize } from "@/lib/formatters";

interface ExportSuccessAlertProps {
  filename: string;
  size: number;
  onDismiss: () => void;
}

export function ExportSuccessAlert({
  filename,
  size,
  onDismiss,
}: ExportSuccessAlertProps) {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-xl border border-[#34c759]/20 bg-[#34c759]/[0.08] px-4 py-3"
    >
      <svg
        className="mt-0.5 h-4 w-4 shrink-0 text-[#248a3d]"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[#1d1d1f]">Download ready</p>
        <p className="mt-0.5 text-sm leading-relaxed text-[#6e6e73]">
          <span className="font-medium text-[#1d1d1f]">{filename}</span> saved
          to your downloads ({formatFileSize(size)}).
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-md p-1 text-[#86868b] transition-colors hover:bg-[#34c759]/10 hover:text-[#1d1d1f]"
        aria-label="Dismiss success message"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18 18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}
