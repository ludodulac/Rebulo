const JSPDF_ESM_URL='https://cdn.jsdelivr.net/npm/jspdf@2.5.2/+esm';

export function sanitizeFilePart(value='rebulo'){
  const normalized=String(value||'rebulo')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'');
  return normalized||'rebulo';
}

export function worksheetCopy(rebus,mode='pro'){
  const pieces=rebus?.pieces||[];
  if(mode==='child'){
    return {
      title:'Quel mot entends-tu ?',
      subtitle:'Prononce chaque image puis écris ta réponse.',
      showAnswer:false,
      showLabels:false,
      showIpa:false,
      answerLine:true
    };
  }
  return {
    title:rebus?.answer||'Correction',
    subtitle:'Correction orthophonique - dénominations entières et concaténation phonétique stricte.',
    showAnswer:true,
    showLabels:true,
    showIpa:true,
    answerLine:false,
    proof:`${pieces.map(piece=>piece.ipa).join(' + ')} = ${rebus?.targetIpa||''}`
  };
}

async function loadJsPDF(){
  const module=await import(JSPDF_ESM_URL);
  const ctor=module.jsPDF||module.default?.jsPDF||module.default;
  if(!ctor)throw new Error('jspdf_unavailable');
  return ctor;
}

function loadImage(src){
  return new Promise((resolve,reject)=>{
    const image=new Image();
    image.decoding='async';
    image.onload=()=>resolve(image);
    image.onerror=()=>reject(new Error(`image_load_failed:${src}`));
    image.src=src;
  });
}

async function imageUrlToPng(src,size=520){
  const image=await loadImage(src);
  const canvas=document.createElement('canvas');
  canvas.width=size;
  canvas.height=size;
  const context=canvas.getContext('2d');
  context.fillStyle='#ffffff';
  context.fillRect(0,0,size,size);
  const scale=Math.min(size/image.naturalWidth,size/image.naturalHeight)*0.82;
  const width=image.naturalWidth*scale;
  const height=image.naturalHeight*scale;
  context.drawImage(image,(size-width)/2,(size-height)/2,width,height);
  return canvas.toDataURL('image/png');
}

function textToPng(text,{width=1500,height=150,font='44px system-ui',weight='600',color='#4b5563'}={}){
  const canvas=document.createElement('canvas');
  canvas.width=width;
  canvas.height=height;
  const context=canvas.getContext('2d');
  context.fillStyle='#ffffff';
  context.fillRect(0,0,width,height);
  context.fillStyle=color;
  context.font=`${weight} ${font}`;
  context.textAlign='center';
  context.textBaseline='middle';
  context.fillText(text,width/2,height/2,width-40);
  return canvas.toDataURL('image/png');
}

function drawCenteredText(doc,text,y,{size=14,style='normal',color=[24,32,51]}={}){
  doc.setFont('helvetica',style);
  doc.setFontSize(size);
  doc.setTextColor(...color);
  doc.text(String(text),105,y,{align:'center',maxWidth:178});
}

export async function exportRebusPdf(rebus,{mode='pro'}={}){
  if(!rebus?.pieces?.length)throw new Error('missing_rebus');
  const jsPDF=await loadJsPDF();
  const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
  const copy=worksheetCopy(rebus,mode);

  doc.setFillColor(247,249,252);
  doc.rect(0,0,210,297,'F');
  doc.setFillColor(255,255,255);
  doc.roundedRect(12,12,186,273,6,6,'F');

  doc.setFont('helvetica','bold');
  doc.setFontSize(10);
  doc.setTextColor(107,114,128);
  doc.text('REBULO - PHONETIQUE STRICTE',20,24);

  drawCenteredText(doc,copy.title,42,{size:22,style:'bold'});
  drawCenteredText(doc,copy.subtitle,52,{size:10,color:[95,105,122]});

  const count=rebus.pieces.length;
  const gap=count>=4?4:7;
  const usable=174;
  const cardWidth=Math.min(count>=4?40:48,(usable-gap*(count-1))/count);
  const total=cardWidth*count+gap*(count-1);
  const startX=(210-total)/2;
  const cardY=72;
  const cardHeight=72;
  const imageSize=Math.min(34,cardWidth-8);

  const pngs=await Promise.all(rebus.pieces.map(piece=>imageUrlToPng(piece.image)));
  rebus.pieces.forEach((piece,index)=>{
    const x=startX+index*(cardWidth+gap);
    doc.setDrawColor(223,229,238);
    doc.setFillColor(255,255,255);
    doc.roundedRect(x,cardY,cardWidth,cardHeight,5,5,'FD');
    doc.addImage(pngs[index],'PNG',x+(cardWidth-imageSize)/2,cardY+9,imageSize,imageSize,undefined,'FAST');
    if(copy.showLabels){
      doc.setFont('helvetica','bold');
      doc.setFontSize(11);
      doc.setTextColor(49,58,77);
      doc.text(String(piece.reading||piece.label||''),x+cardWidth/2,cardY+60,{align:'center',maxWidth:cardWidth-5});
    }
    if(index<count-1){
      doc.setFont('helvetica','bold');
      doc.setFontSize(18);
      doc.setTextColor(122,132,150);
      doc.text('+',x+cardWidth+gap/2,cardY+39,{align:'center'});
    }
  });

  if(copy.answerLine){
    doc.setFont('helvetica','bold');
    doc.setFontSize(12);
    doc.setTextColor(49,58,77);
    doc.text('Réponse :',32,174);
    doc.setDrawColor(122,132,150);
    doc.line(56,175,176,175);
  }

  if(copy.showIpa){
    const proofImage=textToPng(copy.proof,{height:130,font:'42px system-ui',weight:'600'});
    doc.addImage(proofImage,'PNG',25,164,160,14,undefined,'FAST');
    doc.setFont('helvetica','normal');
    doc.setFontSize(9);
    doc.setTextColor(95,105,122);
    doc.text('Chaque image = un mot entier = sa prononciation entière.',105,187,{align:'center'});
  }

  doc.setDrawColor(231,235,241);
  doc.line(22,247,188,247);
  doc.setFont('helvetica','normal');
  doc.setFontSize(8);
  doc.setTextColor(107,114,128);
  doc.text(mode==='child'?'Fiche enfant - correction non affichée':'Fiche professionnelle - correction phonétique',20,257);
  doc.text('Rebulo',190,257,{align:'right'});

  const filename=`rebulo-${sanitizeFilePart(rebus.answer)}-${mode==='child'?'enfant':'pro'}.pdf`;
  doc.save(filename);
  return filename;
}
