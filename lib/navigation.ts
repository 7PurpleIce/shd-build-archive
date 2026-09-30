export const ARCHIVE_SECTIONS = [
  { id: "sets", en: "Brands & sets", ru: "Бренды и сеты" },
  { id: "talents", en: "Talents", ru: "Таланты" },
  { id: "builds", en: "Builds", ru: "Билды" },
  { id: "augments", en: "Augments", ru: "Аугменты" },
  { id: "expertise", en: "Expertise calculator", ru: "Калькулятор мастерства" },
  { id: "traders", en: "Traders", ru: "Торговцы" },
  { id: "activities", en: "Incursions & raids", ru: "Вылазки и рейды" },
] as const;
export type ArchiveSection = (typeof ARCHIVE_SECTIONS)[number]["id"];
export function sectionNumber(id: ArchiveSection) {
  return String(
    ARCHIVE_SECTIONS.findIndex((section) => section.id === id) + 1,
  ).padStart(2, "0");
}
