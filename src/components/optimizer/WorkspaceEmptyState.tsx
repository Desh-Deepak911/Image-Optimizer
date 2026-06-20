interface WorkspaceEmptyStateProps {
  compact?: boolean;
}

export function WorkspaceEmptyState({ compact = false }: WorkspaceEmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-black/[0.08] bg-white/70 text-center ${
        compact ? "px-5 py-8" : "px-6 py-12 sm:py-16"
      }`}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5f5f7]">
        <svg
          className="h-6 w-6 text-[#86868b]"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
          />
        </svg>
      </div>
      <h2 className="text-base font-semibold text-[#1d1d1f]">
        Your preview will appear here
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#86868b]">
        Upload a screenshot above, then pick an aspect ratio and fit mode to see
        a live preview before exporting.
      </p>
    </div>
  );
}
