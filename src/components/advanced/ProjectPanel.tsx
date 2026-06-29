"use client";

import { useRef, useState } from "react";
import { formatProjectTimestamp } from "@/lib/konva/editorProjectStorage";
import type { SavedProjectIndexEntry } from "@/lib/konva/editorProjectStorage";

interface ProjectPanelProps {
  activeProjectName: string;
  savedProjects: SavedProjectIndexEntry[];
  isBusy?: boolean;
  onActiveProjectNameChange: (name: string) => void;
  onSaveProject: () => void | Promise<void>;
  onOpenProject: (projectId: string) => void | Promise<void>;
  onRenameProject: (projectId: string, name: string) => void | Promise<void>;
  onDeleteProject: (projectId: string) => void;
  onExportProjectJson: () => void | Promise<void>;
  onImportProjectJson: (file: File) => void | Promise<void>;
}

export function ProjectPanel({
  activeProjectName,
  savedProjects,
  isBusy = false,
  onActiveProjectNameChange,
  onSaveProject,
  onOpenProject,
  onRenameProject,
  onDeleteProject,
  onExportProjectJson,
  onImportProjectJson,
}: ProjectPanelProps) {
  const importInputRef = useRef<HTMLInputElement>(null);
  const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const startRename = (project: SavedProjectIndexEntry) => {
    setRenamingProjectId(project.id);
    setRenameValue(project.name);
  };

  const commitRename = async () => {
    if (!renamingProjectId) {
      return;
    }

    await onRenameProject(renamingProjectId, renameValue);
    setRenamingProjectId(null);
    setRenameValue("");
  };

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white px-4 py-4 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold text-[#1d1d1f]">Projects</h2>
        <p className="mt-0.5 text-xs text-[#86868b]">
          Save, reopen, and import designs locally in this browser
        </p>
      </div>

      <div className="mt-4 space-y-3">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-[#1d1d1f]">Design name</span>
          <input
            type="text"
            value={activeProjectName}
            onChange={(event) => onActiveProjectNameChange(event.target.value)}
            className="w-full rounded-xl border border-black/[0.08] bg-[#f5f5f7] px-3 py-2 text-sm text-[#1d1d1f] outline-none focus:border-[#0071e3]/40"
            placeholder="Untitled design"
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={isBusy}
            onClick={() => {
              void onSaveProject();
            }}
            className="rounded-xl bg-[#0071e3] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#0077ed] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save design
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => {
              void onExportProjectJson();
            }}
            className="rounded-xl border border-black/[0.06] bg-[#f5f5f7] px-3 py-2 text-xs font-semibold text-[#1d1d1f] transition-colors hover:border-[#0071e3]/30 hover:bg-[#0071e3]/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Export JSON
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={isBusy}
            onClick={() => importInputRef.current?.click()}
            className="rounded-xl border border-black/[0.06] bg-[#f5f5f7] px-3 py-2 text-xs font-semibold text-[#1d1d1f] transition-colors hover:border-[#0071e3]/30 hover:bg-[#0071e3]/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Import JSON
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                return;
              }

              void onImportProjectJson(file);
              event.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="mt-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[#86868b]">
          Recent designs
        </h3>

        {savedProjects.length === 0 ? (
          <p className="mt-2 rounded-xl bg-[#f5f5f7] px-3 py-3 text-xs text-[#86868b]">
            Saved designs appear here for quick reopening.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {savedProjects.map((project) => (
              <li
                key={project.id}
                className="rounded-xl border border-black/[0.06] bg-[#f5f5f7] px-3 py-3"
              >
                {renamingProjectId === project.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(event) => setRenameValue(event.target.value)}
                      className="w-full rounded-lg border border-black/[0.08] bg-white px-2 py-1.5 text-sm text-[#1d1d1f] outline-none focus:border-[#0071e3]/40"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          void commitRename();
                        }}
                        className="rounded-lg bg-[#0071e3] px-2 py-1 text-xs font-medium text-white"
                      >
                        Save name
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRenamingProjectId(null);
                          setRenameValue("");
                        }}
                        className="rounded-lg px-2 py-1 text-xs font-medium text-[#86868b]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => {
                          void onOpenProject(project.id);
                        }}
                        className="min-w-0 flex-1 text-left transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <span className="block truncate text-sm font-semibold text-[#1d1d1f]">
                          {project.name}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-[#86868b]">
                          {project.canvasWidth} × {project.canvasHeight}px ·{" "}
                          {project.layerCount} layer
                          {project.layerCount === 1 ? "" : "s"}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-[#86868b]">
                          {formatProjectTimestamp(project.updatedAt)}
                        </span>
                      </button>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => startRename(project)}
                        className="text-[11px] font-medium text-[#0071e3] hover:underline"
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteProject(project.id)}
                        className="text-[11px] font-medium text-[#ff3b30] hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
