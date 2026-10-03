from PIL import Image
from collections import Counter, deque
from pathlib import Path
import json, math

SRC = Path("ops/rebulo-058-sources")
OLD = Path("assets/validation-candidates/lot-002")
OUT = Path("assets/validation-candidates/lot-002-extraction-repair")
OUT.mkdir(parents=True, exist_ok=True)

# Exact quadrant boxes used by REBULO-058.
Q = {
    "TL": (0, 0, 744, 488),
    "TR": (792, 0, 1536, 488),
    "BL": (0, 536, 744, 1024),
    "BR": (792, 536, 1536, 1024),
}

# 23 human-rejected extractions + DOIGT, which remains NOT_EVALUATED.
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

def component_count(mask, w, h):
    seen = bytearray(w*h)
    count = 0
    sizes = []
    for y in range(h):
        for x in range(w):
            idx=y*w+x
            if not mask[idx] or seen[idx]:
                continue
            count += 1
            q=deque([(x,y)])
            seen[idx]=1
            n=0
            while q:
                xx,yy=q.popleft(); n+=1
                for nx,ny in ((xx-1,yy),(xx+1,yy),(xx,yy-1),(xx,yy+1)):
                    if 0<=nx<w and 0<=ny<h:
                        ni=ny*w+nx
                        if mask[ni] and not seen[ni]:
                            seen[ni]=1
                            q.append((nx,ny))
            sizes.append(n)
    return count, sorted(sizes, reverse=True)

def dist(a,b):
    return math.sqrt(sum((int(a[i])-int(b[i]))**2 for i in range(3)))

