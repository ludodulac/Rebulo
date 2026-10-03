from pathlib import Path
from PIL import Image
import cv2
import numpy as np
import json
import re
import unicodedata

SRC = Path("ops/rebulo-058-sources")
OLD = Path("assets/validation-candidates/lot-002")
OUT = Path("assets/validation-candidates/lot-002-extraction-repair")
OUT.mkdir(parents=True, exist_ok=True)

# Human-rejected extraction candidates plus DOIGT, which stays NOT_EVALUATED.
# Position is the visual cell in the protected 2x2 source board.
JOBS = [
    ("FOURCHETTE","lot002-fourchette-source-v1","boardA.png","TL","additional-252-fourchette.png",True),
    ("TIGRE","lot002-tigre-source-v1","boardA.png","TR","additional-262-tigre.png",True),
    ("ABEILLE","lot002-abeille-source-v1","boardA.png","BL","additional-281-abeille.png",True),
    ("CASQUE","lot002-casque-source-v1","boardA.png","BR","additional-254-casque.png",True),
    ("VALISE","lot002-valise-source-v1","boardB.png","TL","additional-172-valise.png",True),
    ("COCHON","lot002-cochon-source-v1","boardB.png","BL","additional-185-cochon.png",True),
    ("HOMARD","lot002-homard-source-v1","boardB.png","BR","additional-248-homard.png",True),
    ("BOUTEILLE","lot002-bouteille-source-v1","boardC.png","TR","additional-149-bouteille.png",True),
    ("GÂTEAU","lot002-gateau-source-v1","boardC.png","BR","additional-173-gateau.png",True),
    ("VENT","lot002-vent-source-v1","boardD.png","TL","additional-002-vent.png",True),
    ("DOIGT","lot002-doigt-source-v1","boardD.png","BL","additional-080-doigt.png",False),
    ("BEURRE","lot002-beurre-source-v1","boardE.png","TL","additional-290-beurre.png",True),
    ("BOTTE","lot002-botte-source-v1","boardE.png","TR","additional-292-botte.png",True),
    ("OIGNON","lot002-oignon-source-v1","boardE.png","BL","additional-353-oignon.png",True),
    ("CERF","lot002-cerf-source-v1","boardE.png","BR","additional-377-cerf.png",True),
    ("ROC","lot002-roc-source-v1","boardF.png","BL","additional-118-roc.png",True),
    ("GOMME","lot002-gomme-source-v1","boardF.png","BR","additional-163-gomme.png",True),
    ("POUCE","lot002-pouce-source-v1","boardG.png","TL","additional-081-pouce.png",True),
    ("SAC","lot002-sac-source-v1","boardG.png","TR","additional-088-sac.png",True),
    ("POULE","lot002-poule-source-v1","boardG.png","BL","additional-098-poule.png",True),
    ("AIL","lot002-ail-source-v1","boardG.png","BR","additional-282-ail.png",True),
    ("LAC","lot002-lac-source-v1","boardI.png","BL","additional-057-lac.png",True),
    ("DRAP","lot002-drap-source-v1","boardI.png","BR","additional-058-drap.png",True),
    ("SABLE","lot002-sable-source-v1","boardJ.png","TL","additional-059-sable.png",True),
]

ORDER = ["TL","TR","BL","BR"]
STRONG_ALPHA = 16
RETAIN_ALPHA = 8

def safe_name(label):
    value=unicodedata.normalize("NFKD",label).encode("ascii","ignore").decode("ascii").lower()
    return re.sub(r"[^a-z0-9]+","-",value).strip("-")

def bbox(mask):
    ys,xs=np.where(mask)
    if xs.size==0:
        raise RuntimeError("empty source object")
    return (int(xs.min()),int(ys.min()),int(xs.max()+1),int(ys.max()+1))

def components(mask):
    n, labels, stats, cents=cv2.connectedComponentsWithStats(mask.astype(np.uint8),8)
    sizes=sorted([int(stats[i,cv2.CC_STAT_AREA]) for i in range(1,n)],reverse=True)
    return n-1,sizes

