#!/usr/bin/env python3
"""Optimize existing Prime Build project photos without altering the originals.

Outputs .webp alongside original PNG photos, updates public-site references,
and records byte savings. Run from the GitHub repository root:
  python -m pip install pillow
  python scripts/optimize_images.py

Original PNG images are intentionally retained for archival and sharing uses.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
PHOTO_DIR = ROOT / "assets" / "img" / "portfolio" / "residential"
REPORT_PATH = ROOT / "assets" / "image-optimization-report.json"
PREFIX = "assets/img/portfolio/residential/"

def optimize() -> dict[str, object]:
    records = []
    failures = []
    source_files = sorted(PHOTO_DIR.glob("*.png"))
    if not source_files:
        raise RuntimeError("No source PNG images found at " + str(PHOTO_DIR))

    for source in source_files:
        dest = source.with_suffix(".webp")
        try:
            with Image.open(source) as src:
                image = ImageOps.exif_transpose(src)
                image.thumbnail((1920, 1440), Image.Resampling.LANCZOS)
                if image.mode not in ("RGB", "RGBA"):
                    image = image.convert("RGBA" if "A" in image.getbands() else "RGB")
                image.save(dest, format="WEBP", quality=82, method=6)
            previous_size = source.stat().st_size
            new_size = dest.stat().st_size
            if new_size >= previous_size:
                dest.unlink()
                failures.append(source.name + ": WebP is not smaller than source")
                continue
            records.append({
                "original": PREFIX + source.name,
                "optimized": PREFIX + dest.name,
                "source_bytes": previous_size,
                "webp_bytes": new_size,
                "saved_percent": round((1 - new_size / previous_size) * 100, 1),
            })
        except Exception as exc:
            failures.append(source.name + ": " + str(exc))

    if not records:
        raise RuntimeError("No images could be optimized: " + "; ".join(failures))
    mapping = {Path(x["original"]).name: Path(x["optimized"]).name for x in records}
    files_to_rewrite = [*sorted(ROOT.glob("*.html")), ROOT / "js" / "prime.js"]
    files_to_rewrite += sorted((ROOT / "css").glob("*.css"))
    changed_files = []

    def swap_path(match: re.Match[str]) -> str:
        name = match.group(1) + ".png"
        return PREFIX + mapping.get(name, name.replace(".png", ".png"))

    pattern = re.compile(re.escape(PREFIX) + r"([A-Za-z0-9_-]+)\.png")
    bare_names = re.compile(r"(?P<quote>['\"])(?P<stem>[A-Za-z0-9_-]+)\.png(?P=quote)")

    for path in files_to_rewrite:
        if not path.exists():
            continue
        original = path.read_text(encoding="utf-8")
        rewritten_lines = []
        for line in original.splitlines(keepends=True):
            # Retain standard PNG OpenGraph previews for the widest possible compatibility.
            if 'property="og:image"' not in line:
                def replace_path(match: re.Match[str]) -> str:
                    png = match.group(1) + ".png"
                    return PREFIX + mapping[png] if png in mapping else match.group(0)
                line = pattern.sub(replace_path, line)
                if path.name == "prime.js":
                    def replace_bare(match: re.Match[str]) -> str:
                        png = match.group("stem") + ".png"
                        if png in mapping:
                            quote = match.group("quote")
                            return quote + mapping[png] + quote
                        return match.group(0)
                    line = bare_names.sub(replace_bare, line)
            rewritten_lines.append(line)
        updated = "".join(rewritten_lines)
        if updated != original:
            path.write_text(updated, encoding="utf-8")
            changed_files.append(path.relative_to(ROOT).as_posix())

    before = sum(x["source_bytes"] for x in records)
    after = sum(x["webp_bytes"] for x in records)
    result = {
        "purpose": "Prime Build public portfolio WebP optimization",
        "original_images_preserved": True,
        "quality": 82,
        "max_dimensions_px": [1920, 1440],
        "images_optimized": len(records),
        "total_source_bytes": before,
        "total_webp_bytes": after,
        "total_savings_percent": round((1 - after / before) * 100, 1),
        "rewritten_site_files": changed_files,
        "skipped_images": failures,
        "images": records,
    }
    REPORT_PATH.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: v for k, v in result.items() if k != "images"}, indent=2))
    return result

if __name__ == "__main__":
    optimize()
