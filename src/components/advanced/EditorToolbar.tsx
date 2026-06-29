"use client";

import {
  EDITOR_TOOL_HINTS,
  isAnnotationTool,
  isCalloutTool,
  isDrawingTool,
} from "@/lib/konva/annotationTools";
import {
  AnnotationStylePanel,
  editorToolToStyleContext,
} from "@/components/advanced/AnnotationStylePanel";
import type { AnnotationStyle } from "@/types/annotationStyle";
import type { EditorToolId, ShapeKind } from "@/types/konvaEditor";

interface EditorToolbarProps {
  editorTool: EditorToolId;
  annotationStyle: AnnotationStyle;
  onEditorToolChange: (tool: EditorToolId) => void;
  onAnnotationStyleChange: (update: Partial<AnnotationStyle>) => void;
  onAddText: () => void;
  onAddShape: (shape: ShapeKind) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const ADD_ELEMENT_BUTTONS: {
  id: string;
  label: string;
  kind: "text" | "shape" | "tool";
  shape?: ShapeKind;
  tool?: EditorToolId;
}[] = [
  { id: "text", label: "Text", kind: "text" },
  { id: "rectangle", label: "Rectangle", kind: "shape", shape: "rectangle" },
  { id: "circle", label: "Circle", kind: "shape", shape: "circle" },
  { id: "line", label: "Line", kind: "tool", tool: "line" },
  { id: "arrow", label: "Arrow", kind: "tool", tool: "arrow" },
  { id: "freehand", label: "Pencil", kind: "tool", tool: "freehand" },
  { id: "highlighter", label: "Highlighter", kind: "tool", tool: "highlighter" },
  { id: "label", label: "Label", kind: "tool", tool: "label" },
  {
    id: "speech-bubble",
    label: "Speech Bubble",
    kind: "tool",
    tool: "speech-bubble",
  },
  {
    id: "numbered-marker",
    label: "Number Marker",
    kind: "tool",
    tool: "numbered-marker",
  },
];

function ToolButton({
  label,
  isActive = false,
  onClick,
  disabled = false,
}: {
  label: string;
  isActive?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={isActive}
      className={`rounded-xl border px-2.5 py-2 text-xs font-semibold transition-colors ${
        isActive
          ? "border-[#0071e3] bg-[#0071e3]/[0.08] text-[#0071e3]"
          : "border-black/[0.08] bg-white text-[#1d1d1f] hover:border-[#0071e3]/30 hover:bg-[#0071e3]/[0.06]"
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {label}
    </button>
  );
}

export function EditorToolbar({
  editorTool,
  annotationStyle,
  onEditorToolChange,
  onAnnotationStyleChange,
  onAddText,
  onAddShape,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: EditorToolbarProps) {
  const styleContext = editorToolToStyleContext(editorTool);
  const showStylePanel =
    isDrawingTool(editorTool) || isCalloutTool(editorTool);
  const activeToolLabel =
    editorTool === "select"
      ? "Select"
      : (ADD_ELEMENT_BUTTONS.find((button) => button.tool === editorTool)
          ?.label ?? editorTool);

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white px-4 py-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#1d1d1f]">Add elements</p>
          <p className="mt-0.5 text-xs text-[#86868b]">
            Text, shapes, lines, arrows, and annotations
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ToolButton label="Undo" onClick={onUndo} disabled={!canUndo} />
          <ToolButton label="Redo" onClick={onRedo} disabled={!canRedo} />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#f5f5f7] px-3 py-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-[#86868b]">
          Active tool
        </span>
        <span className="text-xs font-semibold text-[#0071e3]">
          {activeToolLabel}
        </span>
        {isAnnotationTool(editorTool) ? (
          <span className="ml-auto text-[10px] text-[#86868b]">Esc → Select</span>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
        <ToolButton
          label="Select"
          isActive={editorTool === "select"}
          onClick={() => onEditorToolChange("select")}
        />

        {ADD_ELEMENT_BUTTONS.map((button) => {
          const isActive =
            button.kind === "tool" && button.tool === editorTool;

          return (
            <ToolButton
              key={button.id}
              label={button.label}
              isActive={isActive}
              onClick={() => {
                if (button.kind === "text") {
                  onAddText();
                  return;
                }

                if (button.kind === "shape" && button.shape) {
                  onAddShape(button.shape);
                  onEditorToolChange("select");
                  return;
                }

                if (button.kind === "tool" && button.tool) {
                  onEditorToolChange(button.tool);
                }
              }}
            />
          );
        })}
      </div>

      <p className="mt-3 rounded-lg bg-[#f5f5f7] px-3 py-2 text-xs leading-relaxed text-[#86868b]">
        {EDITOR_TOOL_HINTS[editorTool]}
      </p>

      {showStylePanel && styleContext ? (
        <AnnotationStylePanel
          style={annotationStyle}
          context={styleContext}
          onChange={onAnnotationStyleChange}
        />
      ) : null}

      <p className="mt-3 text-[11px] leading-relaxed text-[#86868b]">
        Shortcuts: Delete to remove layer · ⌘/Ctrl+Z undo · ⌘/Ctrl+Shift+Z redo · Esc to Select
      </p>
    </div>
  );
}
