import React, { useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  Easing,
  continueRender,
  delayRender,
  spring,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  Background,
  BrandBar,
  TricolorBar,
  Captions,
  IllustrationTag,
  LetterReveal,
  ProgressBars,
  SourceLine,
  Wipe,
} from "./components";
import { COLORS, EDITIONS, FONT_TEXT, FONT_TITLE, RUBRIQUES, fontCss } from "./theme";

export type Caption = { text: string; start: number; end: number };
export type Timing = { audio: string; frames: number; captions: Caption[] };
export type Segment = {
  rubrique: string;
  titre: string;
  chiffre?: string;
  voix: string;
  source: string;
  image?: string; // photo (public/…), affichée assombrie derrière le texte
  imageCredit?: string; // média d'origine, affiché à l'écran
};
export type Sfx = { transition?: string; title?: string };
export type EditionProps = {
  id: string;
  edition: string;
  date: string;
  nextEdition: string;
  segments: Segment[];
  timings: Record<string, Timing>;
  fps: number;
  music?: string; // musique de fond (public/…), baissée automatiquement sous la voix
  sfx?: Sfx;
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

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

const Intro: React.FC<{ p: EditionProps; t: Timing }> = ({ p, t }) => {
  const frame = useCurrentFrame();
  const exitAt = t.frames - 14;
  const bar = interpolate(frame, [10, 34], [0, 1], clamp) * interpolate(frame, [exitAt, exitAt + 10], [1, 0], clamp);
  const label = interpolate(frame, [26, 38], [0, 1], clamp) * interpolate(frame, [exitAt, exitAt + 8], [1, 0], clamp);
  return (
    <AbsoluteFill>
      <Background color={COLORS.brand} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 260 }}>
        <LetterReveal
          text="GALSEN"
          stagger={2}
          exitAt={exitAt}
          style={{ fontFamily: FONT_TITLE, fontSize: 250, color: COLORS.white, lineHeight: 1 }}
        />
        <LetterReveal
          text="BRIEF"
          delay={8}
          stagger={2}
          exitAt={exitAt}
          style={{ fontFamily: FONT_TITLE, fontSize: 250, color: COLORS.brand, lineHeight: 1 }}
        />
        <div style={{ display: "flex", width: 560 * bar, height: 14, marginTop: 34, overflow: "hidden" }}>
          <div style={{ flex: 1, background: COLORS.green }} />
          <div style={{ flex: 1, background: COLORS.brand }} />
          <div style={{ flex: 1, background: COLORS.red }} />
        </div>
        <div
          style={{
            marginTop: 40,
            opacity: label,
            fontFamily: FONT_TEXT,
            fontWeight: 800,
            fontSize: 44,
            letterSpacing: 6,
            color: COLORS.white,
          }}
        >
          {EDITIONS[p.edition] ?? p.edition.toUpperCase()}
        </div>
        <div style={{ marginTop: 10, opacity: label, fontFamily: FONT_TEXT, fontWeight: 600, fontSize: 32, color: COLORS.grey }}>
          {p.date}
        </div>
      </AbsoluteFill>
      <Captions captions={t.captions} highlight={COLORS.brand} />
      <Audio src={staticFile(t.audio)} />
    </AbsoluteFill>
  );
};

