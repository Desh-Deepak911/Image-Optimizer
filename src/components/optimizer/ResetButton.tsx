interface ResetButtonProps {
  disabled?: boolean;
  onClick: () => void;
  variant?: "secondary" | "ghost";
}

export function ResetButton({
  disabled = false,
  onClick,
  variant = "secondary",
}: ResetButtonProps) {
  const className =
    variant === "ghost"
      ? "rounded-full px-3 py-1.5 text-xs font-medium text-[#86868b] transition-colors hover:bg-[#f5f5f7] hover:text-[#1d1d1f] disabled:cursor-not-allowed disabled:opacity-40"
      : "flex w-full items-center justify-center gap-2 rounded-xl border border-black/[0.08] bg-white px-5 py-3 text-sm font-medium text-[#1d1d1f] transition-colors hover:bg-[#f5f5f7] disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      <svg
        className="h-4 w-4"
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
      Reset
    </button>
  );
}
