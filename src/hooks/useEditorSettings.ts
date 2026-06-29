"use client";

import { useCallback, useState } from "react";
import {
  DEFAULT_SETTINGS,
  type OptimizerSettings,
} from "@/types/optimizer";

interface UseEditorSettingsOptions {
  onSettingsChange?: () => void;
}

export function useEditorSettings(options: UseEditorSettingsOptions = {}) {
  const { onSettingsChange } = options;
  const [settings, setSettings] = useState<OptimizerSettings>(DEFAULT_SETTINGS);

  const updateSettings = useCallback(
    <K extends keyof OptimizerSettings>(key: K, value: OptimizerSettings[K]) => {
      onSettingsChange?.();
      setSettings((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [onSettingsChange],
  );

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  return {
    settings,
    updateSettings,
    resetSettings,
  };
}