def segment_board(path):
    rgba=np.array(Image.open(path).convert("RGBA"))
    h,w=rgba.shape[:2]
    alpha=rgba[:,:,3]

    # Strong visible pixels define the geometry of each of the four drawings.
    strong=(alpha>=STRONG_ALPHA).astype(np.uint8)
    n,labels,stats,cents=cv2.connectedComponentsWithStats(strong,8)
    seeds={q:np.zeros((h,w),np.uint8) for q in ORDER}

    # Crucial REBULO-059 change:
    # keep EVERY strong connected component. Components are never filtered by
    # area or proximity to the largest component. Each complete component is
    # assigned to its visual 2x2 cell by centroid.
    for i in range(1,n):
        cx,cy=cents[i]
        q=("T" if cy < h/2 else "B")+("L" if cx < w/2 else "R")
        seeds[q][labels==i]=1

    for q in ORDER:
        if not np.any(seeds[q]):
            raise RuntimeError(f"{path}: no strong seed for {q}")

    # Assign every retained source pixel to the nearest complete strong seed.
    # This recovers main shapes that cross the old quadrant cuts as well as
    # detached pieces, without discarding any component.
    distances=[]
    for q in ORDER:
        distances.append(cv2.distanceTransform((1-seeds[q]).astype(np.uint8),cv2.DIST_L2,5))
    assignment=np.argmin(np.stack(distances,axis=0),axis=0)
    retained=alpha>=RETAIN_ALPHA

    groups={}
    for idx,q in enumerate(ORDER):
        mask=retained & (assignment==idx)
        groups[q]=mask
    return rgba,groups

def old_stats(path):
    rgba=np.array(Image.open(path).convert("RGBA"))
    mask=rgba[:,:,3]>=RETAIN_ALPHA
    count,sizes=components(mask)
    return {
        "alpha_pixels":int(mask.sum()),
        "components":count,
        "component_sizes":sizes[:20],
        "dimensions":[int(rgba.shape[1]),int(rgba.shape[0])]
    }

board_cache={}
audit_rows=[]
manifest=[]
source_incomplete=[]

for concept,candidate_id,board_name,pos,old_name,repair_required in JOBS:
    board_path=SRC/board_name
    if board_name not in board_cache:
        board_cache[board_name]=segment_board(board_path)
    source_rgba,groups=board_cache[board_name]
    mask=groups[pos]
    h,w=mask.shape
    left,top,right,bottom=bbox(mask)
    margins=[left,top,w-right,h-bottom]
    source_complete=min(margins)>=4
    if not source_complete:
        source_incomplete.append(concept)

    # Exact source-preserving extraction. No redraw, no reconstruction,
    # no resampling. Pixels below RETAIN_ALPHA are transparent export halo.
    isolated=np.zeros_like(source_rgba)
    isolated[mask]=source_rgba[mask]
    obj=Image.fromarray(isolated,"RGBA").crop((left,top,right,bottom))

    canvas=Image.new("RGBA",(1024,1024),(0,0,0,0))
    x=(1024-obj.width)//2
    y=(1024-obj.height)//2
    canvas.alpha_composite(obj,(x,y))

    out_name=f"repair-{safe_name(concept)}.png"
    out_path=OUT/out_name
    canvas.save(out_path,optimize=True)

    source_pixels=int(mask.sum())
    source_components,source_sizes=components(mask)
    repaired_rgba=np.array(canvas)
    repaired_mask=repaired_rgba[:,:,3]>=RETAIN_ALPHA
    repaired_pixels=int(repaired_mask.sum())
    repaired_components,repaired_sizes=components(repaired_mask)

    if repaired_pixels!=source_pixels:
        raise RuntimeError(f"{concept}: pixel count changed {source_pixels}->{repaired_pixels}")
    if repaired_components!=source_components or repaired_sizes!=source_sizes:
        raise RuntimeError(f"{concept}: component integrity changed")

    old=old_stats(OLD/old_name)
    audit_rows.append({
        "concept":concept,
        "candidate_id":candidate_id,
        "repair_required":repair_required,
        "source_board":str(board_path),
        "source_position":pos,
        "source_complete":source_complete,
        "source_bbox":[left,top,right,bottom],
        "source_margins":margins,
        "source_alpha_threshold":RETAIN_ALPHA,
        "source_pixels_retained":source_pixels,
        "source_components_retained":source_components,
        "old_extraction_asset":str(OLD/old_name),
        "old_extraction":old,
        "repaired_asset":str(out_path),
        "repaired_pixels":repaired_pixels,
        "repaired_components":repaired_components,
        "pixel_loss_count":source_pixels-repaired_pixels,
        "component_loss_count":source_components-repaired_components,
        "resampled":False,
        "creative_change":False
    })
    manifest.append({
        "id":f"repair-{candidate_id}",
        "concept":concept,
        "asset":f"../{out_path.as_posix()}",
        "source_candidate_id":candidate_id,
        "status":"AWAITING_HUMAN_GRAPHIC_VALIDATION" if repair_required else "NOT_EVALUATED"
    })

