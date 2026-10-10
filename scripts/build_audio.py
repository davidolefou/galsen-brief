"""Génère la voix off d'une édition et le fichier props.json pour Remotion.

Usage : python3 scripts/build_audio.py editions/2026-10-09-matin.json

Pour chaque bloc (intro, sujets, outro) : un MP3 + les mots horodatés,
regroupés en sous-titres courts. Les durées servent à caler le montage.
"""
import asyncio
import json
import re
import subprocess
import sys
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
FPS = 30
TAIL = 0.35  # respiration après chaque bloc, en secondes


def probe_duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", str(path)],
        capture_output=True, text=True, check=True,
    )
    return float(out.stdout.strip())


async def synth(text: str, voice: str, rate: str, out: Path) -> list[dict]:
    words = []
    com = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
    with out.open("wb") as f:
        async for chunk in com.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                start = chunk["offset"] / 10_000_000
                words.append({
                    "text": chunk["text"],
                    "start": start,
                    "end": start + chunk["duration"] / 10_000_000,
                })
    return words


PUNCT = "«»\"'()[],.;:!?…"
LEXICON = {
    k: v
    for k, v in json.loads((ROOT / "pronunciation.json").read_text(encoding="utf-8")).items()
    if not k.startswith("_")
}


NUMBER = re.compile(r"^(\d{1,3}(?:[ .  ]\d{3})+|\d+)(?:,(\d+))?(%|h|e|er|ère)?$")


def speak_number(core: str) -> str | None:
    """« 137,5 » -> « cent trente-sept virgule cinq », « 1946 » -> « mille neuf
    cent quarante-six », « 24h » -> « vingt-quatre heures », « 1er » -> « premier »."""
    from num2words import num2words

    m = NUMBER.match(core)
    if not m:
        return None
    whole = int(re.sub(r"\D", "", m.group(1)))
    unit = m.group(3)
    if unit in ("er", "ère") and whole == 1:
        return "premier" if unit == "er" else "première"
    if unit == "e":
        return num2words(whole, lang="fr", to="ordinal")
    words = num2words(whole, lang="fr")
    if m.group(2):  # partie décimale lue chiffre par groupe : « virgule cinq »
        words += " virgule " + num2words(int(m.group(2)), lang="fr")
    if unit == "%":
        words += " pour cent"
    elif unit == "h":
        words += " heure" if whole == 1 else " heures"
    return words


def speak_token(token: str) -> str:
    """Version « à prononcer » d'un mot écrit (chiffres, sigles, noms propres, tirets)."""
    core = token.strip(PUNCT)
    if not core:
        return token
    start = token.find(core)
    prefix, suffix = token[:start], token[start + len(core):]
    number = speak_number(core)
    if number:
        return prefix + number + suffix
    # « Dakar–Mbour–Fatick » : le tiret long fait avaler les mots -> virgules
    parts = [p for p in re.split(r"[–—]", core) if p]
    spoken = ", ".join(LEXICON.get(p, p) for p in parts)
    # gère aussi l'élision : « l'ANACIM », « d'Thiès »
    m = re.match(r"^([lLdDjJmMnNsStTcCqu]+')(.+)$", spoken)
    if m and m.group(2) in LEXICON:
        spoken = m.group(1) + LEXICON[m.group(2)]
    return prefix + spoken + suffix


def to_spoken(text: str) -> tuple[str, list[tuple[str, int, int]]]:
    """Texte à faire lire + pour chaque mot affiché, sa plage dans ce texte."""
    pieces, mapping, pos = [], [], 0
    for m in re.finditer(r"\S+", text):
        spoken = speak_token(m.group())
        mapping.append((m.group(), pos, pos + len(spoken)))
        pieces.append(spoken)
        pos += len(spoken) + 1
    return " ".join(pieces), mapping


def align(spoken: str, mapping: list, words: list[dict]) -> list[dict]:
    """Recale les mots AFFICHÉS (orthographe d'origine, ponctuation comprise)
    sur les horodatages de la voix, calculés sur le texte prononcé."""
    spans, pos = [], 0
    for w in words:
        idx = spoken.find(w["text"], pos)
        if idx == -1:
            continue
        spans.append((idx, idx + len(w["text"]), w["start"], w["end"]))
        pos = idx + len(w["text"])

    out: list[dict] = []
    for display, a, b in mapping:
        hits = [s for s in spans if s[0] < b and s[1] > a]
        if not hits:  # ponctuation isolée (« : », « ? ») -> collée au mot précédent
            if out:
                out[-1]["text"] += " " + display
            continue
        out.append({"text": display, "start": hits[0][2], "end": hits[-1][3]})
    return out


def to_captions(words: list[dict], max_words: int = 5) -> list[dict]:
    caps, cur = [], []
    for w in words:
        cur.append(w)
        punct = w["text"][-1:] in ",.;:!?"
        # ne pas finir un sous-titre sur un petit mot (« à », « la », « de »)
        dangling = len(w["text"]) <= 3 and not punct
        if punct or (len(cur) >= max_words and not dangling) or len(cur) >= max_words + 2:
            caps.append({"text": " ".join(x["text"] for x in cur),
                         "start": cur[0]["start"], "end": cur[-1]["end"]})
            cur = []
    if cur:
        caps.append({"text": " ".join(x["text"] for x in cur),
                     "start": cur[0]["start"], "end": cur[-1]["end"]})
    return caps


async def main(edition_path: str) -> None:
    edition = json.loads(Path(edition_path).read_text(encoding="utf-8"))
    eid = edition["id"]
    voice = edition.get("voice", "fr-FR-HenriNeural")
    rate = edition.get("rate", "+8%")
    audio_dir = ROOT / "public" / "editions" / eid
    audio_dir.mkdir(parents=True, exist_ok=True)

    blocks = [("intro", edition["intro"])]
    blocks += [(f"s{i + 1}", s["voix"]) for i, s in enumerate(edition["segments"])]
    blocks += [("outro", edition["outro"])]

    timings = {}
    for key, text in blocks:
        mp3 = audio_dir / f"{key}.mp3"
        spoken, mapping = to_spoken(text)
        words = align(spoken, mapping, await synth(spoken, voice, rate, mp3))
        dur = probe_duration(mp3)
        timings[key] = {
            "audio": f"editions/{eid}/{key}.mp3",
            "frames": int(round((dur + TAIL) * FPS)),
            "captions": to_captions(words),
        }
        print(f"{key}: {dur:.1f}s")

    props = {**edition, "fps": FPS, "timings": timings}
    # Musique, sons et photos : on ne garde que les fichiers réellement présents
    # dans public/, pour qu'un asset manquant ne casse pas le rendu.
    exists = lambda rel: bool(rel) and (ROOT / "public" / rel).is_file()
    for k in ("music",):
        if k in props and not exists(props[k]):
            print(f"⚠ {k} introuvable : {props.pop(k)}")
    if "sfx" in props:
        props["sfx"] = {k: v for k, v in props["sfx"].items() if exists(v) or print(f"⚠ son introuvable : {v}")}
    props["segments"] = [
        s if exists(s.get("image")) or "image" not in s
        else (print(f"⚠ image introuvable : {s['image']}") or {k: v for k, v in s.items() if k != "image"})
        for s in props["segments"]
    ]
    (audio_dir / "props.json").write_text(
        json.dumps(props, ensure_ascii=False, indent=2), encoding="utf-8")
    total = sum(t["frames"] for t in timings.values()) / FPS
    print(f"Durée totale : {total:.1f}s -> {audio_dir / 'props.json'}")


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1]))
