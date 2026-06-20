interface HeroSectionProps {
  compact?: boolean;
}

export function HeroSection({ compact = false }: HeroSectionProps) {
  if (compact) {
    return (
      <section className="mx-auto max-w-7xl px-4 pt-6 pb-2 sm:px-6 lg:px-8">
        <p className="text-sm text-[#86868b]">
          Adjust settings and download when you&apos;re ready.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 pt-10 pb-6 text-center sm:px-6 sm:pt-14 sm:pb-8">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#0071e3]">
        Free & private
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-[#1d1d1f] sm:text-5xl sm:leading-[1.1]">
        Optimize screenshots
        <br className="hidden sm:block" />
        <span className="text-[#86868b]"> in your browser</span>
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#6e6e73] sm:text-lg">
        Crop to any aspect ratio, choose export format, and download — all
        processed locally on your device.
      </p>
    </section>
  );
}
