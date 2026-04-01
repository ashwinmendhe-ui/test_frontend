import type { ReactNode } from "react";

interface KPISectionProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export default function KPISection({
  title,
  children,
  className = "",
}: KPISectionProps) {
  return (
    <section className={`rounded-2xl bg-[#f3f4f6] p-5 ${className}`}>
      <h2 className="mb-4 text-lg font-semibold text-[#2F3847]">{title}</h2>
      {children}
    </section>
  );
}