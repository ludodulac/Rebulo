#!/usr/bin/env python3
"""Safely ingest a ZIP of REBULO PNG candidates into validation-candidates."""
from __future__ import annotations
import argparse, hashlib, json, shutil, stat, tempfile, zipfile
from pathlib import Path, PurePosixPath
from PIL import Image
from optimize_validation_pngs import process

MAX_DIMENSION = 8192
MAX_PIXELS = 40_000_000

def entry_rejection(info):
    p = PurePosixPath(info.filename)
    if p.is_absolute() or ".." in p.parts or info.filename.startswith(("/", "\\")):
        return "unsafe_path"
    if ((info.external_attr >> 16) & 0o170000) == stat.S_IFLNK:
        return "symlink"
    if info.is_dir(): return "directory"
    if p.suffix.lower() != ".png": return "non_png"
    return None

def validate_png(path):
    try:
        with Image.open(path) as im:
            if im.format != "PNG": return False, "not_png"
            im.load()
            if (im.width < 1 or im.height < 1 or im.width > MAX_DIMENSION or
                im.height > MAX_DIMENSION or im.width * im.height > MAX_PIXELS):
                return False, "unreasonable_dimensions"
            if im.convert("RGBA").getchannel("A").getbbox() is None:
                return False, "fully_transparent"
        return True, None
    except Exception:
        return False, "corrupt_png"

def ingest(archive, destination, report_path):
    archive, destination, report_path = map(Path, (archive, destination, report_path))
    rows, collisions, duplicates, seen_names, seen_hashes = [], [], [], set(), {}
    with tempfile.TemporaryDirectory() as td:
        prepared, optimized = Path(td)/"prepared", Path(td)/"optimized"
        prepared.mkdir(); optimized.mkdir()
        with zipfile.ZipFile(archive) as zf:
            infos = zf.infolist()
            for info in infos:
                reason = entry_rejection(info)
                if reason == "directory": continue
                row = {"entry": info.filename}
                if reason:
                    row.update(status="rejected", reason=reason); rows.append(row); continue
                name = PurePosixPath(info.filename).name
                if name in seen_names:
                    collisions.append(name); row.update(status="rejected", reason="name_collision"); rows.append(row); continue
                seen_names.add(name)
                target = prepared/name
                with zf.open(info) as src, target.open("wb") as dst: shutil.copyfileobj(src, dst)
                ok, reason = validate_png(target)
                if not ok:
                    target.unlink(missing_ok=True); row.update(status="rejected", reason=reason); rows.append(row); continue
                digest = hashlib.sha256(target.read_bytes()).hexdigest()
                if digest in seen_hashes:
                    duplicates.append([seen_hashes[digest], info.filename]); target.unlink()
                    row.update(status="rejected", reason="binary_duplicate"); rows.append(row); continue
                seen_hashes[digest] = info.filename
                row.update(status="valid", name=name, bytes_before=target.stat().st_size); rows.append(row)
        valid = [r for r in rows if r.get("status") == "valid"]
        if not valid: raise ValueError("archive contains no valid PNG")
        for row in valid:
            meta = process(prepared/row["name"], optimized/row["name"])
            row["bytes_after"] = meta["bytes_after"]
            with Image.open(optimized/row["name"]) as im:
                im.load()
                if im.mode != "RGBA" or im.getchannel("A").getbbox() is None:
                    raise RuntimeError("optimizer alpha verification failed")
        destination.mkdir(parents=True, exist_ok=True)
        produced = []
        for row in valid:
            dst = destination/row["name"]
            if dst.exists(): raise FileExistsError(f"destination collision: {dst}")
            shutil.copy2(optimized/row["name"], dst); produced.append(str(dst))
    report = {
        "archive_source": archive.name, "zip_entries": len(infos),
        "png_detected": sum(PurePosixPath(r["entry"]).suffix.lower()==".png" for r in rows),
        "png_valid": len(valid), "rejected": len(rows)-len(valid),
        "rejections": [r for r in rows if r.get("status")=="rejected"],
        "duplicates": duplicates, "collisions": collisions,
        "bytes_before": sum(r.get("bytes_before",0) for r in valid),
        "bytes_after": sum(r.get("bytes_after",0) for r in valid),
        "alpha_verified": True, "destinations": produced}
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    return report

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("archive"); ap.add_argument("destination"); ap.add_argument("--report", required=True)
    args=ap.parse_args(); ingest(args.archive,args.destination,args.report)
if __name__=="__main__": main()
