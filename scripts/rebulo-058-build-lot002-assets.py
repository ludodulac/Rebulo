from PIL import Image, ImageDraw
import cv2, numpy as np, os, glob, shutil

OUT='assets/validation-candidates/lot-002'
SRC='/tmp/rebulo058'
os.makedirs(OUT,exist_ok=True)

S=96
BG=(0,0,0,0)
OUTLINE=(35,28,36,255)

def new(): return Image.new('RGBA',(S,S),BG)
def oe(d,box,fill,outline=OUTLINE,width=3): d.ellipse(box,fill=fill,outline=outline,width=width)
def rr(d,box,fill,outline=OUTLINE,width=3,radius=0):
    if radius:d.rounded_rectangle(box,radius=radius,fill=fill,outline=outline,width=width)
    else:d.rectangle(box,fill=fill,outline=outline,width=width)
def poly(d,pts,fill,outline=OUTLINE,width=3):
    d.polygon(pts,fill=fill); d.line(pts+[pts[0]],fill=outline,width=width,joint='curve')
def save_sprite(im,name):
    im.resize((768,768),Image.Resampling.NEAREST).save(os.path.join(OUT,name),optimize=True)

# --- 15 new mandatory REBULO PIXEL v1 designs ---
im=new();d=ImageDraw.Draw(im); wood1=(170,92,48,255);wood2=(212,132,67,255);metal=(65,70,78,255)
poly(d,[(18,30),(76,30),(73,39),(21,39)],wood2); poly(d,[(20,42),(74,42),(72,50),(22,50)],wood1); poly(d,[(16,52),(76,52),(69,62),(24,62)],wood2)
poly(d,[(25,60),(33,60),(30,81),(22,81)],metal); poly(d,[(63,59),(70,59),(74,80),(66,80)],metal)
for pts in [[(17,48),(15,61),(24,62)],[(76,48),(79,60),(70,62)]]:
    d.line(pts,fill=OUTLINE,width=4); d.line(pts,fill=(108,111,116,255),width=2)
save_sprite(im,'mandatory-banc.png')

im=new();d=ImageDraw.Draw(im);frame=(125,74,44,255);sheet=(53,119,178,255);pillow=(242,237,214,255);blanket=(68,145,201,255)
rr(d,(18,30,28,74),frame);poly(d,[(24,42),(74,42),(78,66),(26,66)],frame);poly(d,[(28,39),(72,39),(75,58),(28,58)],sheet);rr(d,(30,41,46,50),pillow,radius=3)
d.rectangle((47,41,72,57),fill=blanket);d.line([(47,41),(72,41),(72,57)],fill=(39,86,130,255),width=2);rr(d,(25,65,30,80),frame);rr(d,(69,64,74,79),frame)
save_sprite(im,'mandatory-lit.png')

im=new();d=ImageDraw.Draw(im);skin=(220,160,126,255);skin2=(238,185,148,255);dark=(142,92,74,255)
oe(d,(40,7,56,23),skin2);rr(d,(44,21,52,28),skin);poly(d,[(37,27),(59,27),(64,48),(58,60),(38,60),(32,48)],skin2)
poly(d,[(34,29),(27,33),(22,55),(28,57),(38,40)],skin2);poly(d,[(61,29),(68,33),(74,55),(68,57),(58,40)],skin2)
poly(d,[(38,58),(47,58),(45,86),(37,86),(34,65)],skin2);poly(d,[(49,58),(58,58),(62,65),(59,86),(51,86)],skin2)
d.line([(48,31),(48,55)],fill=dark,width=1);d.line([(40,38),(56,38)],fill=dark,width=1);d.line([(41,44),(55,44)],fill=dark,width=1)
save_sprite(im,'mandatory-corps.png')

im=new();d=ImageDraw.Draw(im);glass=(219,241,248,180);blue=(46,151,224,230);blue2=(92,192,245,220)
poly(d,[(25,25),(70,25),(65,76),(30,76)],glass);d.polygon([(29,43),(67,43),(63,72),(33,72)],fill=blue);d.line([(29,43),(67,43)],fill=(195,239,255,255),width=2)
poly(d,[(51,12),(45,21),(47,27),(51,30),(55,27),(57,21)],blue2);d.arc((35,35,60,48),180,350,fill=(235,251,255,255),width=2)
save_sprite(im,'mandatory-eau.png')

im=new();d=ImageDraw.Draw(im);wood=(150,88,46,255);wood2=(211,140,72,255);rope=(205,184,138,255);flag=(211,64,49,255)
rr(d,(44,10,52,84),wood);d.rectangle((47,12,49,82),fill=wood2);rr(d,(23,31,73,38),wood2)
for a,b in [((25,36),(45,79)),((71,36),(51,79))]:
    d.line([a,b],fill=OUTLINE,width=2);d.line([a,b],fill=rope,width=1)
