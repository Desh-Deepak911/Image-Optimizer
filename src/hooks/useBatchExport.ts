"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  downloadBatchZip,
  renderBatchImage,
  yieldToMain,
} from "@/lib/batchExport";
import { loadUploadedImageFromFile } from "@/lib/loadUploadedImage";
import {
  createBatchItemId,
  DEFAULT_BATCH_SETTINGS,
  MAX_BATCH_COUNT,
  type BatchItem,
  type BatchSettings,
} from "@/types/batch";

export function useBatchExport() {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [settings, setSettings] = useState<BatchSettings>({
    ...DEFAULT_BATCH_SETTINGS,
  });
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const previewUrlsRef = useRef<Set<string>>(new Set());
  const processingRef = useRef(false);

  const trackPreviewUrl = useCallback((url: string) => {
    previewUrlsRef.current.add(url);
  }, []);

  const releasePreviewUrl = useCallback((url: string) => {
    URL.revokeObjectURL(url);
    previewUrlsRef.current.delete(url);
  }, []);

  useEffect(() => {
    const urls = previewUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  const selectedItem =
    items.find((item) => item.id === selectedItemId) ?? items[0] ?? null;

  const updateSettings = useCallback(
    <K extends keyof BatchSettings>(key: K, value: BatchSettings[K]) => {
      setSettings((previous) => ({ ...previous, [key]: value }));
      setItems((previous) =>
        previous.map((item) =>
          item.status === "done"
            ? {
                ...item,
                status: "pending",
                resultBlob: undefined,
                resultFilename: undefined,
              }
            : item,
        ),
      );
    },
    [],
  );

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      setUploadError(null);
      const fileArray = Array.from(files);

      if (fileArray.length === 0) {
        return;
      }

      const availableSlots = MAX_BATCH_COUNT - items.length;
      if (availableSlots <= 0) {
        setUploadError(
          `Batch limit reached. You can process up to ${MAX_BATCH_COUNT} images at once.`,
        );
        return;
      }

      const filesToAdd = fileArray.slice(0, availableSlots);
      if (fileArray.length > availableSlots) {
        setUploadError(
          `Only ${availableSlots} more image${availableSlots === 1 ? "" : "s"} can be added (max ${MAX_BATCH_COUNT}). Extra files were skipped.`,
        );
      }

      const loaded: BatchItem[] = [];
      const errors: string[] = [];

      for (const file of filesToAdd) {
        try {
          const image = await loadUploadedImageFromFile(file);
          trackPreviewUrl(image.previewUrl);
          loaded.push({
            id: createBatchItemId(),
            image,
            status: "pending",
          });
        } catch (error) {
          errors.push(
            `${file.name}: ${
              error instanceof Error ? error.message : "Unable to load file."
            }`,
          );
        }
      }

      if (loaded.length > 0) {
        setItems((previous) => [...previous, ...loaded]);
        setSelectedItemId((current) => current ?? loaded[0]?.id ?? null);
      }

      if (errors.length > 0 && loaded.length === 0) {
        setUploadError(errors.join(" "));
      } else if (errors.length > 0) {
        setUploadError(
          `${errors.length} file${errors.length === 1 ? "" : "s"} could not be added. ${errors[0]}`,
        );
      }
    },
    [items.length, trackPreviewUrl],
  );

  const removeItem = useCallback(
    (itemId: string) => {
      setItems((previous) => {
        const target = previous.find((item) => item.id === itemId);
        if (target) {
          releasePreviewUrl(target.image.previewUrl);
        }

        const next = previous.filter((item) => item.id !== itemId);
        setSelectedItemId((current) => {
          if (current !== itemId) {
            return current;
          }

          return next[0]?.id ?? null;
        });

        return next;
      });
    },
    [releasePreviewUrl],
  );

  const clearBatch = useCallback(() => {
    items.forEach((item) => releasePreviewUrl(item.image.previewUrl));
    setItems([]);
    setSelectedItemId(null);
    setUploadError(null);
    setExportError(null);
    setProgress({ completed: 0, total: 0 });
  }, [items, releasePreviewUrl]);

  const updateItem = useCallback(
    (itemId: string, update: Partial<BatchItem>) => {
      setItems((previous) =>
        previous.map((item) =>
          item.id === itemId ? { ...item, ...update } : item,
        ),
      );
    },
    [],
  );

  const processAll = useCallback(async () => {
    if (processingRef.current || items.length === 0) {
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);
    setExportError(null);

    const pendingItems = items.filter(
      (item) => item.status === "pending" || item.status === "failed",
    );
    const total = pendingItems.length;
    setProgress({ completed: 0, total });

    if (total === 0) {
      processingRef.current = false;
      setIsProcessing(false);
      return;
    }

    let completed = 0;

    for (const item of pendingItems) {
      updateItem(item.id, { status: "processing", error: undefined });
      await yieldToMain();

      try {
        const result = await renderBatchImage(item.image, settings);
        updateItem(item.id, {
          status: "done",
          resultBlob: result.blob,
          resultFilename: result.filename,
          error: undefined,
        });
      } catch (error) {
        updateItem(item.id, {
          status: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Unable to process this image.",
        });
      }

      completed += 1;
      setProgress({ completed, total });
      await yieldToMain();
    }

    processingRef.current = false;
    setIsProcessing(false);
  }, [items, settings, updateItem]);

  const retryItem = useCallback(
    async (itemId: string) => {
      const item = items.find((entry) => entry.id === itemId);
      if (!item || processingRef.current) {
        return;
      }

      processingRef.current = true;
      setIsProcessing(true);
      setExportError(null);
      updateItem(itemId, { status: "processing", error: undefined });
      await yieldToMain();

      try {
        const result = await renderBatchImage(item.image, settings);
        updateItem(itemId, {
          status: "done",
          resultBlob: result.blob,
          resultFilename: result.filename,
          error: undefined,
        });
      } catch (error) {
        updateItem(itemId, {
          status: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Unable to process this image.",
        });
      } finally {
        processingRef.current = false;
        setIsProcessing(false);
      }
    },
    [items, settings, updateItem],
  );

  const downloadZip = useCallback(async () => {
    const readyFiles = items
      .filter((item) => item.status === "done" && item.resultBlob && item.resultFilename)
      .map((item) => ({
        filename: item.resultFilename!,
        blob: item.resultBlob!,
      }));

    if (readyFiles.length === 0 || isDownloadingZip) {
      return;
    }

    setExportError(null);
    setIsDownloadingZip(true);

    try {
      await downloadBatchZip(readyFiles);
    } catch (error) {
      setExportError(
        error instanceof Error
          ? error.message
          : "Unable to create the ZIP download.",
      );
    } finally {
      setIsDownloadingZip(false);
    }
  }, [isDownloadingZip, items]);

  const doneCount = items.filter((item) => item.status === "done").length;
  const hasItems = items.length > 0;
  const canDownloadZip = doneCount > 0 && !isProcessing && !isDownloadingZip;

  return {
    items,
    settings,
    selectedItem,
    selectedItemId: selectedItem?.id ?? null,
    uploadError,
    exportError,
    isProcessing,
    isDownloadingZip,
    progress,
    hasItems,
    canDownloadZip,
    doneCount,
    maxBatchCount: MAX_BATCH_COUNT,
    addFiles,
    removeItem,
    clearBatch,
    selectItem: setSelectedItemId,
    updateSettings,
    processAll,
    retryItem,
    downloadZip,
    clearUploadError: () => setUploadError(null),
    clearExportError: () => setExportError(null),
  };
}
