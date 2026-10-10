"""Production complète d'une édition Galsen Brief, de bout en bout.

Usage : python3 scripts/produce.py editions/<id>.json

1. Télécharge les photos des sujets (champ « imageUrl ») dans public/assets/images/<id>/,
   rogne le bandeau éventuel (« cropLeft », « cropBottom » en fraction), et remplit « image ».
2. Génère la voix (Vivienne), les sous-titres et props.json (scripts/build_audio.py).
3. Rend la vidéo dans out/<id>.mp4 et une miniature out/<id>.jpg.
Affiche à la fin le chemin de la vidéo et sa durée.
"""
import json
import subprocess
import sys
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125 Safari/537.36"}


def fetch_image(url: str, dest: Path, crop_left: float = 0, crop_bottom: float = 0) -> None:
    raw = dest.with_suffix(".src")
    req = urllib.request.Request(url, headers=UA)
    raw.write_bytes(urllib.request.urlopen(req, timeout=40).read())
    try:
        im = Image.open(raw)
        im.load()
    except Exception:
        # AVIF / WebP que Pillow ne lit pas : conversion par ffmpeg
        png = dest.with_suffix(".png")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), str(png)], check=True)
        im = Image.open(png)
    im = im.convert("RGB")
    w, h = im.size
    im = im.crop((int(w * crop_left), 0, w, int(h * (1 - crop_bottom))))
    im.save(dest, quality=90)
    raw.unlink(missing_ok=True)


def main(edition_path: str) -> None:
    path = (ROOT / edition_path) if not Path(edition_path).is_absolute() else Path(edition_path)
    ed = json.loads(path.read_text(encoding="utf-8"))
    eid = ed["id"]
    img_dir = ROOT / "public/assets/images" / eid
    img_dir.mkdir(parents=True, exist_ok=True)

    for i, s in enumerate(ed["segments"], 1):
        url = s.get("imageUrl")
        if not url:
            continue
        dest = img_dir / f"s{i}.jpg"
        try:
            fetch_image(url, dest, s.get("cropLeft", 0), s.get("cropBottom", 0))
            s["image"] = f"assets/images/{eid}/s{i}.jpg"
            print(f"✓ photo s{i} ({s.get('imageCredit', '?')})")
        except Exception as e:  # une photo manquante ne bloque pas la vidéo
            s.pop("image", None)
            print(f"⚠ photo s{i} impossible : {e}")
    path.write_text(json.dumps(ed, ensure_ascii=False, indent=2), encoding="utf-8")

    subprocess.run([sys.executable, str(ROOT / "scripts/build_audio.py"), str(path)], check=True)

    props = ROOT / "public/editions" / eid / "props.json"
    out = ROOT / "out" / f"{eid}.mp4"
    out.parent.mkdir(exist_ok=True)
    subprocess.run(
        ["npx", "remotion", "render", "src/index.ts", "GalsenBrief", str(out),
         f"--props={props}", "--concurrency=2", "--log=error"],
        cwd=ROOT, check=True,
    )
    # miniature : 1re image du 1er sujet, quand le titre est affiché
    p = json.loads(props.read_text(encoding="utf-8"))
    frame = p["timings"]["intro"]["frames"] + 75
    subprocess.run(
        ["npx", "remotion", "still", "src/index.ts", "GalsenBrief", str(out.with_suffix(".jpg")),
         f"--props={props}", f"--frame={frame}", "--log=error"],
        cwd=ROOT, check=True,
    )
    total = sum(t["frames"] for t in p["timings"].values()) / p["fps"]
    print(f"VIDEO {out} ({total:.0f} s)\nMINIATURE {out.with_suffix('.jpg')}")


if __name__ == "__main__":
    main(sys.argv[1])
