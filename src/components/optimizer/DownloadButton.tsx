interface DownloadButtonProps {
  disabled: boolean;
  isExporting: boolean;
  isSuccess?: boolean;
  onClick: () => void;
  exportFormat: string;
}

export function DownloadButton({
  disabled,
  isExporting,
  isSuccess = false,
  onClick,
  exportFormat,
}: DownloadButtonProps) {
  const isDisabled = disabled || isExporting;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition-all duration-200 enabled:active:scale-[0.99] disabled:cursor-not-allowed ${
        isSuccess
          ? "bg-[#34c759] text-white enabled:hover:bg-[#30b350]"
          : "bg-[#1d1d1f] text-white enabled:hover:bg-[#333336] disabled:bg-[#d2d2d7] disabled:text-[#86868b]"
      }`}
    >
      {isExporting ? (
        <svg
          className="h-4 w-4 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : isSuccess ? (
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
            d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
      ) : (
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
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
          />
        </svg>
      )}
      {isExporting
        ? "Processing…"
        : isSuccess
          ? "Downloaded successfully"
          : disabled
            ? "Upload an image to download"
            : `Download ${exportFormat.toUpperCase()}`}
    </button>
  );
}
