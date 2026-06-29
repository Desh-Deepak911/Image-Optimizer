"use client";

import { useState } from "react";
import { AdvancedEditorWorkspace } from "@/components/advanced/AdvancedEditorWorkspace";
import { BatchWorkspace } from "@/components/batch/BatchWorkspace";
import { Header } from "@/components/optimizer/Header";
import { HeroSection } from "@/components/optimizer/HeroSection";
import { ModeSwitcher } from "@/components/optimizer/ModeSwitcher";
import { OptimizerWorkspace } from "@/components/optimizer/OptimizerWorkspace";
import type { AppMode } from "@/types/konvaEditor";

export function OptimizerApp() {
  const [mode, setMode] = useState<AppMode>("optimizer");

  return (
    <div className="flex min-h-full flex-col bg-[#fbfbfd]">
      <Header />

      <HeroSection compact={mode === "advanced" || mode === "batch"} />

      <ModeSwitcher mode={mode} onModeChange={setMode} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-28 sm:px-6 lg:px-8 lg:pb-16">
        {mode === "optimizer" ? (
          <OptimizerWorkspace />
        ) : mode === "advanced" ? (
          <AdvancedEditorWorkspace />
        ) : (
          <BatchWorkspace />
        )}
      </main>

      <footer className="border-t border-black/[0.04] bg-white py-6 pb-28 lg:pb-6">
        <p className="text-center text-xs text-[#86868b]">
          All processing happens in your browser. Images never leave your device.
        </p>
      </footer>
    </div>
  );
}