const SegmentScene: React.FC<{ p: EditionProps; s: Segment; t: Timing; index: number }> = ({ p, s, t, index }) => {
  const frame = useCurrentFrame();
  const r = RUBRIQUES[s.rubrique] ?? { label: s.rubrique.toUpperCase(), color: COLORS.brand };
  const exitAt = t.frames - 14;
  const pill = interpolate(frame, [8, 18], [0, 1], clamp) * interpolate(frame, [exitAt, exitAt + 8], [1, 0], clamp);
  return (
    <AbsoluteFill>
      <Background color={r.color} image={s.image} />
      <BrandBar edition={EDITIONS[p.edition] ?? p.edition} date={p.date} />
      <ProgressBars
        count={p.segments.length}
        current={index}
        progress={interpolate(frame, [0, t.frames], [0, 1], clamp)}
        color={r.color}
      />
      <div
        style={{
          position: "absolute",
          top: 300,
          left: 70,
          opacity: pill,
          transform: `translateX(${(1 - pill) * -40}px)`,
          background: r.color,
          color: COLORS.bg,
          fontFamily: FONT_TEXT,
          fontWeight: 800,
          fontSize: 38,
          letterSpacing: 4,
          padding: "12px 26px",
          borderRadius: 10,
        }}
      >
        {r.label}
      </div>
      <div style={{ position: "absolute", top: 400, left: 70, right: 70 }}>
        <LetterReveal
          text={s.titre.toUpperCase()}
          delay={12}
          stagger={0.9}
          exitAt={exitAt}
          style={{ fontFamily: FONT_TITLE, fontSize: 112, lineHeight: 1.12, color: COLORS.white }}
        />
      </div>
      <div style={{ position: "absolute", top: 900, left: 70, right: 70 }}>
        {s.chiffre ? (
          <LetterReveal
            text={s.chiffre.toUpperCase()}
            delay={30}
            stagger={2}
            exitAt={exitAt}
            style={{
              fontFamily: FONT_TITLE,
              fontSize: Math.min(280, Math.floor(940 / (s.chiffre.length * 0.5))),
              lineHeight: 1,
              color: r.color,
              flexWrap: "nowrap",
            }}
          />
        ) : (
          <LetterReveal
            text={`N°${String(index + 1).padStart(2, "0")}`}
            delay={30}
            stagger={2}
            exitAt={exitAt}
            style={{
              fontFamily: FONT_TITLE,
              fontSize: 280,
              lineHeight: 1,
              color: "transparent",
              WebkitTextStroke: `4px ${r.color}`,
            }}
          />
        )}
      </div>
      <Captions captions={t.captions} highlight={r.color} />
      <SourceLine source={s.source} exitAt={exitAt} />
      {s.image ? <IllustrationTag exitAt={exitAt} credit={s.imageCredit} /> : null}
      <Sequence durationInFrames={16}>
        <Wipe color={r.color} durationInFrames={16} />
      </Sequence>
      {p.sfx?.transition ? <Audio src={staticFile(p.sfx.transition)} volume={0.55} /> : null}
      {p.sfx?.title ? (
        <Sequence from={30} durationInFrames={45}>
          <Audio src={staticFile(p.sfx.title)} volume={0.3} />
        </Sequence>
      ) : null}
      <Audio src={staticFile(t.audio)} />
    </AbsoluteFill>
  );
};

/** Carte de fin : le logo se construit (GALSEN, BRIEF, barre tricolore,
 *  médaillon étoilé), puis l'appel à s'abonner. Écran vide au début et à la fin. */
