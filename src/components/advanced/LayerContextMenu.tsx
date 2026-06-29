"use client";

export interface LayerContextMenuItem {
  id: string;
  label: string;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface LayerContextMenuProps {
  open: boolean;
  x: number;
  y: number;
  items: LayerContextMenuItem[];
  onClose: () => void;
}

export function LayerContextMenu({
  open,
  x,
  y,
  items,
  onClose,
}: LayerContextMenuProps) {
  if (!open) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        aria-label="Close context menu"
        className="fixed inset-0 z-50 cursor-default"
        onClick={onClose}
        onContextMenu={(event) => {
          event.preventDefault();
          onClose();
        }}
      />
      <div
        className="fixed z-50 min-w-44 overflow-hidden rounded-xl border border-black/[0.08] bg-white py-1 shadow-lg"
        style={{ left: x, top: y }}
        role="menu"
      >
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              item.onClick();
              onClose();
            }}
            className={`block w-full px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              item.destructive
                ? "text-[#ff3b30] hover:bg-[#ff3b30]/[0.08]"
                : "text-[#1d1d1f] hover:bg-[#f5f5f7]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}
