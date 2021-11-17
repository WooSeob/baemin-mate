export const CATEGORY = {
  KOREAN: "korean",
  CHINESE: "chinese",
  JAPANESE: "japanese",
  WESTERN: "western",
  PORKCUTLET: "porkcutlet",
  CHICKEN: "chicken",
  PIZZA: "pizza",
  DDEOCK: "ddeock",
  FASTFOOD: "fastfood",
} as const;
export type CategoryType = typeof CATEGORY[keyof typeof CATEGORY];