poly(d,[(52,13),(70,18),(52,24)],flag);rr(d,(39,82,57,87),wood2)
save_sprite(im,'mandatory-mat.png')

im=new();d=ImageDraw.Draw(im);sole=(68,75,88,255);hi=(121,132,145,255);arrow=(219,73,55,255)
for pts in [[(24,58),(30,45),(36,40),(41,43),(43,56),(40,67),(33,76),(27,75),(22,67)],[(52,38),(58,25),(64,20),(69,23),(71,36),(68,47),(61,56),(55,55),(50,47)]]: poly(d,pts,sole)
d.line([(28,51),(39,49)],fill=hi,width=2);d.line([(25,61),(40,59)],fill=hi,width=2);d.line([(56,31),(68,29)],fill=hi,width=2);d.line([(53,42),(68,40)],fill=hi,width=2)
poly(d,[(70,64),(80,64),(80,59),(90,70),(80,81),(80,76),(70,76)],arrow,width=2)
save_sprite(im,'mandatory-pas.png')

im=new();d=ImageDraw.Draw(im);crumb=(246,225,175,255);crumb2=(255,241,205,255);crust=(167,89,45,255);hole=(201,172,122,255)
poly(d,[(20,40),(28,27),(42,20),(58,22),(74,34),(78,51),(68,67),(50,74),(31,68),(18,55)],crumb)
poly(d,[(20,40),(25,31),(30,28),(34,66),(28,64),(18,55)],crust,width=2);d.polygon([(36,26),(58,26),(69,37),(64,43),(43,40)],fill=crumb2)
for x,y in [(45,49),(58,55),(38,58),(64,42),(50,33),(30,47)]: d.rectangle((x,y,x+3,y+2),fill=hole)
save_sprite(im,'mandatory-mie.png')

im=new();d=ImageDraw.Draw(im);terra=(195,93,49,255);terra2=(232,127,69,255);shade=(129,63,43,255)
oe(d,(25,24,71,39),terra2);poly(d,[(28,32),(68,32),(62,73),(35,73)],terra);d.rectangle((35,39,62,68),fill=terra2);d.line([(36,65),(61,65)],fill=shade,width=2);rr(d,(22,27,74,38),terra2,radius=3);d.ellipse((28,29,68,35),fill=(82,47,39,255))
save_sprite(im,'mandatory-pot.png')

im=new();d=ImageDraw.Draw(im);ray=(86,121,144,255);ray2=(133,173,194,255);eye=(20,22,28,255)
poly(d,[(47,24),(34,30),(22,41),(15,52),(28,57),(40,54),(47,68),(54,54),(68,58),(82,51),(74,40),(61,30)],ray)
d.polygon([(47,28),(34,35),(25,45),(39,48),(47,43),(56,48),(71,45),(60,35)],fill=ray2);d.line([(47,66),(48,84),(54,90)],fill=OUTLINE,width=4);d.line([(47,66),(48,84),(54,90)],fill=ray,width=2);d.ellipse((39,39,42,42),fill=eye);d.ellipse((53,39,56,42),fill=eye)
save_sprite(im,'mandatory-raie.png')

im=new();d=ImageDraw.Draw(im);tile1=(214,180,129,255);grout=(105,82,69,255);arr=(217,73,55,255)
poly(d,[(15,35),(80,35),(72,75),(23,75)],tile1)
for x in [31,48,65]: d.line([(x,36),(x-3,74)],fill=grout,width=2)
d.line([(18,53),(77,53)],fill=grout,width=2);poly(d,[(44,14),(52,14),(52,24),(59,24),(48,34),(37,24),(44,24)],arr,width=2)
save_sprite(im,'mandatory-sol.png')

im=new();d=ImageDraw.Draw(im);stone1=(103,109,116,255);stone2=(143,148,152,255);stone3=(83,88,96,255)
for box,fill in [((18,58,38,75),stone2),((33,55,55,76),stone1),((51,58,75,76),stone2),((27,44,50,62),stone3),((46,41,68,61),stone1),((36,29,59,49),stone2)]: oe(d,box,fill,width=2)
save_sprite(im,'mandatory-tas.png')

im=new();d=ImageDraw.Draw(im);soil=(126,73,42,255);soil2=(165,96,48,255);soil3=(91,52,35,255)
poly(d,[(13,67),(21,54),(31,49),(36,39),(46,34),(58,37),(66,45),(76,49),(84,65),(81,73),(16,73)],soil)
for box,fill in [((29,50,40,58),soil2),((50,45,61,54),soil3),((63,56,74,64),soil2),((40,60,51,68),soil3)]: oe(d,box,fill,width=1)
d.line([(47,35),(44,27),(39,24)],fill=(201,157,95,255),width=1);d.line([(55,39),(58,30),(63,26)],fill=(201,157,95,255),width=1)
save_sprite(im,'mandatory-terre.png')

