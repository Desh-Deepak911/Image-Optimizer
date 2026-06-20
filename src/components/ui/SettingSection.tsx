interface SettingSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function SettingSection({
  title,
  description,
  children,
}: SettingSectionProps) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-[#1d1d1f]">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-xs text-[#86868b]">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
