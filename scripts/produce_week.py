"""Carrousel « La semaine en bref » : photos + slides PNG 1080×1350.

Usage : python3 scripts/produce_week.py weekly/<id>.json
Chaque item (et « cover ») peut donner « imageUrl » (+ « cropLeft »/« cropBottom ») :
la photo est téléchargée dans public/weekly/<id>/ et le champ « image » rempli.
Sortie : out/semaine-<id>/slide-1.png … slide-N.png
"""
import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from produce import ROOT, fetch_image  # noqa: E402


def main(week_path: str) -> None:
    path = ROOT / week_path
    wk = json.loads(path.read_text(encoding="utf-8"))
    wid = wk["id"]
    d = ROOT / "public/weekly" / wid
    d.mkdir(parents=True, exist_ok=True)
    targets = [("cover", wk["cover"])] + [(f"item{i}", it) for i, it in enumerate(wk["items"], 1)]
    for name, obj in targets:
        if obj.get("imageUrl"):
            try:
                fetch_image(obj["imageUrl"], d / f"{name}.jpg", obj.get("cropLeft", 0), obj.get("cropBottom", 0))
                obj["image"] = f"weekly/{wid}/{name}.jpg"
                print(f"✓ photo {name}")
            except Exception as e:
                print(f"⚠ photo {name} impossible : {e}")
    path.write_text(json.dumps(wk, ensure_ascii=False, indent=2), encoding="utf-8")

    out = ROOT / "out" / f"semaine-{wid}"
    out.mkdir(parents=True, exist_ok=True)
    n = len(wk["items"]) + 2
    for i in range(n):
        subprocess.run(
            ["npx", "remotion", "still", "src/index.ts", "SemaineEnBref", str(out / f"slide-{i + 1}.png"),
             f"--props={path}", f"--frame={i}", "--log=error"],
            cwd=ROOT, check=True,
        )
    print(f"SLIDES {out} ({n} slides)")


if __name__ == "__main__":
    main(sys.argv[1])