im=new();d=ImageDraw.Draw(im);stone=(151,140,127,255);stone2=(185,174,156,255)
rr(d,(30,25,67,82),stone)
for x in [29,39,50,60]: rr(d,(x,18,x+9,30),stone2,width=2)
rr(d,(43,60,54,82),(63,54,50,255),width=2,radius=3);rr(d,(42,37,55,49),(64,84,103,255),width=2,radius=2)
for y in [34,53,69]: d.line([(32,y),(65,y)],fill=(105,98,91,255),width=1)
save_sprite(im,'mandatory-tour.png')

im=new();d=ImageDraw.Draw(im);gold=(209,147,48,255);gold2=(246,193,74,255)
poly(d,[(61,27),(78,22),(83,26),(76,40),(63,43)],gold2);d.ellipse((26,31,64,69),outline=OUTLINE,width=7);d.ellipse((26,31,64,69),outline=gold,width=4);d.ellipse((36,41,57,61),outline=OUTLINE,width=6);d.ellipse((36,41,57,61),outline=gold2,width=3)
d.line([(57,46),(68,37),(76,30)],fill=OUTLINE,width=7);d.line([(57,46),(68,37),(76,30)],fill=gold2,width=4);d.line([(28,50),(18,45),(15,46)],fill=OUTLINE,width=5);d.line([(28,50),(18,45),(15,46)],fill=gold2,width=2)
for x in [39,46,53]: rr(d,(x,27,x+4,38),gold2,width=1)
save_sprite(im,'mandatory-cor.png')

im=new();d=ImageDraw.Draw(im);ink=(34,33,38,255);note=(49,102,178,255);accent=(220,73,56,255)
for y in [24,30,36,42,48]: d.line([(14,y),(82,y)],fill=ink,width=1)
d.arc((16,19,30,49),30,320,fill=ink,width=2);d.line([(23,19),(23,55)],fill=ink,width=2);d.ellipse((19,39,27,47),outline=ink,width=2);d.line([(36,58),(58,58)],fill=ink,width=2);oe(d,(43,54,54,62),note,width=2);d.line([(53,56),(53,35)],fill=OUTLINE,width=3);d.line([(53,56),(53,35)],fill=note,width=1)
def pl(pattern,x,y):
    for yy,row in enumerate(pattern):
        for xx,v in enumerate(row):
            if v=='1': d.rectangle((x+xx*2,y+yy*2,x+xx*2+1,y+yy*2+1),fill=accent)
pl(["11110","10001","10001","10001","10001","10001","11110"],33,71);pl(["01110","10001","10001","10001","10001","10001","01110"],48,71)
save_sprite(im,'mandatory-do.png')

# Deterministic CARRÉ alpha-only transform from exact prior candidate
src=Image.open('assets/validation-candidates/lot-001-rattrapage/carre.jpg').convert('RGB')
a=np.array(src); mx=a.max(axis=2); mn=a.min(axis=2); chrom=mx-mn
bg=((mx<=22)&(chrom<=12)) | (mx<=12)
rgba=np.dstack([a,np.where(bg,0,255).astype(np.uint8)])
Image.fromarray(rgba,'RGBA').save(os.path.join(OUT,'mandatory-carre-transparent.png'),optimize=True)

