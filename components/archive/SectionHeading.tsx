import type { ReactNode } from "react";
import { sectionNumber, type ArchiveSection } from "@/lib/navigation";
export function SectionHeading({
  section,
  eyebrow,
  title,
  children,
}: {
  section: ArchiveSection;
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">
          {eyebrow} / {sectionNumber(section)}
        </p>
        <h1>{title}</h1>
      </div>
      {children}
    </div>
  );
}
