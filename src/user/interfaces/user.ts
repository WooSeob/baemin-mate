export const SECTION = {
  NARAE: "Narae",
  HOYOEN: "Hoyoen",
  CHANGZO: "Changzo",
  BIBONG: "Bibong",
} as const;
export type SectionType = typeof SECTION[keyof typeof SECTION];
