"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { validateImageFile } from "@/lib/imageValidation";
import type { UploadedImage } from "@/types/optimizer";

interface UseImageUploadOptions {
  onLoadStart?: () => void;
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const { onLoadStart } = options;
  const [image, setImage] = useState<UploadedImage | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const revokePreviewUrl = useCallback((url: string | null) => {
    if (url) {
      URL.revokeObjectURL(url);
    }
  }, []);

  useEffect(() => {
    return () => {
      revokePreviewUrl(previewUrlRef.current);
      previewUrlRef.current = null;
    };
  }, [revokePreviewUrl]);

  const loadImageFromFile = useCallback(
    (file: File) => {
      onLoadStart?.();
      setUploadError(null);

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

        setImage({
          file,
          previewUrl,
          name: file.name,
          size: file.size,
          mimeType: file.type,
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };

      img.onerror = () => {
        revokePreviewUrl(previewUrl);
        setUploadError(
          "This image could not be loaded. The file may be corrupted or unsupported.",
        );
      };

      img.src = previewUrl;
    },
    [onLoadStart, revokePreviewUrl],
  );

  const clearImage = useCallback(() => {
    revokePreviewUrl(previewUrlRef.current);
    previewUrlRef.current = null;
    setUploadError(null);
    setImage(null);
  }, [revokePreviewUrl]);

  const clearUploadError = useCallback(() => {
    setUploadError(null);
  }, []);

  return {
    image,
    hasImage: image !== null,
    uploadError,
    loadImageFromFile,
    clearImage,
    clearUploadError,
  };
}
