import type { EditorDocumentState } from "@/hooks/useKonvaLayers";
import { clampImageCrop } from "@/lib/konva/imageCrop";
import { resolveCanvasDimensions } from "@/lib/konva/outputPresets";
import type {
  AdvancedEditorSettings,
  EditorLayer,
  ImageEditorLayer,
  ImageLayerStyle,
  ImageSourceCrop,
  ImageFilters,
  StageBackground,
} from "@/types/konvaEditor";
import { DEFAULT_IMAGE_FILTERS, DEFAULT_IMAGE_LAYER_STYLE } from "@/types/konvaEditor";

export const EDITOR_PROJECT_VERSION = 1;
export const PROJECT_INDEX_STORAGE_KEY = "image-optimizer:editor-project-index";
export const PROJECT_STORAGE_KEY_PREFIX = "image-optimizer:editor-project:";
export const MAX_SAVED_PROJECTS = 24;

export interface SerializableImageAsset {
  name: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  dataUrl: string;
}

export type SerializableEditorLayer =
  | (Omit<ImageEditorLayer, "image"> & { image: SerializableImageAsset })
  | Exclude<EditorLayer, ImageEditorLayer>;

export interface EditorProjectSnapshot {
  version: number;
  id?: string;
  name: string;
  savedAt: number;
  settings: AdvancedEditorSettings;
  document: {
    layers: SerializableEditorLayer[];
    background: StageBackground;
    selectedLayerId: string | null;
  };
}

export interface SavedProjectIndexEntry {
  id: string;
  name: string;
  updatedAt: number;
  canvasWidth: number;
  canvasHeight: number;
  layerCount: number;
}

interface ProjectIndexFile {
  projects: SavedProjectIndexEntry[];
}

function isImageLayer(layer: EditorLayer): layer is ImageEditorLayer {
  return layer.type === "image";
}

function normalizeImageStyle(style: ImageLayerStyle | undefined): ImageLayerStyle {
  return {
    ...DEFAULT_IMAGE_LAYER_STYLE,
    ...style,
  };
}

function normalizeImageFilters(filters: ImageFilters | undefined): ImageFilters {
  return {
    ...DEFAULT_IMAGE_FILTERS,
    ...filters,
  };
}

function normalizeImageCrop(
  crop: ImageSourceCrop | undefined,
  width: number,
  height: number,
): ImageSourceCrop | undefined {
  if (!crop) {
    return undefined;
  }

  return clampImageCrop(crop, width, height);
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to encode image data."));
    };
    reader.onerror = () => {
      reject(new Error("Unable to read image data."));
    };
    reader.readAsDataURL(blob);
  });
}

async function previewUrlToDataUrl(previewUrl: string): Promise<string> {
  const response = await fetch(previewUrl);
  if (!response.ok) {
    throw new Error("Unable to read image preview data.");
  }

  const blob = await response.blob();
  return blobToDataUrl(blob);
}

async function serializeLayer(layer: EditorLayer): Promise<SerializableEditorLayer> {
  if (!isImageLayer(layer)) {
    return layer;
  }

  const dataUrl = await previewUrlToDataUrl(layer.image.previewUrl);

  return {
    ...layer,
    filters: normalizeImageFilters(layer.filters),
    style: normalizeImageStyle(layer.style),
    crop: normalizeImageCrop(
      layer.crop,
      layer.image.width,
      layer.image.height,
    ),
    image: {
      name: layer.image.name,
      mimeType: layer.image.mimeType,
      size: layer.image.size,
      width: layer.image.width,
      height: layer.image.height,
      dataUrl,
    },
  };
}

export async function createProjectSnapshot(
  name: string,
  settings: AdvancedEditorSettings,
  document: EditorDocumentState,
  projectId?: string,
): Promise<EditorProjectSnapshot> {
  const layers = await Promise.all(document.layers.map(serializeLayer));

  return {
    version: EDITOR_PROJECT_VERSION,
    id: projectId,
    name,
    savedAt: Date.now(),
    settings: structuredClone(settings),
    document: {
      layers,
      background: structuredClone(document.background),
      selectedLayerId: document.selectedLayerId,
    },
  };
}

async function dataUrlToUploadedImage(
  asset: SerializableImageAsset,
): Promise<ImageEditorLayer["image"]> {
  const response = await fetch(asset.dataUrl);
  if (!response.ok) {
    throw new Error(`Unable to restore image "${asset.name}".`);
  }

  const blob = await response.blob();
  const file = new File([blob], asset.name, {
    type: asset.mimeType || blob.type || "image/png",
  });
  const previewUrl = URL.createObjectURL(blob);

  return {
    file,
    previewUrl,
    name: asset.name,
    size: asset.size || blob.size,
    mimeType: asset.mimeType || blob.type || "image/png",
    width: asset.width,
    height: asset.height,
  };
}

async function deserializeLayer(layer: SerializableEditorLayer): Promise<EditorLayer> {
  if (layer.type !== "image") {
    return layer;
  }

  const image = await dataUrlToUploadedImage(layer.image);

  return {
    ...layer,
    image,
    filters: normalizeImageFilters(layer.filters),
    style: normalizeImageStyle(layer.style),
    crop: normalizeImageCrop(layer.crop, image.width, image.height),
  };
}