const LOGO_W = 780; // GALSEN et BRIEF calés sur la même largeur
const Outro: React.FC<{ p: EditionProps; t: Timing }> = ({ p, t }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exitAt = t.frames - 18;
  const draw = interpolate(frame, [22, 40], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const pop = spring({ frame: frame - 36, fps, config: { damping: 9, stiffness: 180, mass: 0.6 } });
  const spin = interpolate(frame, [36, 60], [-144, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const out = interpolate(frame, [exitAt + 2, exitAt + 12], [0, 1], { ...clamp, easing: Easing.in(Easing.cubic) });
  const cta = spring({ frame: frame - 50, fps, config: { damping: 14, stiffness: 160 } }) *
    interpolate(frame, [exitAt, exitAt + 8], [1, 0], clamp);
  return (
    <AbsoluteFill>
      <Background color={COLORS.brand} />
      <Sequence durationInFrames={16}>
        <Wipe color={COLORS.brand} durationInFrames={16} />
      </Sequence>
      {p.sfx?.transition ? <Audio src={staticFile(p.sfx.transition)} volume={0.55} /> : null}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", paddingBottom: 380 }}>
        <div style={{ width: LOGO_W }}>
          <LetterReveal
            text="GALSEN"
            delay={6}
            stagger={1.6}
            exitAt={exitAt}
            style={{ fontFamily: FONT_TITLE, fontSize: 284.8, lineHeight: 0.9, color: COLORS.white, columnGap: 0 }}
          />
          <LetterReveal
            text="BRIEF"
            delay={12}
            stagger={1.6}
            exitAt={exitAt}
            style={{ fontFamily: FONT_TITLE, fontSize: 391.5, lineHeight: 0.86, color: COLORS.brand, columnGap: 0, marginTop: 6 }}
          />
          <div style={{ marginTop: 34 }}>
            <TricolorBar width={LOGO_W} height={30} draw={draw} pop={pop} out={out} spin={spin} />
          </div>
        </div>
        <div
          style={{
            marginTop: 70,
            opacity: cta,
            transform: `translateY(${(1 - cta) * 30}px)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 22,
          }}
        >
          <div style={{ fontFamily: FONT_TEXT, fontWeight: 800, fontSize: 44, letterSpacing: 3, color: COLORS.white }}>
            ABONNE-TOI <span style={{ color: COLORS.brand }}>@GALSENBRIEF</span>
          </div>
          <div
            style={{
              background: COLORS.white,
              color: COLORS.bg,
              fontFamily: FONT_TEXT,
              fontWeight: 800,
              fontSize: 36,
              letterSpacing: 4,
              padding: "12px 28px",
              borderRadius: 10,
            }}
          >
            {p.nextEdition}
          </div>
        </div>
      </AbsoluteFill>
      <Captions captions={t.captions} highlight={COLORS.brand} />
      <Audio src={staticFile(t.audio)} />
    </AbsoluteFill>
  );
};

const MUSIC_UNDER_VOICE = 0.07; // volume de la musique pendant que la voix parle
const MUSIC_ALONE = 0.22; // volume entre les phrases / à l'ouverture

/** Volume de la musique image par image : bas quand la voix parle, remonte
 *  dans les silences, fondu d'ouverture et de fermeture (« ducking »). */
const useMusicVolume = (p: EditionProps, order: string[]) =>
  useMemo(() => {
    const total = totalFrames(p);
    const target = new Array(total).fill(MUSIC_ALONE);
    let from = 0;
    for (const key of order) {
      const t = p.timings[key];
      for (const c of t.captions) {
        const a = Math.max(0, from + Math.floor((c.start - 0.12) * p.fps));
        const b = Math.min(total, from + Math.ceil((c.end + 0.25) * p.fps));
        for (let f = a; f < b; f++) target[f] = MUSIC_UNDER_VOICE;
      }
      from += t.frames;
    }
    const W = 9; // lissage : ~0,3 s pour monter/descendre
    const smooth = target.map((_, f) => {
      let sum = 0;
      let n = 0;
      for (let k = f - W; k <= f + W; k++) {
        if (k >= 0 && k < total) {
          sum += target[k];
          n++;
        }
      }
      return sum / n;
    });
    return (f: number) => {
      const fadeIn = Math.min(1, f / 15);
      const fadeOut = Math.min(1, (total - f) / 45);
      return (smooth[Math.min(total - 1, Math.max(0, f))] ?? 0) * fadeIn * Math.max(0, fadeOut);
    };
  }, [p, order]);

export const Edition: React.FC<EditionProps> = (p) => {
  useFonts();
  const order = useMemo(() => ["intro", ...p.segments.map((_, i) => `s${i + 1}`), "outro"], [p.segments]);
  const musicVolume = useMusicVolume(p, order);
  let from = 0;
  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      <style>{fontCss}</style>
      {p.music ? <Audio src={staticFile(p.music)} volume={musicVolume} loop /> : null}
      {order.map((key, i) => {
        const t = p.timings[key];
        const start = from;
        from += t.frames;
        return (
          <Sequence key={key} from={start} durationInFrames={t.frames} name={key}>
            {key === "intro" ? (
              <Intro p={p} t={t} />
            ) : key === "outro" ? (
              <Outro p={p} t={t} />
            ) : (
              <SegmentScene p={p} s={p.segments[i - 1]} t={t} index={i - 1} />
            )}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

export const totalFrames = (p: EditionProps) =>
  Object.values(p.timings).reduce((a, t) => a + t.frames, 0);