def optimize_rgba(src,dst,max_size=512,colors=128):
    im=Image.open(src).convert('RGBA'); w,h=im.size; scale=min(1.0,max_size/max(w,h))
    if scale<1: im=im.resize((round(w*scale),round(h*scale)),Image.Resampling.NEAREST)
    canvas=Image.new('RGBA',(max_size,max_size),(0,0,0,0)); canvas.alpha_composite(im,((max_size-im.width)//2,(max_size-im.height)//2))
    canvas.quantize(colors=colors,method=Image.Quantize.FASTOCTREE,dither=Image.Dither.NONE).save(dst,optimize=True)

# Existing unvalidated Drive candidates
for key in ['bas','boue','saut','cou','sang','veau','fee']:
    optimize_rgba(os.path.join(SRC,key+'.png'),os.path.join(OUT,f'additional-{key}-drive.png'),512,128)

def remove_bg(pil):
    rgba=np.array(pil.convert('RGBA')); rgb=rgba[:,:,:3]; h,w=rgb.shape[:2]
    hsv=cv2.cvtColor(rgb,cv2.COLOR_RGB2HSV); v=hsv[:,:,2]; s=hsv[:,:,1]
    mask=np.full((h,w),cv2.GC_PR_BGD,np.uint8); b=max(5,min(h,w)//80)
    mask[:b,:]=cv2.GC_BGD;mask[-b:,:]=cv2.GC_BGD;mask[:,:b]=cv2.GC_BGD;mask[:,-b:]=cv2.GC_BGD
    mask[(v<20)&(s<100)]=cv2.GC_BGD; mask[((v>85)&(s>25))|(v>155)]=cv2.GC_PR_FGD; mask[rgba[:,:,3]==0]=cv2.GC_BGD
    bgd=np.zeros((1,65),np.float64);fgd=np.zeros((1,65),np.float64);cv2.grabCut(rgb,mask,None,bgd,fgd,6,cv2.GC_INIT_WITH_MASK)
    fm=np.where((mask==cv2.GC_FGD)|(mask==cv2.GC_PR_FGD),1,0).astype(np.uint8)
    n,lab,stats,cents=cv2.connectedComponentsWithStats(fm,8); comps=[]
    for i in range(1,n):
        area=stats[i,cv2.CC_STAT_AREA]
        if area>80: comps.append((area,i,stats[i].copy(),cents[i].copy()))
    comps.sort(reverse=True)
    if not comps: return Image.fromarray(rgba)
    largest,li,lst,lc=comps[0];x,y,ww,hh=lst[:4];ex0=max(0,x-int(.2*ww));ey0=max(0,y-int(.2*hh));ex1=min(w,x+ww+int(.2*ww));ey1=min(h,y+hh+int(.2*hh))
    keep=np.zeros_like(fm)
    for area,i,st,cent in comps:
        cx,cy=cent
        if i==li or (area>=max(80,.01*largest) and ex0<=cx<=ex1 and ey0<=cy<=ey1): keep[lab==i]=1
    keep=cv2.morphologyEx(keep,cv2.MORPH_CLOSE,np.ones((3,3),np.uint8),iterations=1);keep=cv2.dilate(keep,np.ones((3,3),np.uint8),iterations=1)
    out=rgba.copy();out[:,:,3]=(keep*255).astype(np.uint8);return Image.fromarray(out)

Q={'TL':(0,0,744,488),'TR':(792,0,1536,488),'BL':(0,536,744,1024),'BR':(792,536,1536,1024)}
def extract(board_path,pos,dst):
    board=Image.open(board_path).convert('RGBA'); trans=remove_bg(board.crop(Q[pos])); bb=trans.getchannel('A').getbbox(); obj=trans.crop(bb)
    canvas=Image.new('RGBA',(768,768),(0,0,0,0)); scale=min(1,620/max(obj.size))
    if scale<1: obj=obj.resize((round(obj.width*scale),round(obj.height*scale)),Image.Resampling.NEAREST)
    canvas.alpha_composite(obj,((768-obj.width)//2,(768-obj.height)//2))
    tmp='/tmp/_extract.png';canvas.save(tmp,optimize=True);optimize_rgba(tmp,os.path.join(OUT,dst),512,96)

jobs=[
('boardA','TL','additional-252-fourchette.png'),('boardA','TR','additional-262-tigre.png'),('boardA','BL','additional-281-abeille.png'),('boardA','BR','additional-254-casque.png'),
('boardB','TL','additional-172-valise.png'),('boardB','TR','additional-178-oreille.png'),('boardB','BL','additional-185-cochon.png'),('boardB','BR','additional-248-homard.png'),
('boardC','TR','additional-149-bouteille.png'),('boardC','BR','additional-173-gateau.png'),
('boardD','TL','additional-002-vent.png'),('boardD','BL','additional-080-doigt.png'),('boardD','BR','additional-093-ballon.png'),
('boardE','TL','additional-290-beurre.png'),('boardE','TR','additional-292-botte.png'),('boardE','BL','additional-353-oignon.png'),('boardE','BR','additional-377-cerf.png'),
('boardF','TR','additional-110-carte.png'),('boardF','BL','additional-118-roc.png'),('boardF','BR','additional-163-gomme.png'),
('boardG','TL','additional-081-pouce.png'),('boardG','TR','additional-088-sac.png'),('boardG','BL','additional-098-poule.png'),('boardG','BR','additional-282-ail.png'),
('boardI','BL','additional-057-lac.png'),('boardI','BR','additional-058-drap.png'),
('boardJ','TL','additional-059-sable.png')
]
for board,pos,dst in jobs: extract(os.path.join(SRC,board+'.png'),pos,dst)

files=glob.glob(os.path.join(OUT,'*.png'))
assert len(files)==50, len(files)
for p in files:
    im=Image.open(p)
    assert im.width>0 and im.height>0
print('REBULO_058_ASSETS_OK',len(files))
