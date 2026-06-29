"use client";

import { useCallback, useState } from "react";
import type { EditorDocumentState } from "@/hooks/useKonvaLayers";
import {
  createProjectSnapshot,
  deleteSavedProject,
  downloadProjectJson,
  listSavedProjects,
  loadSavedProjectSnapshot,
  parseProjectJsonFile,
  renameSavedProject,
  restoreProjectSnapshot,
  saveProjectSnapshot,
  type EditorProjectSnapshot,
  type SavedProjectIndexEntry,
} from "@/lib/konva/editorProjectStorage";
import type { AdvancedEditorSettings } from "@/types/konvaEditor";

interface UseEditorProjectsOptions {
  settings: AdvancedEditorSettings;
  document: EditorDocumentState;
  canvasWidth: number;
  canvasHeight: number;
  onLoadProject: (payload: {
    settings: AdvancedEditorSettings;
    document: EditorDocumentState;
    projectId: string | null;
    projectName: string;
  }) => void;
}

export function useEditorProjects({
  settings,
  document,
  canvasWidth,
  canvasHeight,
  onLoadProject,
}: UseEditorProjectsOptions) {
  const [savedProjects, setSavedProjects] = useState<SavedProjectIndexEntry[]>(
    () => listSavedProjects(),
  );
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeProjectName, setActiveProjectName] = useState("Untitled design");
  const [projectError, setProjectError] = useState<string | null>(null);
  const [isProjectBusy, setIsProjectBusy] = useState(false);

  const refreshSavedProjects = useCallback(() => {
    setSavedProjects(listSavedProjects());
  }, []);

  const clearProjectError = useCallback(() => {
    setProjectError(null);
  }, []);

  const buildSnapshot = useCallback(
    async (name: string, projectId?: string | null) => {
      return createProjectSnapshot(
        name,
        settings,
        document,
        projectId ?? undefined,
      );
    },
    [document, settings],
  );

  const saveCurrentProject = useCallback(
    async (name?: string) => {
      setIsProjectBusy(true);
      setProjectError(null);

      try {
        const nextName = (name ?? activeProjectName).trim() || "Untitled design";
        const snapshot = await buildSnapshot(nextName, activeProjectId);
        const entry = saveProjectSnapshot(snapshot);
        setActiveProjectId(entry.id);
        setActiveProjectName(entry.name);
        refreshSavedProjects();
        return entry;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to save this design.";
        setProjectError(message);
        throw error;
      } finally {
        setIsProjectBusy(false);
      }
    },
    [activeProjectId, activeProjectName, buildSnapshot, refreshSavedProjects],
  );

  const openSavedProject = useCallback(
    async (projectId: string) => {
      setIsProjectBusy(true);
      setProjectError(null);

      try {
        const snapshot = loadSavedProjectSnapshot(projectId);
        if (!snapshot) {
          throw new Error("Saved design could not be found.");
        }

        const restored = await restoreProjectSnapshot(snapshot);
        onLoadProject({
          ...restored,
          projectId: snapshot.id ?? projectId,
          projectName: snapshot.name,
        });
        setActiveProjectId(snapshot.id ?? projectId);
        setActiveProjectName(snapshot.name);
        refreshSavedProjects();
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to open this saved design.";
        setProjectError(message);
        throw error;
      } finally {
        setIsProjectBusy(false);
      }
    },
    [onLoadProject, refreshSavedProjects],
  );

  const renameProject = useCallback(
    async (projectId: string, name: string) => {
      setProjectError(null);

      try {
        const entry = renameSavedProject(projectId, name);
        if (!entry) {
          throw new Error("Enter a valid design name.");
        }

        if (activeProjectId === projectId) {
          setActiveProjectName(entry.name);
        }

        refreshSavedProjects();
        return entry;
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to rename this design.";
        setProjectError(message);
        throw error;
      }
    },
    [activeProjectId, refreshSavedProjects],
  );

  const removeProject = useCallback(
    (projectId: string) => {
      setProjectError(null);
      deleteSavedProject(projectId);

      if (activeProjectId === projectId) {
        setActiveProjectId(null);
      }

      refreshSavedProjects();
    },
    [activeProjectId, refreshSavedProjects],
  );

  const exportCurrentProjectJson = useCallback(async () => {
    setIsProjectBusy(true);
    setProjectError(null);

    try {
      const snapshot = await buildSnapshot(activeProjectName, activeProjectId);
      downloadProjectJson(snapshot);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to export this design.";
      setProjectError(message);
      throw error;
    } finally {
      setIsProjectBusy(false);
    }
  }, [activeProjectId, activeProjectName, buildSnapshot]);

  const importProjectJson = useCallback(
    async (file: File) => {
      setIsProjectBusy(true);
      setProjectError(null);

      try {
        const snapshot = await parseProjectJsonFile(file);
        const restored = await restoreProjectSnapshot(snapshot);
        onLoadProject({
          ...restored,
          projectId: snapshot.id ?? null,
          projectName: snapshot.name,
        });
        setActiveProjectId(snapshot.id ?? null);
        setActiveProjectName(snapshot.name);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to import this project file.";
        setProjectError(message);
        throw error;
      } finally {
        setIsProjectBusy(false);
      }
    },
    [onLoadProject],
  );

  const markProjectUntitled = useCallback(() => {
    setActiveProjectId(null);
    setActiveProjectName("Untitled design");
  }, []);

  return {
    savedProjects,
    activeProjectId,
    activeProjectName,
    setActiveProjectName,
    projectError,
    isProjectBusy,
    canvasWidth,
    canvasHeight,
    saveCurrentProject,
    openSavedProject,
    renameProject,
    removeProject,
    exportCurrentProjectJson,
    importProjectJson,
    refreshSavedProjects,
    clearProjectError,
    markProjectUntitled,
  };
}

export type { EditorProjectSnapshot, SavedProjectIndexEntry };
