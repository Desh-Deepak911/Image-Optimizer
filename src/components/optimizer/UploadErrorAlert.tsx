interface UploadErrorAlertProps {
  message: string;
  onDismiss: () => void;
}

export function UploadErrorAlert({ message, onDismiss }: UploadErrorAlertProps) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-[#ff3b30]/20 bg-[#ff3b30]/[0.06] px-4 py-3"
    >
      <svg
        className="mt-0.5 h-4 w-4 shrink-0 text-[#ff3b30]"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
        />
      </svg>
      <p className="flex-1 text-sm leading-relaxed text-[#1d1d1f]">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-md p-1 text-[#86868b] transition-colors hover:bg-[#ff3b30]/10 hover:text-[#1d1d1f]"
        aria-label="Dismiss error"
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
