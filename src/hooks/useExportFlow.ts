"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildExportOptions,
  exportOptimizedImage,
  type ExportResult,
} from "@/lib/imageExport";
import type { SourceTransform } from "@/types/editor";
import type {
  ExportSuccessState,
  OptimizerSettings,
  UploadedImage,
} from "@/types/optimizer";

export type { ExportSuccessState };

interface ExportDocument {
  image: UploadedImage;
  settings: OptimizerSettings;
  transform?: SourceTransform | null;
}

export function useExportFlow() {
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<ExportSuccessState | null>(
    null,
  );
  const [isExporting, setIsExporting] = useState(false);
  const successTimeoutRef = useRef<number | null>(null);

  const clearSuccessTimeout = useCallback(() => {
    if (successTimeoutRef.current !== null) {
      window.clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearSuccessTimeout();
    };
  }, [clearSuccessTimeout]);

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

  const resetExportState = useCallback(() => {
    setExportError(null);
    setExportSuccess(null);
    clearSuccessTimeout();
  }, [clearSuccessTimeout]);

  const clearExportError = useCallback(() => {
    setExportError(null);
  }, []);

  const clearExportSuccess = useCallback(() => {
    setExportSuccess(null);
    clearSuccessTimeout();
  }, [clearSuccessTimeout]);

  const handleDownload = useCallback(
    async (document: ExportDocument) => {
      if (isExporting) {
        return;
      }

      setExportError(null);
      setExportSuccess(null);
      clearSuccessTimeout();
      setIsExporting(true);

      try {
        const result = await exportOptimizedImage(
          buildExportOptions(
            document.image,
            document.settings,
            document.transform,
          ),
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
    },
    [clearSuccessTimeout, isExporting, showExportSuccess],
  );

  const reportExportSuccess = useCallback(
    (payload: ExportSuccessState) => {
      clearSuccessTimeout();
      setExportSuccess(payload);

      successTimeoutRef.current = window.setTimeout(() => {
        setExportSuccess(null);
        successTimeoutRef.current = null;
      }, 6000);
    },
    [clearSuccessTimeout],
  );

  const runExportTask = useCallback(
    async (task: () => Promise<ExportSuccessState>) => {
      if (isExporting) {
        return;
      }

      setExportError(null);
      setExportSuccess(null);
      clearSuccessTimeout();
      setIsExporting(true);

      try {
        const result = await task();
        reportExportSuccess(result);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Something went wrong while exporting the image.";
        setExportError(message);
      } finally {
        setIsExporting(false);
      }
    },
    [clearSuccessTimeout, isExporting, reportExportSuccess],
  );

  return {
    exportError,
    exportSuccess,
    isExporting,
    handleDownload,
    runExportTask,
    resetExportState,
    clearExportError,
    clearExportSuccess,
  };
}
