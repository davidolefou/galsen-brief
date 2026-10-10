import { staticFile } from "remotion";

export const COLORS = {
  bg: "#0B0D10",
  bgSoft: "#14171C",
  white: "#F5F3EE",
  grey: "#9AA0A8",
  brand: "#FFC727", // jaune Galsen
  green: "#00A651",
  red: "#E31B23",
};

export const RUBRIQUES: Record<string, { label: string; color: string }> = {
  actu: { label: "ACTU", color: "#FF4D3D" },
  "faits-divers": { label: "FAITS DIVERS", color: "#FF8A1F" },
  justice: { label: "JUSTICE", color: "#A78BFA" },
  societe: { label: "SOCIÉTÉ", color: "#22C3B6" },
  sport: { label: "SPORT", color: "#2ECC71" },
  showbiz: { label: "SHOWBIZ", color: "#FF3FA4" },
  politique: { label: "POLITIQUE", color: "#4DA3FF" },
  buzz: { label: "ÇA A BUZZÉ", color: "#FFD23F" },
};

export const EDITIONS: Record<string, string> = {
  matin: "LE MATIN",
  midi: "LE MIDI",
  soir: "LE SOIR",
};

export const FONT_TITLE = "Anton";
export const FONT_TEXT = "Inter";

const face = (family: string, file: string, weight: number) => `
@font-face {
  font-family: '${family}';
  src: url('${staticFile(`fonts/${file}`)}') format('woff2');
  font-weight: ${weight};
  font-display: block;
}`;

export const fontCss = [
  face(FONT_TITLE, "anton-latin-400-normal.woff2", 400),
  face(FONT_TITLE, "anton-latin-ext-400-normal.woff2", 400),
  face(FONT_TEXT, "inter-latin-400-normal.woff2", 400),
  face(FONT_TEXT, "inter-latin-600-normal.woff2", 600),
  face(FONT_TEXT, "inter-latin-800-normal.woff2", 800),
  face(FONT_TEXT, "inter-latin-ext-400-normal.woff2", 400),
  face(FONT_TEXT, "inter-latin-ext-600-normal.woff2", 600),
  face(FONT_TEXT, "inter-latin-ext-800-normal.woff2", 800),
].join("\n");
