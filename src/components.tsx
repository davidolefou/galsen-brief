import React from "react";
import {
  AbsoluteFill,
  Img,
  staticFile,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";
import { COLORS, FONT_TEXT, FONT_TITLE } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/**
 * Texte animé lettre par lettre : chaque lettre monte et apparaît avec un
 * léger décalage, puis toutes sortent en fin de séquence (écran vide au début
 * et à la fin).
 */
export const LetterReveal: React.FC<{
  text: string;
  delay?: number;
  stagger?: number;
  exitAt?: number; // frame (locale) où commence la sortie
  style?: React.CSSProperties;
  accent?: string;
}> = ({ text, delay = 0, stagger = 1.2, exitAt, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");
  let index = 0;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", columnGap: "0.25em", ...style }}>
      {words.map((word, wi) => (
        <span key={wi} style={{ display: "inline-flex", whiteSpace: "nowrap" }}>
          {word.split("").map((ch, ci) => {
            const i = index++;
            const s = spring({
              frame: frame - delay - i * stagger,
              fps,
              config: { damping: 14, stiffness: 160, mass: 0.6 },
            });
            const out =
              exitAt === undefined
                ? 0
                : interpolate(frame, [exitAt + i * 0.4, exitAt + i * 0.4 + 8], [0, 1], clamp);
            return (
              <span
                key={ci}
                style={{
                  display: "inline-block",
                  opacity: s * (1 - out),
                  transform: `translateY(${(1 - s) * 60 - out * 40}px) rotate(${(1 - s) * 6}deg)`,
                }}
              >
                {ch}
              </span>
            );
          })}
        </span>
      ))}
    </div>
  );
};

export const BrandBar: React.FC<{ edition: string; date: string; exitAt?: number }> = ({
  edition,
  date,
  exitAt,
}) => {
  const frame = useCurrentFrame();
  const out = exitAt === undefined ? 0 : interpolate(frame, [exitAt, exitAt + 10], [0, 1], clamp);
  const inn = interpolate(frame, [0, 10], [0, 1], clamp);
  return (
    <div
      style={{
        position: "absolute",
        top: 70,
        left: 70,
        right: 70,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        opacity: inn * (1 - out),
      }}
    >
      <div style={{ fontFamily: FONT_TITLE, fontSize: 64, letterSpacing: 1, color: COLORS.white }}>
        GALSEN <span style={{ color: COLORS.brand }}>BRIEF</span>
      </div>
      <div style={{ textAlign: "right", fontFamily: FONT_TEXT }}>
        <div style={{ fontWeight: 800, fontSize: 30, color: COLORS.white, letterSpacing: 2 }}>
          {edition}
        </div>
        <div style={{ fontWeight: 600, fontSize: 24, color: COLORS.grey }}>{date}</div>
      </div>
    </div>
  );
};

/** Barres de progression type « stories » : un trait par sujet. */
export const ProgressBars: React.FC<{
  count: number;
  current: number;
  progress: number;
  color: string;
}> = ({ count, current, progress, color }) => (
  <div style={{ position: "absolute", top: 180, left: 70, right: 70, display: "flex", gap: 12 }}>
    {Array.from({ length: count }).map((_, i) => {
      const fill = i < current ? 1 : i === current ? progress : 0;
      return (
        <div
          key={i}
          style={{ flex: 1, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.18)", overflow: "hidden" }}
        >
          <div style={{ width: `${fill * 100}%`, height: "100%", background: color }} />
        </div>
      );
    })}
  </div>
);

/** Fond animé : photo d'illustration (assombrie, floutée, lent zoom) si fournie,
 *  dégradé de la couleur de rubrique + bandes diagonales lentes. */
export const Background: React.FC<{ color: string; image?: string }> = ({ color, image }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const drift = frame * 0.6;
  const zoom = interpolate(frame, [0, durationInFrames], [1.08, 1.2], clamp);
  return (
    <AbsoluteFill style={{ background: COLORS.bg, overflow: "hidden" }}>
      {image ? (
        <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
          <Img
            src={staticFile(image)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "blur(1.5px) brightness(0.5) saturate(0.95)",
            }}
          />
        </AbsoluteFill>
      ) : null}
      {image ? (
        <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 45%, transparent 60%)" }} />
      ) : null}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${30 + Math.sin(frame / 60) * 10}% ${
            25 + Math.cos(frame / 70) * 8
          }%, ${color}55 0%, transparent 55%)`,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `repeating-linear-gradient(115deg, transparent 0 60px, rgba(255,255,255,0.025) 60px 62px)`,
          backgroundPosition: `${drift}px 0`,
        }}
      />
      <AbsoluteFill
        style={{ background: "linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.65) 100%)" }}
      />
    </AbsoluteFill>
  );
};

/** Sous-titres synchronisés sur la voix, un groupe de mots à la fois. */
export const Captions: React.FC<{
  captions: { text: string; start: number; end: number }[];
  highlight: string;
}> = ({ captions, highlight }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const idx = captions.findIndex((c, i) => {
    const next = captions[i + 1];
    return t >= c.start && (next ? t < next.start : t <= c.end + 0.6);
  });
  if (idx === -1) return null;
  const cap = captions[idx];
  const local = frame - Math.round(cap.start * fps);
  const pop = spring({ frame: local, fps, config: { damping: 12, stiffness: 220, mass: 0.5 } });
  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        right: 70,
        top: 1420,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily: FONT_TEXT,
          fontWeight: 800,
          fontSize: 58,
          lineHeight: 1.18,
          color: COLORS.white,
          textAlign: "center",
          padding: "18px 30px",
          background: "rgba(0,0,0,0.55)",
          borderRadius: 18,
          borderBottom: `6px solid ${highlight}`,
          transform: `scale(${0.85 + pop * 0.15})`,
          opacity: pop,
        }}
      >
        {cap.text}
      </div>
    </div>
  );
};

export const SourceLine: React.FC<{ source: string; exitAt: number }> = ({ source, exitAt }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [20, 32], [0, 1], clamp) * interpolate(frame, [exitAt, exitAt + 8], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        bottom: 110,
        fontFamily: FONT_TEXT,
        fontWeight: 600,
        fontSize: 30,
        color: COLORS.grey,
        opacity: o,
        letterSpacing: 1,
      }}
    >
      SOURCE : {source.toUpperCase()}
    </div>
  );
};

/** Mention obligatoire quand le fond est une photo d'illustration (charte). */
export const IllustrationTag: React.FC<{ exitAt: number; credit?: string }> = ({ exitAt, credit }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [14, 24], [0, 1], clamp) * interpolate(frame, [exitAt, exitAt + 8], [1, 0], clamp);
  return (
    <div
      style={{
        position: "absolute",
        right: 70,
        bottom: 110,
        fontFamily: FONT_TEXT,
        fontWeight: 600,
        fontSize: 24,
        letterSpacing: 2,
        color: "rgba(245,243,238,0.7)",
        border: "2px solid rgba(245,243,238,0.35)",
        borderRadius: 8,
        padding: "4px 12px",
        opacity: o,
      }}
    >
      {credit ? `PHOTO : ${credit.toUpperCase()}` : "PHOTO D'ILLUSTRATION"}
    </div>
  );
};

/** Bande de transition qui balaie l'écran à la couleur de la rubrique. */
export const Wipe: React.FC<{ color: string; durationInFrames: number }> = ({ color, durationInFrames }) => {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, durationInFrames], [-120, 120], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: -200,
          bottom: -200,
          left: `${x}%`,
          width: "70%",
          background: color,
          transform: "skewX(-12deg)",
        }}
      />
    </AbsoluteFill>
  );
};

/** Étoile à 5 branches (tracé SVG), centrée en (0,0). */
const starPoints = (r: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const rad = i % 2 === 0 ? r : r * 0.382;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    return `${(rad * Math.cos(a)).toFixed(2)},${(rad * Math.sin(a)).toFixed(2)}`;
  }).join(" ");

/**
 * Barre tricolore du logo (vert / jaune / rouge) avec le médaillon étoilé au
 * centre. `draw` (0→1) dessine la barre de gauche à droite, `pop` (0→1) fait
 * surgir le médaillon, `out` (0→1) la fait disparaître vers la droite.
 */
export const TricolorBar: React.FC<{ width: number; height: number; draw: number; pop: number; out?: number; spin?: number }> = ({
  width,
  height,
  draw,
  pop,
  out = 0,
  spin = 0,
}) => {
  const r = height * 1.05;
  const pad = r + 4;
  const visibleFrom = width * out;
  const visibleTo = width * draw;
  return (
    <svg width={width} height={pad * 2} viewBox={`0 ${-pad} ${width} ${pad * 2}`} style={{ overflow: "visible" }}>
      <defs>
        <clipPath id="tri-clip">
          <rect x={visibleFrom} y={-pad} width={Math.max(0, visibleTo - visibleFrom)} height={pad * 2} />
        </clipPath>
      </defs>
      <g clipPath="url(#tri-clip)">
        <rect x={0} y={-height / 2} width={width / 3} height={height} fill={COLORS.green} />
        <rect x={width / 3} y={-height / 2} width={width / 3} height={height} fill={COLORS.brand} />
        <rect x={(2 * width) / 3} y={-height / 2} width={width / 3} height={height} fill={COLORS.red} />
      </g>
      <g transform={`translate(${width / 2}, 0) scale(${pop * (1 - out)})`}>
        <circle r={r} fill={COLORS.brand} />
        <polygon points={starPoints(height * 0.82)} fill={COLORS.green} transform={`translate(0 ${height * 0.05}) rotate(${spin})`} />
      </g>
    </svg>
  );
};
