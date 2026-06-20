"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildExportOptions,
  exportOptimizedImage,
  type ExportResult,
} from "@/lib/imageExport";
import { validateImageFile } from "@/lib/imageValidation";
import {
  DEFAULT_SETTINGS,
  type ExportSuccessState,
  type OptimizerSettings,
  type OptimizerState,
  type UploadedImage,
} from "@/types/optimizer";

export type { ExportSuccessState };

export function useOptimizerState() {
  const [state, setState] = useState<OptimizerState>({
    image: null,
    settings: DEFAULT_SETTINGS,
  });
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<ExportSuccessState | null>(
    null,
  );
  const [isExporting, setIsExporting] = useState(false);
  const previewUrlRef = useRef<string | null>(null);
  const successTimeoutRef = useRef<number | null>(null);

  const revokePreviewUrl = useCallback((url: string | null) => {
    if (url) {
      URL.revokeObjectURL(url);
    }
  }, []);

  const clearSuccessTimeout = useCallback(() => {
    if (successTimeoutRef.current !== null) {
      window.clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      revokePreviewUrl(previewUrlRef.current);
      previewUrlRef.current = null;
      clearSuccessTimeout();
    };
  }, [clearSuccessTimeout, revokePreviewUrl]);

  const showExportSuccess = useCallback(
    (result: ExportResult) => {
      clearSuccessTimeout();
      setExportSuccess({
        filename: result.filename,
        size: result.blob.size,
        width: result.dimensions.width,
        height: result.dimensions.height,
      });

      successTimeoutRef.current = window.setTimeout(() => {
        setExportSuccess(null);
        successTimeoutRef.current = null;
      }, 6000);
    },
    [clearSuccessTimeout],
  );

  const loadImageFromFile = useCallback(
    (file: File) => {
      setUploadError(null);
      setExportError(null);
      setExportSuccess(null);
      clearSuccessTimeout();

      const validation = validateImageFile(file);
      if (!validation.valid) {
        setUploadError(validation.message ?? "Unable to upload this file.");
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      const img = new window.Image();

      img.onload = () => {
        revokePreviewUrl(previewUrlRef.current);
        previewUrlRef.current = previewUrl;

        const uploadedImage: UploadedImage = {
          file,
          previewUrl,
          name: file.name,
          size: file.size,
          mimeType: file.type,
          width: img.naturalWidth,
          height: img.naturalHeight,
        };

        setState((prev) => ({
          ...prev,
          image: uploadedImage,
        }));
      };

      img.onerror = () => {
        revokePreviewUrl(previewUrl);
        setUploadError(
          "This image could not be loaded. The file may be corrupted or unsupported.",
        );
      };

      img.src = previewUrl;
    },
    [clearSuccessTimeout, revokePreviewUrl],
  );

  const clearImage = useCallback(() => {
    revokePreviewUrl(previewUrlRef.current);
    previewUrlRef.current = null;
    setUploadError(null);
    setExportError(null);
    setExportSuccess(null);
    clearSuccessTimeout();
    setState((prev) => ({
      ...prev,
      image: null,
    }));
  }, [clearSuccessTimeout, revokePreviewUrl]);

  const resetAll = useCallback(() => {
    revokePreviewUrl(previewUrlRef.current);
    previewUrlRef.current = null;
    setUploadError(null);
    setExportError(null);
    setExportSuccess(null);
    clearSuccessTimeout();
    setState({
      image: null,
      settings: DEFAULT_SETTINGS,
    });
  }, [clearSuccessTimeout, revokePreviewUrl]);

  const clearUploadError = useCallback(() => {
    setUploadError(null);
  }, []);

  const clearExportError = useCallback(() => {
    setExportError(null);
  }, []);

  const clearExportSuccess = useCallback(() => {
    setExportSuccess(null);
    clearSuccessTimeout();
  }, [clearSuccessTimeout]);

  const updateSettings = useCallback(
    <K extends keyof OptimizerSettings>(key: K, value: OptimizerSettings[K]) => {
      setExportSuccess(null);
      clearSuccessTimeout();
      setState((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          [key]: value,
        },
      }));
    },
    [clearSuccessTimeout],
  );

  const handleDownload = useCallback(async () => {
    if (!state.image || isExporting) {
      return;
    }

    setExportError(null);
    setExportSuccess(null);
    clearSuccessTimeout();
    setIsExporting(true);

    try {
      const result = await exportOptimizedImage(
        buildExportOptions(state.image, state.settings),
      );
      showExportSuccess(result);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while exporting the image.";
      setExportError(message);
    } finally {
      setIsExporting(false);
    }
  }, [
    clearSuccessTimeout,
    isExporting,
    showExportSuccess,
    state.image,
    state.settings,
  ]);

  return {
    state,
    hasImage: state.image !== null,
    uploadError,
    exportError,
    exportSuccess,
    isExporting,
    loadImageFromFile,
    clearImage,
    resetAll,
    clearUploadError,
    clearExportError,
    clearExportSuccess,
    updateSettings,
    handleDownload,
  };
}
