export const AIValue = [
  { label: "Construction", value: 0, color: "#8B6F63" },
  { label: "HardHat", value: 1, color: "#FFD600" },
  { label: "Mask", value: 2, color: "#A855F7" },
  { label: "NO-Hardhat", value: 3, color: "#FF2D55" },
  { label: "NO-Mask", value: 4, color: "#D100D8" },
  { label: "NO-Safety Vest", value: 5, color: "#FF8A00" },
  { label: "Person", value: 6, color: "#22C55E" },
  { label: "Safety Cone", value: 7, color: "#FF8A00" },
  { label: "Safety Vest", value: 8, color: "#1683FF" },
  { label: "Machinery", value: 9, color: "#14B8C8" },
  { label: "Vehicle", value: 10, color: "#1683FF" },
  { label: "NO-Hardhat(LLM)", value: 20, color: "#FF2D55" },
  { label: "NO-Safety Vest(LLM)", value: 21, color: "#FF8A00" },
  { label: "NO-Safety Rope(LLM)", value: 22, color: "#FF2D55" },
];

export const AI_ID_TO_LABEL: Record<number, string> = AIValue.reduce(
  (acc, item) => {
    acc[item.value] = item.label;
    return acc;
  },
  {} as Record<number, string>
);

export const AI_LABEL_TO_ID: Record<string, number> = AIValue.reduce(
  (acc, item) => {
    acc[item.label] = item.value;
    return acc;
  },
  {} as Record<string, number>
);