export async function restoreProjectSnapshot(snapshot: EditorProjectSnapshot): Promise<{
  settings: AdvancedEditorSettings;
  document: EditorDocumentState;
}> {
  if (snapshot.version !== EDITOR_PROJECT_VERSION) {
    throw new Error("This project file uses an unsupported version.");
  }

  const layers = await Promise.all(snapshot.document.layers.map(deserializeLayer));
  const selectedLayerId =
    snapshot.document.selectedLayerId &&
    layers.some((layer) => layer.id === snapshot.document.selectedLayerId)
      ? snapshot.document.selectedLayerId
      : null;

  return {
    settings: structuredClone(snapshot.settings),
    document: {
      layers,
      background: structuredClone(snapshot.document.background),
      selectedLayerId,
    },
  };
}

function readProjectIndex(): ProjectIndexFile {
  if (typeof window === "undefined") {
    return { projects: [] };
  }

  try {
    const raw = window.localStorage.getItem(PROJECT_INDEX_STORAGE_KEY);
    if (!raw) {
      return { projects: [] };
    }

    const parsed = JSON.parse(raw) as ProjectIndexFile;
    if (!Array.isArray(parsed.projects)) {
      return { projects: [] };
    }

    return parsed;
  } catch {
    return { projects: [] };
  }
}

function writeProjectIndex(index: ProjectIndexFile): void {
  window.localStorage.setItem(
    PROJECT_INDEX_STORAGE_KEY,
    JSON.stringify(index),
  );
}

function getProjectStorageKey(projectId: string): string {
  return `${PROJECT_STORAGE_KEY_PREFIX}${projectId}`;
}

function createProjectId(): string {
  return `project-${crypto.randomUUID()}`;
}

function buildIndexEntry(snapshot: EditorProjectSnapshot): SavedProjectIndexEntry {
  const { width, height } = resolveCanvasDimensions(
    snapshot.settings.canvasPreset,
    snapshot.settings.customCanvasWidth,
    snapshot.settings.customCanvasHeight,
  );

  return {
    id: snapshot.id ?? createProjectId(),
    name: snapshot.name,
    updatedAt: snapshot.savedAt,
    canvasWidth: width,
    canvasHeight: height,
    layerCount: snapshot.document.layers.length,
  };
}

export function listSavedProjects(): SavedProjectIndexEntry[] {
  return readProjectIndex().projects.sort((a, b) => b.updatedAt - a.updatedAt);
}

export function loadSavedProjectSnapshot(projectId: string): EditorProjectSnapshot | null {
  try {
    const raw = window.localStorage.getItem(getProjectStorageKey(projectId));
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as EditorProjectSnapshot;
  } catch {
    return null;
  }
}

export function saveProjectSnapshot(snapshot: EditorProjectSnapshot): SavedProjectIndexEntry {
  const projectId = snapshot.id ?? createProjectId();
  const normalizedSnapshot: EditorProjectSnapshot = {
    ...snapshot,
    id: projectId,
    savedAt: Date.now(),
  };

  const entry = buildIndexEntry(normalizedSnapshot);
  const index = readProjectIndex();
  const nextProjects = [
    entry,
    ...index.projects.filter((project) => project.id !== projectId),
  ].slice(0, MAX_SAVED_PROJECTS);

  const removedProjects = index.projects.filter(
    (project) =>
      !nextProjects.some((nextProject) => nextProject.id === project.id),
  );

  try {
    window.localStorage.setItem(
      getProjectStorageKey(projectId),
      JSON.stringify(normalizedSnapshot),
    );
    writeProjectIndex({ projects: nextProjects });

    for (const removed of removedProjects) {
      window.localStorage.removeItem(getProjectStorageKey(removed.id));
    }
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Unable to save this design. Browser storage may be full.",
    );
  }

  return entry;
}

export function renameSavedProject(projectId: string, name: string): SavedProjectIndexEntry | null {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return null;
  }

  const snapshot = loadSavedProjectSnapshot(projectId);
  if (!snapshot) {
    return null;
  }

  const updatedSnapshot: EditorProjectSnapshot = {
    ...snapshot,
    name: trimmedName,
    savedAt: Date.now(),
  };

  return saveProjectSnapshot(updatedSnapshot);
}

export function deleteSavedProject(projectId: string): void {
  window.localStorage.removeItem(getProjectStorageKey(projectId));
  const index = readProjectIndex();
  writeProjectIndex({
    projects: index.projects.filter((project) => project.id !== projectId),
  });
}

export function sanitizeProjectFilename(name: string): string {
  const trimmed = name.trim() || "design";
  return trimmed.replace(/[^\w\-]+/g, "-").replace(/-+/g, "-").toLowerCase();
}

export function downloadProjectJson(snapshot: EditorProjectSnapshot): void {
  const filename = `${sanitizeProjectFilename(snapshot.name)}.json`;
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function parseProjectJsonFile(file: File): Promise<EditorProjectSnapshot> {
  const text = await file.text();
  const parsed = JSON.parse(text) as EditorProjectSnapshot;

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid project file.");
  }

  if (parsed.version !== EDITOR_PROJECT_VERSION) {
    throw new Error("This project file uses an unsupported version.");
  }

  if (!parsed.settings || !parsed.document || !Array.isArray(parsed.document.layers)) {
    throw new Error("Project file is missing required data.");
  }

  return parsed;
}

export function formatProjectTimestamp(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}
