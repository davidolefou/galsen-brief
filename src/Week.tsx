import React, { useEffect, useState } from "react";
import { AbsoluteFill, Img, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { TricolorBar } from "./components";
import { COLORS, FONT_TEXT, FONT_TITLE, RUBRIQUES, fontCss } from "./theme";

/** Carrousel « La semaine en bref » : 1 image (frame) = 1 slide, 1080×1350. */
export type WeekItem = {
  rubrique: string;
  titre: string;
  chiffre: string;
  chiffreLabel: string;
  texte: string;
  source: string;
  image: string;
  credit: string;
};
export type WeekProps = {
  id: string;
  periode: string;
  cover: { image: string; credit: string };
  items: WeekItem[];
};

const fr = (t: string) => t.replace(/« /g, "«\u00a0").replace(/ ([»:;!?])/g, "\u00a0$1");

export const weekSlideCount = (p: WeekProps) => p.items.length + 2;

const useFonts = () => {
  const [handle] = useState(() => delayRender("fonts"));
  useEffect(() => {
    Promise.all([
      document.fonts.load(`400 100px ${FONT_TITLE}`),
      document.fonts.load(`800 40px ${FONT_TEXT}`),
      document.fonts.load(`600 40px ${FONT_TEXT}`),
    ]).then(() => continueRender(handle));
  }, [handle]);
};

const PAD = 72;

const Logo: React.FC<{ size?: number }> = ({ size = 46 }) => (
  <div style={{ fontFamily: FONT_TITLE, fontSize: size, lineHeight: 1, color: COLORS.white, letterSpacing: 0.5 }}>
    GALSEN <span style={{ color: COLORS.brand }}>BRIEF</span>
  </div>
);

const Pager: React.FC<{ i: number; n: number }> = ({ i, n }) => (
  <div style={{ display: "flex", gap: 8 }}>
    {Array.from({ length: n }).map((_, k) => (
      <div
        key={k}
        style={{
          width: k === i ? 34 : 10,
          height: 10,
          borderRadius: 5,
          background: k === i ? COLORS.brand : "rgba(245,243,238,0.35)",
        }}
      />
    ))}
  </div>
);

const Photo: React.FC<{ src: string; height: number | string; fade?: string }> = ({ src, height, fade = COLORS.bg }) => (
  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height, overflow: "hidden" }}>
    <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(1.05) contrast(1.05)" }} />
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(180deg, rgba(11,13,16,0.85) 0%, rgba(11,13,16,0.35) 14%, rgba(11,13,16,0) 28%, rgba(11,13,16,0) 55%, ${fade} 100%)`,
      }}
    />
  </div>
);

const Credit: React.FC<{ text: string; style?: React.CSSProperties }> = ({ text, style }) => (
  <div
    style={{
      fontFamily: FONT_TEXT,
      fontWeight: 600,
      fontSize: 20,
      letterSpacing: 1.5,
      color: "rgba(245,243,238,0.75)",
      ...style,
    }}
  >
    PHOTO : {text.toUpperCase()}
  </div>
);

const Cover: React.FC<{ p: WeekProps; n: number }> = ({ p, n }) => (
  <AbsoluteFill style={{ background: COLORS.bg }}>
    <Photo src={p.cover.image} height="100%" />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(11,13,16,0.2) 20%, rgba(11,13,16,0.92) 70%)" }} />
    <div style={{ position: "absolute", top: PAD, left: PAD }}>
      <Logo />
    </div>
    <Credit text={p.cover.credit} style={{ position: "absolute", top: PAD + 14, right: PAD }} />
    <div style={{ position: "absolute", left: PAD, right: PAD, bottom: 150 }}>
      <div
        style={{
          display: "inline-block",
          background: COLORS.brand,
          color: COLORS.bg,
          fontFamily: FONT_TEXT,
          fontWeight: 800,
          fontSize: 30,
          letterSpacing: 4,
          padding: "10px 22px",
          borderRadius: 8,
        }}
      >
        {p.periode.toUpperCase()}
      </div>
      <div style={{ fontFamily: FONT_TITLE, fontSize: 168, lineHeight: 0.95, color: COLORS.white, marginTop: 26 }}>
        LA SEMAINE
        <br />
        <span style={{ color: COLORS.brand }}>EN BREF</span>
      </div>
      <div style={{ marginTop: 26, width: 560 }}>
        <TricolorBar width={560} height={18} draw={1} pop={1} />
      </div>
      <div style={{ fontFamily: FONT_TEXT, fontWeight: 600, fontSize: 38, color: COLORS.white, marginTop: 30, lineHeight: 1.3 }}>
        Les {p.items.length} infos qui ont marqué le Sénégal cette semaine.
      </div>
    </div>
    <div
      style={{
        position: "absolute",
        left: PAD,
        right: PAD,
        bottom: 64,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Pager i={0} n={n} />
      <div style={{ fontFamily: FONT_TEXT, fontWeight: 800, fontSize: 28, letterSpacing: 3, color: COLORS.brand }}>
        GLISSE →
      </div>
    </div>
  </AbsoluteFill>
);

const ItemSlide: React.FC<{ it: WeekItem; i: number; n: number }> = ({ it, i, n }) => {
  const r = RUBRIQUES[it.rubrique] ?? { label: it.rubrique.toUpperCase(), color: COLORS.brand };
  const titleSize = it.titre.length > 52 ? 70 : it.titre.length > 38 ? 78 : 88;
  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      <Photo src={it.image} height={640} />
      <div style={{ position: "absolute", top: PAD - 16, left: PAD, right: PAD, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Logo size={40} />
        <div style={{ fontFamily: FONT_TITLE, fontSize: 40, color: COLORS.white }}>
          {String(i).padStart(2, "0")}
          <span style={{ color: "rgba(245,243,238,0.45)" }}>/{String(n - 2).padStart(2, "0")}</span>
        </div>
      </div>
      <Credit text={it.credit} style={{ position: "absolute", top: 600, right: PAD }} />
      {/* chiffre clé, à cheval sur la photo */}
      <div style={{ position: "absolute", top: 470, left: PAD, display: "flex", alignItems: "flex-end", gap: 20 }}>
        <div style={{ fontFamily: FONT_TITLE, fontSize: 150, lineHeight: 0.9, color: r.color, textShadow: "0 6px 30px rgba(0,0,0,0.5)" }}>
          {it.chiffre}
        </div>
        <div style={{ fontFamily: FONT_TEXT, fontWeight: 700, fontSize: 28, lineHeight: 1.2, color: COLORS.white, maxWidth: 330, paddingBottom: 10 }}>
          {it.chiffreLabel}
        </div>
      </div>
      <div style={{ position: "absolute", top: 676, left: PAD, right: PAD }}>
        <div
          style={{
            display: "inline-block",
            background: r.color,
            color: COLORS.bg,
            fontFamily: FONT_TEXT,
            fontWeight: 800,
            fontSize: 26,
            letterSpacing: 3,
            padding: "8px 18px",
            borderRadius: 8,
          }}
        >
          {r.label}
        </div>
        <div style={{ fontFamily: FONT_TITLE, fontSize: titleSize, lineHeight: 1.08, color: COLORS.white, marginTop: 20 }}>
          {fr(it.titre.toUpperCase())}
        </div>
        <div style={{ fontFamily: FONT_TEXT, fontWeight: 400, fontSize: 34, lineHeight: 1.42, color: "rgba(245,243,238,0.88)", marginTop: 22 }}>
          {fr(it.texte)}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: PAD,
          right: PAD,
          bottom: 56,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontFamily: FONT_TEXT, fontWeight: 600, fontSize: 22, letterSpacing: 1.5, color: COLORS.grey }}>
          SOURCE : {it.source.toUpperCase()}
        </div>
        <Pager i={i} n={n} />
      </div>
    </AbsoluteFill>
  );
};

const Final: React.FC<{ n: number }> = ({ n }) => (
  <AbsoluteFill style={{ background: COLORS.bg, justifyContent: "center", alignItems: "center" }}>
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 38%, ${COLORS.brand}33 0%, transparent 55%)` }} />
    <div style={{ width: 640, marginTop: -120 }}>
      <div style={{ fontFamily: FONT_TITLE, fontSize: 233.7, lineHeight: 0.9, color: COLORS.white }}>GALSEN</div>
      <div style={{ fontFamily: FONT_TITLE, fontSize: 321.3, lineHeight: 0.86, color: COLORS.brand, marginTop: 4 }}>BRIEF</div>
      <div style={{ marginTop: 30 }}>
        <TricolorBar width={640} height={24} draw={1} pop={1} />
      </div>
    </div>
    <div style={{ fontFamily: FONT_TEXT, fontWeight: 800, fontSize: 44, color: COLORS.white, marginTop: 70, letterSpacing: 2 }}>
      ABONNE-TOI <span style={{ color: COLORS.brand }}>@GALSENBRIEF</span>
    </div>
    <div style={{ fontFamily: FONT_TEXT, fontWeight: 600, fontSize: 32, color: COLORS.grey, marginTop: 22, textAlign: "center", lineHeight: 1.4 }}>
      L'actu du Sénégal en vidéo, 3 fois par jour
      <br />
      <span style={{ color: COLORS.white }}>Matin · Midi · Soir</span>
    </div>
    <div style={{ position: "absolute", bottom: 56 }}>
      <Pager i={n - 1} n={n} />
    </div>
  </AbsoluteFill>
);

export const Week: React.FC<WeekProps> = (p) => {
  useFonts();
  const frame = useCurrentFrame();
  const n = weekSlideCount(p);
  return (
    <AbsoluteFill>
      <style>{fontCss}</style>
      {frame === 0 ? <Cover p={p} n={n} /> : frame === n - 1 ? <Final n={n} /> : <ItemSlide it={p.items[frame - 1]} i={frame} n={n} />}
    </AbsoluteFill>
  );
};
