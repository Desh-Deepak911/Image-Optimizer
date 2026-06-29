"use client";

import { useCallback, useState } from "react";
import type { SourceTransform } from "@/types/editor";

export function useEditorTransform() {
  const [transform, setTransform] = useState<SourceTransform | null | undefined>(
    undefined,
  );

  const updateTransform = useCallback((value: SourceTransform | null) => {
    setTransform(value);
  }, []);

  const clearTransform = useCallback(() => {
    setTransform(undefined);
  }, []);

  const resetTransform = useCallback(() => {
    setTransform(undefined);
  }, []);

  return {
    transform,
    updateTransform,
    clearTransform,
    resetTransform,
  };
}