repair_rows=[r for r in audit_rows if r["repair_required"]]
if len(repair_rows)!=23:
    raise RuntimeError(f"expected 23 repair rows, got {len(repair_rows)}")
if source_incomplete:
    raise RuntimeError("SOURCE_ALREADY_TRUNCATED: "+", ".join(source_incomplete))
if any(r["pixel_loss_count"]!=0 or r["component_loss_count"]!=0 for r in audit_rows):
    raise RuntimeError("source-pixel integrity loss detected")

audit={
    "schema_version":1,
    "mission":"REBULO-059",
    "root_cause":{
        "confirmed":True,
        "fixed_crop_loss":"REBULO-058 cropped fixed rectangles TL=(0,0,744,488), TR=(792,0,1536,488), BL=(0,536,744,1024), BR=(792,536,1536,1024). Protected-source drawings visibly cross those artificial gaps, so legitimate source pixels were cut before segmentation.",
        "component_filter_loss":"REBULO-058 then used GrabCut + connectedComponentsWithStats and retained only sufficiently large/spatially-near components. Legitimate detached pieces could therefore be removed.",
        "repair":"Segment the complete protected board. Keep every strong component, group components by visual-cell centroid, assign every retained source pixel to the nearest complete strong seed, and copy the exact original RGBA pixels to an individual transparent canvas without resampling."
    },
    "strong_alpha_threshold":STRONG_ALPHA,
    "retained_alpha_threshold":RETAIN_ALPHA,
    "retained_alpha_note":"Source PNGs include near-zero-alpha export halo. Pixels with alpha < 8 are treated as transparent halo; every source pixel with alpha >= 8 is assigned and preserved.",
    "source_images_checked":23,
    "technical_images_checked_including_doigt":24,
    "source_actually_complete":[r["concept"] for r in repair_rows if r["source_complete"]],
    "source_already_truncated":[r["concept"] for r in repair_rows if not r["source_complete"]],
    "repaired_extractions":[r["concept"] for r in repair_rows],
    "doigt_status":"NOT_EVALUATED",
    "doigt_source_complete":next(r for r in audit_rows if r["concept"]=="DOIGT")["source_complete"],
    "pixel_loss_comparison_method":"For each protected board, every source pixel with alpha >= 8 is assigned to exactly one of the four complete source drawings using nearest strong-component geometry. The repaired candidate is a pure translation of those exact RGBA pixels onto a transparent 1024x1024 canvas. Foreground pixel count and connected-component size multiset must be identical before and after extraction; required loss is zero.",
    "no_new_drawing_generated":True,
    "rows":audit_rows
}
Path("data/image-validation").mkdir(parents=True,exist_ok=True)
Path("data/image-validation/lot-002-extraction-repair-audit.json").write_text(
    json.dumps(audit,ensure_ascii=False,indent=2)+"\n",encoding="utf-8"
)

repair_manifest={
    "schema_version":1,
    "lot_id":"lot-002-extraction-repair",
    "title":"Lot 002 · réparation des extractions",
    "source_report":"data/image-validation/lot-002-human-2026-10-03.json",
    "candidate_status":"AWAITING_HUMAN_GRAPHIC_VALIDATION",
    "candidates":manifest
}
Path("validation-images/lots/lot-002-extraction-repair.json").write_text(
    json.dumps(repair_manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8"
)

print(json.dumps({
    "SOURCE_IMAGES_CHECKED":"23/23",
    "SOURCE_ACTUALLY_COMPLETE":len(audit["source_actually_complete"]),
    "REPAIRED_EXTRACTIONS":len(audit["repaired_extractions"]),
    "SOURCE_ALREADY_TRUNCATED":audit["source_already_truncated"],
    "DOIGT_COMPLETE":audit["doigt_source_complete"],
    "REPAIR_LOT_COUNT":len(manifest),
    "PIXEL_LOSS_TOTAL":sum(r["pixel_loss_count"] for r in audit_rows),
    "COMPONENT_LOSS_TOTAL":sum(r["component_loss_count"] for r in audit_rows)
},ensure_ascii=False))