def source_foreground(crop):
    rgba = crop.convert("RGBA")
    w,h=rgba.size
    px=list(rgba.getdata())
    alpha=[p[3] for p in px]
    transparent=sum(1 for a in alpha if a==0)

    # If the protected source already carries real alpha, it is authoritative:
    # preserve every non-transparent source pixel, including detached pieces.
    if transparent > (w*h)//100:
        mask=bytearray(1 if a>0 else 0 for a in alpha)
        return rgba, mask, "SOURCE_ALPHA_PRESERVED"

    # Otherwise remove only border-connected pixels that match the actual
    # background palette. No component-size or proximity filtering is allowed.
    border=[]
    band=8
    for y in range(h):
        for x in range(w):
            if x<band or y<band or x>=w-band or y>=h-band:
                border.append(px[y*w+x][:3])
    common=Counter(border).most_common(12)
    bg_palette=[rgb for rgb,n in common if n>=max(8,len(border)//200)]
    if not bg_palette:
        bg_palette=[common[0][0]]

    def looks_bg(i):
        p=px[i]
        if p[3]==0:
            return True
        rgb=p[:3]
        # Keep threshold deliberately tight: only the actual flat/light board
        # background may disappear. Detached subject components are never
        # filtered by size, area, or distance from the largest component.
        return min(dist(rgb,bg) for bg in bg_palette) <= 12

    bg=bytearray(w*h)
    q=deque()
    for x in range(w):
        for y in (0,h-1):
            i=y*w+x
            if looks_bg(i) and not bg[i]:
                bg[i]=1;q.append((x,y))
    for y in range(h):
        for x in (0,w-1):
            i=y*w+x
            if looks_bg(i) and not bg[i]:
                bg[i]=1;q.append((x,y))
    while q:
        x,y=q.popleft()
        for nx,ny in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
            if 0<=nx<w and 0<=ny<h:
                i=ny*w+nx
                if not bg[i] and looks_bg(i):
                    bg[i]=1;q.append((nx,ny))

    mask=bytearray(0 if bg[i] else 1 for i in range(w*h))
    out=[]
    for i,p in enumerate(px):
        out.append((p[0],p[1],p[2],p[3] if mask[i] else 0))
    rgba.putdata(out)
    return rgba, mask, "BORDER_CONNECTED_BACKGROUND_ONLY"

def bbox_from_mask(mask,w,h):
    xs=[];ys=[]
    for y in range(h):
        row=y*w
        for x in range(w):
            if mask[row+x]:
                xs.append(x);ys.append(y)
    if not xs:
        return None
    return (min(xs),min(ys),max(xs)+1,max(ys)+1)

def old_alpha_components(path):
    im=Image.open(path).convert("RGBA")
    w,h=im.size
    mask=bytearray(1 if a>0 else 0 for a in im.getchannel("A").getdata())
    c,s=component_count(mask,w,h)
    return c,s,sum(mask)

audit_rows=[]
manifest=[]
source_incomplete=[]
for concept,candidate_id,board_name,pos,old_name,repair_required in JOBS:
    board_path=SRC/board_name
    board=Image.open(board_path).convert("RGBA")
    crop=board.crop(Q[pos])
    w,h=crop.size
    cut,mask,method=source_foreground(crop)
    bbox=bbox_from_mask(mask,w,h)
    if bbox is None:
        raise RuntimeError(f"{concept}: no foreground detected")
    left,top,right,bottom=bbox
    margins=[left,top,w-right,h-bottom]
    source_complete=min(margins)>=4
    if not source_complete:
        source_incomplete.append(concept)

    # Preserve the exact foreground pixels selected from the protected source.
    obj=cut.crop(bbox)
    canvas=Image.new("RGBA",(1024,1024),(0,0,0,0))
    x=(1024-obj.width)//2
    y=(1024-obj.height)//2
    canvas.alpha_composite(obj,(x,y))
    out_name=f"repair-{concept.lower().replace('â','a').replace('é','e').replace('è','e').replace('ê','e').replace('ï','i').replace('ô','o').replace('ù','u')}.png"
    out_path=OUT/out_name
    canvas.save(out_path,optimize=True)

    source_pixels=sum(mask)
    repaired_pixels=sum(1 for a in canvas.getchannel("A").getdata() if a>0)
    # Exact no-loss check before/after translation: no scaling or creative edit.
    if repaired_pixels != source_pixels:
        raise RuntimeError(f"{concept}: pixel count changed {source_pixels}->{repaired_pixels}")

    src_components,src_sizes=component_count(mask,w,h)
    rep_mask=bytearray(1 if a>0 else 0 for a in canvas.getchannel("A").getdata())
    rep_components,rep_sizes=component_count(rep_mask,1024,1024)
    if rep_components != src_components or rep_sizes != src_sizes:
        raise RuntimeError(f"{concept}: component integrity changed")

    old_path=OLD/old_name
    old_components,old_sizes,old_pixels=old_alpha_components(old_path)

    audit_rows.append({
        "concept":concept,
        "candidate_id":candidate_id,
        "repair_required":repair_required,
        "source_board":str(board_path),
        "quadrant":pos,
        "background_method":method,
        "source_crop_dimensions":[w,h],
        "source_foreground_bbox":[left,top,right,bottom],
        "source_margins":margins,
        "source_complete":source_complete,
        "source_foreground_pixels":source_pixels,
        "source_components":src_components,
        "old_extraction_asset":str(old_path),
        "old_alpha_pixels":old_pixels,
        "old_alpha_components":old_components,
        "repaired_asset":str(out_path),
        "repaired_alpha_pixels":repaired_pixels,
        "repaired_components":rep_components,
        "pixel_loss_count":source_pixels-repaired_pixels,
        "component_loss_count":src_components-rep_components,
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
    raise RuntimeError("integrity loss detected")

audit={
    "schema_version":1,
    "mission":"REBULO-059",
    "root_cause":{
        "confirmed":True,
        "old_algorithm":"REBULO-058 remove_bg used GrabCut then connectedComponentsWithStats and kept only components above an area threshold and spatially near the largest component.",
        "failure_mode":"Legitimate detached drawing components could be discarded even though the remaining object no longer touched the canvas edge.",
        "repair_algorithm":"Use exact protected-source quadrant; preserve source alpha when present, otherwise remove only border-connected true background; never filter foreground components by size/proximity; copy all retained source pixels without resampling to a transparent 1024x1024 canvas."
    },
    "source_images_checked":23,
    "technical_images_checked_including_doigt":24,
    "source_actually_complete":[r["concept"] for r in repair_rows if r["source_complete"]],
    "source_already_truncated":[r["concept"] for r in repair_rows if not r["source_complete"]],
    "repaired_extractions":[r["concept"] for r in repair_rows],
    "doigt_complete":next(r for r in audit_rows if r["concept"]=="DOIGT")["source_complete"],
    "pixel_loss_comparison_method":"For each quadrant, derive one authoritative foreground mask from the protected source. The repaired file is a pure translation of that exact cropped RGBA object onto a transparent canvas, with no resampling. Foreground pixel count and 4-connected component-size multiset must match source exactly; required loss is 0.",
    "rows":audit_rows
}
Path("data/image-validation").mkdir(parents=True,exist_ok=True)
Path("data/image-validation/lot-002-extraction-repair-audit.json").write_text(json.dumps(audit,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

repair_manifest={
    "schema_version":1,
    "lot_id":"lot-002-extraction-repair",
    "title":"Lot 002 · réparation des extractions",
    "source_report":"data/image-validation/lot-002-human-2026-10-03.json",
    "candidate_status":"AWAITING_HUMAN_GRAPHIC_VALIDATION",
    "candidates":manifest
}
Path("validation-images/lots/lot-002-extraction-repair.json").write_text(json.dumps(repair_manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

print(json.dumps({
    "SOURCE_IMAGES_CHECKED":"23/23",
    "SOURCE_ACTUALLY_COMPLETE":len(audit["source_actually_complete"]),
    "REPAIRED_EXTRACTIONS":len(audit["repaired_extractions"]),
    "SOURCE_ALREADY_TRUNCATED":audit["source_already_truncated"],
    "DOIGT_COMPLETE":audit["doigt_complete"],
    "REPAIR_LOT_COUNT":len(manifest),
    "PIXEL_LOSS_TOTAL":sum(r["pixel_loss_count"] for r in audit_rows)
},ensure_ascii=False))
