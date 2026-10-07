#!/usr/bin/env python3
"""Prepare REBULO validation-candidate PNGs without touching canonical assets.

Usage: python scripts/optimize_validation_pngs.py INPUT_DIR OUTPUT_DIR
Operations are lossless by default: RGBA normalization, transparent-margin crop,
minimum transparent padding, PNG recompression. No resize is performed unless a
future caller explicitly adds a reviewed resize policy.
"""
from pathlib import Path
from PIL import Image
import argparse, json

MIN_MARGIN = 4
KEEP_MARGIN = 8

def process(src: Path, dst: Path):
    before = src.stat().st_size
    with Image.open(src) as original:
        mode_before = original.mode
        im = original.convert("RGBA")
        size_before = im.size
        bbox = im.getchannel("A").getbbox()
        if bbox is None:
            raise ValueError(f"fully transparent image: {src}")
        l,t,r,b = bbox
        im = im.crop((max(0,l-KEEP_MARGIN), max(0,t-KEEP_MARGIN),
                      min(im.width,r+KEEP_MARGIN), min(im.height,b+KEEP_MARGIN)))
        bbox2 = im.getchannel("A").getbbox()
        l,t,r,b = bbox2
        pads = (l,t,im.width-r,im.height-b)
        add = tuple(max(0, MIN_MARGIN-p) for p in pads)
        if any(add):
            canvas = Image.new("RGBA", (im.width+add[0]+add[2], im.height+add[1]+add[3]), (0,0,0,0))
            canvas.paste(im, (add[0], add[1]))
            im = canvas
        dst.parent.mkdir(parents=True, exist_ok=True)
        im.save(dst, format="PNG", optimize=True, compress_level=9)
    return {"file": src.name, "dimensions_before": size_before,
            "dimensions_after": im.size, "bytes_before": before,
            "bytes_after": dst.stat().st_size, "mode_before": mode_before,
            "alpha_after": True, "resized": False}

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("input_dir"); ap.add_argument("output_dir")
    args=ap.parse_args(); src=Path(args.input_dir); dst=Path(args.output_dir)
    rows=[process(p,dst/p.name) for p in sorted(src.glob("*.png"))]
    print(json.dumps({"count":len(rows),"files":rows,
        "total_bytes_before":sum(r["bytes_before"] for r in rows),
        "total_bytes_after":sum(r["bytes_after"] for r in rows)}, ensure_ascii=False, indent=2))
if __name__ == "__main__": main()
