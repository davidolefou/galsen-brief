"""Contrôle de prononciation : transcrit chaque MP3 d'une édition et le
compare au texte prévu, pour repérer les mots mal prononcés (sigles…).

Usage : python3 scripts/check_voice.py editions/2026-10-09-matin.json
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from faster_whisper import WhisperModel

ROOT = Path(__file__).resolve().parent.parent


def load_audio(path: Path) -> np.ndarray:
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", "16000", "-"],
        capture_output=True, check=True,
    ).stdout
    return np.frombuffer(raw, np.float32)


def main(edition_path: str) -> None:
    edition = json.loads(Path(edition_path).read_text(encoding="utf-8"))
    eid = edition["id"]
    model = WhisperModel("small", device="cpu", compute_type="int8")
    texts = {"intro": edition["intro"], "outro": edition["outro"]}
    texts.update({f"s{i + 1}": s["voix"] for i, s in enumerate(edition["segments"])})
    for key, expected in texts.items():
        mp3 = ROOT / "public" / "editions" / eid / f"{key}.mp3"
        segs, _ = model.transcribe(load_audio(mp3), language="fr", beam_size=5)
        heard = " ".join(s.text.strip() for s in segs)
        print(f"--- {key}\nPRÉVU : {expected}\nENTENDU : {heard}\n")


if __name__ == "__main__":
    main(sys.argv[1])
