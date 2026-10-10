"""Génère le logo Galsen Brief en SVG vectoriel (lettres converties en tracés,
aucune police requise) + PNG.

Sorties dans brand/ :
  logo-principal.svg/.png     GALSEN / BRIEF empilés + barre tricolore étoilée (fond sombre)
  logo-principal-clair.svg    même logo pour fond clair
  logo-horizontal.svg/.png    GALSEN BRIEF sur une ligne (bandeaux, vidéo)
  avatar.svg/.png             monogramme GB pour les photos de profil
Le logo est aussi copié dans public/brand/ pour Remotion.
"""
import shutil
from pathlib import Path

import cairosvg
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
FONT = TTFont(ROOT / "public/fonts/anton-latin-400-normal.woff2")
GS = FONT.getGlyphSet()
CMAP = FONT.getBestCmap()
UPM = FONT["head"].unitsPerEm

BG, WHITE, YELLOW = "#0B0D10", "#F5F3EE", "#FFC727"
GREEN, RED = "#00A651", "#E31B23"


def text_path(text: str, size: float, x: float, baseline: float, tracking: float = 0.0):
    """Tracé SVG du texte (Anton) ; renvoie (d, largeur, (ymin, ymax) écran)."""
    scale = size / UPM
    pen = SVGPathPen(GS)
    bounds = BoundsPen(GS)
    cx = 0.0
    for ch in text:
        g = CMAP[ord(ch)]
        t = (scale, 0, 0, -scale, x + cx, baseline)
        GS[g].draw(TransformPen(pen, t))
        GS[g].draw(TransformPen(bounds, t))
        cx += GS[g].width * scale + tracking
    width = cx - tracking
    b = bounds.bounds
    return pen.getCommands(), width, (b[1], b[3])


def star(cx: float, cy: float, r: float, color: str) -> str:
    import math
    pts = []
    for i in range(10):
        rad = r if i % 2 == 0 else r * 0.382
        a = -math.pi / 2 + i * math.pi / 5
        pts.append(f"{cx + rad * math.cos(a):.2f},{cy + rad * math.sin(a):.2f}")
    return f'<polygon points="{" ".join(pts)}" fill="{color}"/>'


def tricolor(x: float, y: float, w: float, h: float) -> str:
    s = w / 3
    return (
        f'<rect x="{x:.2f}" y="{y:.2f}" width="{s:.2f}" height="{h:.2f}" fill="{GREEN}"/>'
        f'<rect x="{x + s:.2f}" y="{y:.2f}" width="{s:.2f}" height="{h:.2f}" fill="{YELLOW}"/>'
        f'<rect x="{x + 2 * s:.2f}" y="{y:.2f}" width="{s:.2f}" height="{h:.2f}" fill="{RED}"/>'
        # médaillon central : l'étoile verte du drapeau, qui déborde de la barre
        + f'<circle cx="{x + 1.5 * s:.2f}" cy="{y + h / 2:.2f}" r="{h * 1.05:.2f}" fill="{YELLOW}"/>'
        + star(x + 1.5 * s, y + h / 2 + h * 0.05, h * 0.82, GREEN)
    )


def svg(w: int, h: int, body: str, bg: str | None) -> str:
    rect = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ""
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{rect}{body}</svg>'


def principal(top_color: str, bg: str | None, w=1200, h=1200) -> str:
    """GALSEN au-dessus de BRIEF, même largeur optique, barre tricolore dessous."""
    target = w * 0.72
    # on cale chaque mot sur la même largeur
    _, w1, _ = text_path("GALSEN", 100, 0, 0, 0)
    _, w2, _ = text_path("BRIEF", 100, 0, 0, 0)
    s1, s2 = 100 * target / w1, 100 * target / w2
    x0 = (w - target) / 2
    gap = s1 * 0.04
    d1, _, (a1, b1) = text_path("GALSEN", s1, x0, 0)
    cap1 = b1 - a1
    d2, _, (a2, b2) = text_path("BRIEF", s2, x0, 0)
    cap2 = b2 - a2
    bar_h = cap1 * 0.12
    total = cap1 + gap + cap2 + gap * 3.2 + bar_h * 2
    top = (h - total) / 2
    base1 = top + cap1
    base2 = base1 + gap + cap2
    d1, _, _ = text_path("GALSEN", s1, x0, base1)
    d2, _, _ = text_path("BRIEF", s2, x0, base2)
    body = (
        f'<path d="{d1}" fill="{top_color}"/>'
        f'<path d="{d2}" fill="{YELLOW}"/>'
        + tricolor(x0, base2 + gap * 3.2 + bar_h * 0.5, target, bar_h)
    )
    return svg(w, h, body, bg)


def horizontal(w=2400, h=600) -> str:
    size = h * 0.62
    d1, w1, (a, b) = text_path("GALSEN", size, 0, 0)
    _, w2, _ = text_path("BRIEF", size, 0, 0)
    space = size * 0.16
    total = w1 + space + w2
    x0 = (w - total) / 2
    cap = b - a
    bar_h = cap * 0.07
    base = (h - cap - bar_h * 4) / 2 + cap
    d1, _, _ = text_path("GALSEN", size, x0, base)
    d2, _, _ = text_path("BRIEF", size, x0 + w1 + space, base)
    body = (
        f'<path d="{d1}" fill="{WHITE}"/><path d="{d2}" fill="{YELLOW}"/>'
        + tricolor(x0, base + bar_h * 2.2, total, bar_h)
    )
    return svg(w, h, body, None)


def avatar(w=1080) -> str:
    """Monogramme pour photo de profil (recadrée en rond par les réseaux)."""
    size = w * 0.62
    _, tw, (a, b) = text_path("GB", size, 0, 0, tracking=-size * 0.01)
    cap = b - a
    bar_h = cap * 0.11
    x0 = (w - tw) / 2
    base = (w - cap - bar_h * 3.4) / 2 + cap
    dg, _, _ = text_path("G", size, x0, base)
    _, gw, _ = text_path("G", size, 0, 0)
    db, _, _ = text_path("B", size, x0 + gw - size * 0.01, base)
    body = (
        f'<path d="{dg}" fill="{WHITE}"/><path d="{db}" fill="{YELLOW}"/>'
        + tricolor(x0, base + bar_h * 1.9, tw, bar_h)
    )
    return svg(w, w, body, BG)


def main() -> None:
    out = ROOT / "brand"
    out.mkdir(exist_ok=True)
    files = {
        "logo-principal": principal(WHITE, BG),
        "logo-principal-transparent": principal(WHITE, None),
        "logo-principal-clair": principal(BG, "#F5F3EE"),
        "logo-horizontal": horizontal(),
        "avatar": avatar(),
    }
    for name, content in files.items():
        (out / f"{name}.svg").write_text(content, encoding="utf-8")
        cairosvg.svg2png(bytestring=content.encode(), write_to=str(out / f"{name}.png"))
        print("✓", name)
    pub = ROOT / "public/brand"
    pub.mkdir(parents=True, exist_ok=True)
    for f in out.glob("*.svg"):
        shutil.copy(f, pub / f.name)


if __name__ == "__main__":
    main()
